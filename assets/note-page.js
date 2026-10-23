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
