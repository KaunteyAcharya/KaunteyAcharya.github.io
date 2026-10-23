/*
 * Builds the notes for the live site. Runs automatically on every push (GitHub Actions),
 * so writing a note is still just: add notes/posts/<slug>.md and push.
 *
 * Creates (only in the deployed copy, never committed):
 *   notes/<slug>/index.html   a real page per note, with its own title, description and preview tags
 *   notes/posts.json          the notes list used by the home page and the Notes page
 *   feed.xml                  RSS feed
 *   sitemap.xml               every page, for search engines
 *   .build/cards.json         input for scripts/make_cards.py (preview images in og/)
 * and marks index.html and notes.html so they link to the new note pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const SITE = 'https://kaunteyacharya.com';
const AUTHOR = 'Kauntey Acharya';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const POSTS = path.join(ROOT, 'notes', 'posts');
const EXTRA_PAGES = ['ai-stack-advisor/'];        // other sites served under this domain
const require = createRequire(import.meta.url);
const { marked } = require(path.join(ROOT, 'assets', 'vendor', 'marked.min.js'));

/* ---------- Helpers ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const fmtDate = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Same front-matter rules as parseNote() in assets/main.js
function parseNote(md, slug) {
  const meta = { slug };
  let body = md.replace(/^\uFEFF/, '');
  const fm = body.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/);
  if (fm) {
    body = body.slice(fm[0].length);
    fm[1].split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!m) return;
      const key = m[1].toLowerCase();
      let val = m[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'tags') val = val.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else if (key === 'draft') val = /^(true|yes|1)$/i.test(val);
      meta[key] = val;
    });
  }
  if (!meta.title) {
    const h = body.match(/^\s*#\s+(.+)\s*$/m);
    if (h && body.trim().startsWith('#')) { meta.title = h[1].trim(); body = body.replace(/^\s*#\s+.+\r?\n?/, ''); }
    else meta.title = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());
  }
  if (!meta.date) { const d = slug.match(/^(\d{4}-\d{2}-\d{2})/); meta.date = d ? d[1] : ''; }
  meta.date = String(meta.date).slice(0, 10);
  if (!Array.isArray(meta.tags)) meta.tags = meta.tags ? [String(meta.tags)] : [];
  if (!meta.summary) {
    const para = body.split(/\r?\n\s*\r?\n/).map(x => x.trim()).find(x => x && !/^(#|```|[-*]\s|\d+\.|>|!\[)/.test(x)) || '';
    const plain = para.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ');
    meta.summary = plain.length > 160 ? plain.slice(0, 157).replace(/\s+\S*$/, '') + '…' : plain;
  }
  return { meta, body };
}

// Markdown to HTML, keeping LaTeX intact for KaTeX (same approach as assets/notes.js)
function render(md) {
  const stash = [];
  const safe = md.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<![\\$])\$(?!\s)[^$\n]+?\$)/g,
    m => { stash.push(m); return '@@MATH' + (stash.length - 1) + '@@'; });
  let html = marked.parse(safe);
  html = html.replace(/@@MATH(\d+)@@/g, (_, i) => stash[+i].replace(/&/g, '&amp;').replace(/</g, '&lt;'));
  html = html.replace(/<a href="(https?:[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
  html = html.replace(/<img src="([^"]+)" alt="([^"]*)"([^>]*)>/g,
    '<a href="$1" target="_blank" rel="noopener" title="Open full size"><img src="$1" alt="$2"$3 loading="lazy"></a>');
  return { html, math: stash.length > 0 };
}
// Relative links point at the site root; feed readers need full addresses
const absolute = html => html.replace(/(href|src)="(?!https?:|mailto:|#|\/\/)([^"]+)"/g, (_, a, u) => `${a}="${SITE}/${u.replace(/^\.?\//, '')}"`);
const words = md => md.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;

/* ---------- Read the notes ---------- */
const notes = fs.readdirSync(POSTS)
  .filter(f => /\.md$/i.test(f) && !/^[_.]/.test(f))
  .map(f => {
    const slug = f.replace(/\.md$/i, '');
    const { meta, body } = parseNote(fs.readFileSync(path.join(POSTS, f), 'utf8'), slug);
    return { ...meta, body, mins: Math.max(1, Math.round(words(body) / 220)) };
  })
  .filter(n => !n.draft && /^[\w.-]+$/.test(n.slug) && !['posts', 'images'].includes(n.slug))
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

/* ---------- One page per note, built from notes.html so header, footer and chat stay identical ---------- */
const shell = read('notes.html');
const headStart = shell.indexOf('<link rel="icon"');          // keep icons, stylesheet and theme script
const headKeep = shell.slice(headStart, shell.indexOf('</head>'));
const top = shell.slice(shell.indexOf('<body>'), shell.indexOf('<main'));
const bottom = shell.slice(shell.indexOf('</main>') + 7)
  .replace(/<script src="assets\/vendor\/marked\.min\.js"><\/script>\s*/, '')
  .replace('<script src="assets/notes.js"></script>', '<script src="assets/note-page.js"></script>');

notes.forEach((n, i) => {
  const url = `${SITE}/notes/${n.slug}/`;
  const img = `${SITE}/og/${n.slug}.png`;
  const { html, math } = render(n.body);
  const older = notes[i + 1], newer = notes[i - 1];
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: n.title, description: n.summary, datePublished: n.date, dateModified: n.updated || n.date,
    author: { '@type': 'Person', name: AUTHOR, url: SITE + '/' }, image: img, url,
    mainEntityOfPage: url, keywords: n.tags.join(', ')
  };
  const tags = n.tags.map(t => `<a href="notes.html?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join('  ·  ');
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="../../">
<title>${esc(n.title)} | ${AUTHOR}</title>
<meta name="description" content="${esc(n.summary)}">
<meta name="author" content="${AUTHOR}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/rss+xml" title="${AUTHOR}: Notes" href="${SITE}/feed.xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${AUTHOR}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(n.title)}">
<meta property="og:description" content="${esc(n.summary)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(n.title)}">
<meta property="article:published_time" content="${n.date}">
<meta property="article:author" content="${SITE}/">
${n.tags.map(t => `<meta property="article:tag" content="${esc(t)}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(n.title)}">
<meta name="twitter:description" content="${esc(n.summary)}">
<meta name="twitter:image" content="${img}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${headKeep}</head>
${top.replace('<body>', `<body data-note="${n.slug}">`)}<main class="wrap" id="blogRoot">
  <article class="article" id="postView">
    <a class="back" href="notes.html">← All notes</a>
    <header>
      <h1 id="postTitle">${esc(n.title)}</h1>
      <p class="meta" id="postMeta"><time datetime="${n.date}">${fmtDate(n.date)}</time>  ·  ${n.mins} min read${tags ? '  ·  ' + tags : ''}</p>
    </header>
    <div class="prose" id="postBody"${math ? ' data-math' : ''}>
${html}    </div>
    <footer class="note-end">
      <div class="note-share" aria-label="Share this note">
        <span class="note-share-label">Share this note</span>
        <button type="button" class="share-native" hidden>Share…</button>
        <button type="button" class="share-copy" data-url="${url}">Copy link</button>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://x.com/intent/post?url=${encodeURIComponent(url)}&amp;text=${encodeURIComponent(n.title)}" target="_blank" rel="noopener noreferrer">X</a>
        <a href="https://wa.me/?text=${encodeURIComponent(n.title + ' ' + url)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="mailto:?subject=${encodeURIComponent(n.title)}&amp;body=${encodeURIComponent(n.summary + '\n\n' + url)}">Email</a>
      </div>
      <p class="note-follow">Thanks for reading. New notes also arrive in the <a href="feed.xml">RSS feed</a>.</p>
      <nav class="note-nav" aria-label="More notes">
        ${newer ? `<a class="note-newer" href="notes/${newer.slug}/"><span>← Newer</span>${esc(newer.title)}</a>` : '<span></span>'}
        ${older ? `<a class="note-older" href="notes/${older.slug}/"><span>Older →</span>${esc(older.title)}</a>` : '<span></span>'}
      </nav>
    </footer>
  </article>
</main>${bottom}`;
  write(`notes/${n.slug}/index.html`, page);
});

/* ---------- Notes list, feed, sitemap ---------- */
const list = notes.map(({ slug, title, date, tags, summary, mins }) => ({ slug, title, date, tags, summary, mins }));
write('notes/posts.json', JSON.stringify(list, null, 2) + '\n');

const cdata = s => '<![CDATA[' + s.replace(/]]>/g, ']]]]><![CDATA[>') + ']]>';
const rfc822 = iso => new Date(iso + 'T09:00:00+05:30').toUTCString();
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${AUTHOR}: Notes</title>
  <link>${SITE}/notes.html</link>
  <description>Notes on AI, automation, and the projects I build.</description>
  <language>en</language>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <lastBuildDate>${notes.length ? rfc822(notes[0].date) : new Date().toUTCString()}</lastBuildDate>
  <image><url>${SITE}/assets/icons/icon-512.png</url><title>${AUTHOR}: Notes</title><link>${SITE}/notes.html</link></image>
${notes.map(n => `  <item>
    <title>${esc(n.title)}</title>
    <link>${SITE}/notes/${n.slug}/</link>
    <guid isPermaLink="false">kaunteyacharya-note-${n.slug}</guid>
    <pubDate>${rfc822(n.date)}</pubDate>
    <description>${esc(n.summary)}</description>
${n.tags.map(t => `    <category>${esc(t)}</category>`).join('\n')}
    <content:encoded>${cdata(absolute(render(n.body).html))}</content:encoded>
  </item>`).join('\n')}
</channel>
</rss>
`;
write('feed.xml', feed);

const latest = notes.length ? notes[0].date : '';
const urls = [
  { loc: SITE + '/', lastmod: latest },
  { loc: SITE + '/notes.html', lastmod: latest },
  ...notes.map(n => ({ loc: `${SITE}/notes/${n.slug}/`, lastmod: n.updated || n.date })),
  ...EXTRA_PAGES.map(p => ({ loc: `${SITE}/${p}` }))
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);

/* ---------- Preview cards (drawn by make_cards.py) ---------- */
const label = d => ('Notes · ' + fmtDate(d)).toUpperCase();
write('.build/cards.json', JSON.stringify([
  { file: 'home.png', label: 'Portfolio', title: AUTHOR, summary: 'AI automation, AI strategy and consulting, and quantitative analysis.' },
  { file: 'notes.png', label: 'Notes', title: 'Notes on AI, automation, and what I am building', summary: 'Projects, explainers, and thoughts, from first principles.' },
  ...notes.map(n => ({ file: n.slug + '.png', label: label(n.date), title: n.title, summary: n.summary }))
], null, 2));

/* ---------- Tell the list pages that note pages exist ---------- */
for (const f of ['index.html', 'notes.html']) {
  const s = read(f);
  if (!s.includes('name="ka-static-notes"')) write(f, s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n<meta name="ka-static-notes" content="1">'));
}

console.log(`Built ${notes.length} note pages, feed.xml and sitemap.xml`);
