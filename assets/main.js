/* Shared behaviour: theme toggle, sticky bar, reveal, footer year, latest posts */
/* =========================================================
   Notes discovery: just drop a .md file into notes/posts/.
   The list is read live from the GitHub repo, and each file's
   front matter (title, date, tags, summary) fills the listing.
   notes/posts.json is only a backup, used if GitHub can't be reached.
   ========================================================= */
const NOTES_SOURCE = (function () {
  const host = location.hostname;                       // e.g. kaunteyacharya.github.io
  const onPages = /\.github\.io$/i.test(host);
  return {
    owner: onPages ? host.split('.')[0] : 'KaunteyAcharya',
    repo:  onPages ? host : 'kaunteyacharya.github.io',
    dir:   'notes/posts'
  };
})();

// Parse a simple front-matter block:  ---\nkey: value\n---
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
      if (key === 'tags') {
        val = val.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else if (key === 'draft') {
        val = /^(true|yes|1)$/i.test(val);
      }
      meta[key] = val;
    });
  }
  // Title fallback: first "# Heading" in the file, else the file name
  if (!meta.title) {
    const h = body.match(/^\s*#\s+(.+)\s*$/m);
    if (h && body.trim().startsWith('#')) { meta.title = h[1].trim(); body = body.replace(/^\s*#\s+.+\r?\n?/, ''); }
    else meta.title = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());
  }
  // Date fallback: a YYYY-MM-DD prefix in the file name
  if (!meta.date) { const d = slug.match(/^(\d{4}-\d{2}-\d{2})/); meta.date = d ? d[1] : ''; }
  meta.date = String(meta.date).slice(0, 10);
  if (!Array.isArray(meta.tags)) meta.tags = meta.tags ? [String(meta.tags)] : [];
  // Summary fallback: first paragraph of text
  if (!meta.summary) {
    const para = body.split(/\r?\n\s*\r?\n/).map(x => x.trim()).find(x => x && !/^(#|```|[-*]\s|\d+\.|>|!\[)/.test(x)) || '';
    const plain = para.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ');
    meta.summary = plain.length > 160 ? plain.slice(0, 157).replace(/\s+\S*$/, '') + '…' : plain;
  }
  return { meta, body };
}

function sortNotes(list) {
  return list.filter(p => !p.draft).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

let _notesPromise = null;
function loadNotes() {
  if (_notesPromise) return _notesPromise;
  const CACHE_KEY = 'ka-notes-v1', TTL = 5 * 60 * 1000;
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < TTL && Array.isArray(c.list)) return (_notesPromise = Promise.resolve(c.list));
  } catch (e) {}

  const { owner, repo, dir } = NOTES_SOURCE;
  const fromGitHub = fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dir}`, { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => { if (!r.ok) throw new Error('GitHub ' + r.status); return r.json(); })
    .then(files => {
      const mds = files.filter(f => f.type === 'file' && /\.md$/i.test(f.name) && !/^[_.]/.test(f.name));
      return Promise.all(mds.map(f => {
        const slug = f.name.replace(/\.md$/i, '');
        return fetch(`${dir}/${f.name}`, { cache: 'no-cache' })
          .then(r => r.ok ? r.text() : fetch(f.download_url).then(r2 => r2.ok ? r2.text() : null))   // new files can lag on Pages for a minute
          .then(md => md == null ? null : parseNote(md, slug).meta)
          .catch(() => null);
      }));
    })
    .then(list => sortNotes(list.filter(Boolean)));

  const fromBackup = () => fetch('notes/posts.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('posts.json ' + r.status); return r.json(); })
    .then(sortNotes);

  _notesPromise = fromGitHub
    .catch(() => fromBackup())
    .then(list => {
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), list })); } catch (e) {}
      return list;
    });
  return _notesPromise;
}

(function () {
  const root = document.documentElement;

  // ---- Theme ----
  const sun  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const KEY = 'ka-theme';
  const btn = document.getElementById('themeBtn');
  const current = () => root.getAttribute('data-ka-theme') === 'dark' ? 'dark' : 'light';

  // Remember the choice everywhere we can, so it survives page changes even if one store is blocked
  function save(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
    try { sessionStorage.setItem(KEY, t); } catch (e) {}
    try { document.cookie = KEY + '=' + t + '; path=/; max-age=31536000; SameSite=Lax'; } catch (e) {}
  }
  function hasSaved() {
    try { if (localStorage.getItem(KEY) || localStorage.getItem('theme')) return true; } catch (e) {}
    try { if (sessionStorage.getItem(KEY)) return true; } catch (e) {}
    return /(?:^|; )ka-theme=(light|dark)/.test(document.cookie);
  }
  function apply(t) {
    root.setAttribute('data-ka-theme', t);
    if (!btn) return;
    btn.innerHTML = t === 'dark' ? sun : moon;
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  apply(current());
  if (hasSaved()) save(current());   // migrate an old 'theme' key and refresh the other stores

  if (btn) btn.addEventListener('click', () => {
    const t = current() === 'dark' ? 'light' : 'dark';
    save(t);
    apply(t);
  });

  // Follow the system setting only until the visitor has made a choice
  const mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');
  if (mq && mq.addEventListener) mq.addEventListener('change', e => { if (!hasSaved()) apply(e.matches ? 'dark' : 'light'); });

  // Keep other open tabs of the site in sync
  window.addEventListener('storage', e => { if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue); });

  // ---- Top bar border on scroll ----
  const bar = document.querySelector('.topbar');
  const onScroll = () => bar && bar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Reveal on scroll ----
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add('in'));
  }

  // ---- Footer year ----
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // ---- Latest notes teaser (index.html) ----
  const teaser = document.getElementById('latestPosts');
  if (teaser) {
    loadNotes()
      .then(posts => {
        posts = posts.slice(0, 3);
        if (!posts.length) { teaser.innerHTML = '<li class="empty">First notes coming soon.</li>'; return; }
        teaser.innerHTML = '';
        posts.forEach(p => teaser.appendChild(postItem(p)));
      })
      .catch(() => { teaser.innerHTML = '<li class="empty">Notes load when the site is served (e.g. GitHub Pages).</li>'; });
  }
})();

/* Shared helpers, also used by notes.js */
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function postItem(p) {
  const li = document.createElement('li');
  li.className = 'post-item';
  const t = document.createElement('time');
  t.dateTime = p.date; t.textContent = formatDate(p.date);
  const div = document.createElement('div');
  const a = document.createElement('a');
  a.href = 'notes.html?post=' + encodeURIComponent(p.slug);
  a.textContent = p.title;
  div.appendChild(a);
  if (p.summary) { const s = document.createElement('p'); s.textContent = p.summary; div.appendChild(s); }
  li.append(t, div);
  return li;
}
