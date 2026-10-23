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
