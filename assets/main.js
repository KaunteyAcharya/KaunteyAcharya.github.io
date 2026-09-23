/* Shared behaviour: theme toggle, sticky bar, reveal, footer year, latest posts */
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

  // ---- Latest posts teaser (index.html) ----
  const teaser = document.getElementById('latestPosts');
  if (teaser) {
    fetch('notes/posts.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(posts => {
        posts = posts.filter(p => !p.draft).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
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
