/* A single note page (notes/<slug>/). The text is already on the page; this only renders maths. */
(function () {
  const body = document.getElementById('postBody');
  if (!body || !body.hasAttribute('data-math')) return;

  const base = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
  // KaTeX's HTML output needs its stylesheet. If it can't load, fall back to the
  // browser's built-in MathML so equations never render half-styled.
  const cssReady = new Promise(res => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = base + 'katex.min.css';
    css.onload = () => res(true); css.onerror = () => res(false);
    setTimeout(() => res(false), 4000);
    document.head.appendChild(css);
  });
  const load = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.defer = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  Promise.all([cssReady, load(base + 'katex.min.js').then(() => load(base + 'contrib/auto-render.min.js'))])
    .then(([cssOk]) => {
      renderMathInElement(body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        output: cssOk ? 'htmlAndMathml' : 'mathml',
        throwOnError: false
      });
      body.classList.toggle('math-native', !cssOk);
    })
    .catch(() => {}); // maths stays readable as raw LaTeX if the CDN is unreachable
})();

/* Share buttons at the end of a note */
(function () {
  const box = document.querySelector('.note-share');
  if (!box) return;
  const url = box.querySelector('.share-copy').dataset.url;
  const title = document.querySelector('#postTitle').textContent;

  // Phones (and some desktops) have a built-in share sheet: offer it first
  const native = box.querySelector('.share-native');
  if (navigator.share) {
    native.hidden = false;
    native.addEventListener('click', () => navigator.share({ title, url }).catch(() => {}));
  }

  const copy = box.querySelector('.share-copy');
  copy.addEventListener('click', () => {
    const done = () => { copy.textContent = 'Link copied ✓'; setTimeout(() => (copy.textContent = 'Copy link'), 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('Copy this link:', url));
    else prompt('Copy this link:', url);
  });
})();


/* A link to another note opens in a new tab, so a reader following a cross-reference
   mid-article keeps their place. Links within this page still scroll normally. */
(function () {
  const body = document.getElementById('postBody');
  if (!body) return;
  const here = location.pathname.replace(/\/+$/, '');
  body.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:|#)/.test(href)) return;   // external links already open in a new tab
    let url;
    try { url = new URL(a.href); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname.replace(/\/+$/, '') === here) return;     // same page, just scroll
    if (!/\/notes\//.test(url.pathname)) return;               // only note-to-note links
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();

/* Arriving at #step-6 from another tab: make the target obvious for a moment */
(function () {
  const flash = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('target-flash');
    void el.offsetWidth;
    el.classList.add('target-flash');
  };
  window.addEventListener('hashchange', flash);
  if (location.hash) setTimeout(flash, 60);
})();

/* Contents rail: mark the section currently on screen, so the bars say where you are */
(function () {
  const rail = document.querySelector('.note-rail');
  if (!rail) return;
  const links = [].slice.call(rail.querySelectorAll('a.rl'));
  const targets = links.map(a => document.getElementById(a.getAttribute('href').split('#')[1] || ''));
  if (targets.some(t => !t)) return;
  let queued = false;
  const mark = () => {
    queued = false;
    let i = 0;
    targets.forEach((t, k) => { if (t.getBoundingClientRect().top <= 120) i = k; });
    links.forEach((a, k) => a.classList.toggle('here', k === i));
  };
  addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(mark); }
  }, { passive: true });
  addEventListener('resize', mark, { passive: true });
  mark();
})();

/* Interactive figures in the "AI from Scratch" notes: load their script only on pages that have them */
(function () {
  if (!document.querySelector('.fs-widget')) return;
  const s = document.createElement('script');
  s.src = 'assets/fromscratch.js'; s.defer = true;
  document.head.appendChild(s);
})();

