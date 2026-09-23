/* =========================================================
   Notes engine: no build step.
   Each note is one file: notes/posts/<slug>.md with front matter
   (title, date, tags, summary). The list is discovered automatically;
   see loadNotes() in main.js.
   ========================================================= */
(function () {
  const params = new URLSearchParams(location.search);
  const slug = params.get('post');
  const listView = document.getElementById('listView');
  const postView = document.getElementById('postView');

  if (slug) showPost(slug);
  else loadNotes()
    .then(showList)
    .catch(err => {
      console.error(err);
      document.getElementById('allPosts').innerHTML =
        '<li class="empty">Couldn’t load notes. If you opened this file directly from disk, serve the folder instead (GitHub Pages, or <code>python -m http.server</code>).</li>';
    });

  /* ---------- List ---------- */
  function showList(posts) {
    const ul = document.getElementById('allPosts');
    const bar = document.getElementById('filters');
    const tags = [...new Set(posts.flatMap(p => p.tags || []))].sort();
    let active = params.get('tag');

    function render() {
      ul.innerHTML = '';
      const shown = active ? posts.filter(p => (p.tags || []).includes(active)) : posts;
      if (!shown.length) { ul.innerHTML = '<li class="empty">No notes yet.</li>'; return; }
      shown.forEach(p => ul.appendChild(postItem(p)));
    }
    function button(label, value) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.setAttribute('aria-pressed', String(active === value));
      b.addEventListener('click', () => {
        active = value;
        bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        const u = new URL(location); value ? u.searchParams.set('tag', value) : u.searchParams.delete('tag');
        history.replaceState(null, '', u);
        render();
      });
      return b;
    }
    if (tags.length > 1) {
      bar.appendChild(button('All', null));
      tags.forEach(t => bar.appendChild(button(t, t)));
    }
    render();
  }

  /* ---------- Single post ---------- */
  function showPost(slug) {
    listView.hidden = true;
    postView.hidden = false;
    const title = document.getElementById('postTitle');
    const metaEl = document.getElementById('postMeta');
    const body = document.getElementById('postBody');
    const notFound = () => {
      title.textContent = 'Note not found';
      body.innerHTML = '<p>That note doesn’t exist (yet). <a href="notes.html">See all notes →</a></p>';
    };
    if (!/^[\w.-]+$/.test(slug)) return notFound();

    fetch('notes/posts/' + slug + '.md', { cache: 'no-cache' })
      .then(r => {
        if (r.ok) return r.text();
        // A just-uploaded note can take a minute to reach GitHub Pages; read it from the repo meanwhile
        const { owner, repo, dir } = NOTES_SOURCE;
        return fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${dir}/${slug}.md`)
          .then(r2 => r2.ok ? r2.text() : null).catch(() => null);
      })
      .then(raw => {
        if (raw == null) return notFound();
        const { meta, body: md } = parseNote(raw, slug);
        title.textContent = meta.title;
        document.title = meta.title + ' | Kauntey Acharya';
        const desc = document.querySelector('meta[name="description"]');
        if (desc && meta.summary) desc.content = meta.summary;

        const words = md.split(/\s+/).filter(Boolean).length;
        const mins = Math.max(1, Math.round(words / 220));
        metaEl.textContent = [meta.date ? formatDate(meta.date) : '', mins + ' min read', ...meta.tags].filter(Boolean).join('  ·  ');

        // Protect math from the Markdown parser, then restore it for KaTeX
        const stash = [];
        const protectedMd = md.replace(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<![\\$])\$(?!\s)[^$\n]+?\$)/g,
          m => { stash.push(m); return '@@MATH' + (stash.length - 1) + '@@'; });
        let html = marked.parse(protectedMd);
        html = html.replace(/@@MATH(\d+)@@/g, (_, i) => stash[+i].replace(/&/g, '&amp;').replace(/</g, '&lt;'));
        body.innerHTML = html;

        body.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
        body.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; });
        if (stash.length) loadMath(body);
      })
      .catch(() => { body.innerHTML = '<p class="empty">Couldn’t load this note.</p>'; });
  }

  /* ---------- KaTeX, loaded only when a post contains math ---------- */
  function loadMath(el) {
    const base = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = base + 'katex.min.css';
    document.head.appendChild(css);
    loadScript(base + 'katex.min.js')
      .then(() => loadScript(base + 'contrib/auto-render.min.js'))
      .then(() => renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      }))
      .catch(() => {}); // math stays readable as raw LaTeX if the CDN is unreachable
  }
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.defer = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
})();
