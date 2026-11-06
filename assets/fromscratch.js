/* Interactive figures for the "AI from Scratch" notes.
 * A note places <div class="fs-widget" data-widget="NAME">fallback text</div>; this script swaps
 * the fallback for a live figure. Without JavaScript (and in feed readers) the fallback stays. */
(function () {
  if (window.__fsWidgets) return;
  window.__fsWidgets = true;

  /* ---------- Styles (uses the site's colour tokens, so light and dark mode follow the theme) ---------- */
  const css = `
  :root { --fs-b: #B4532A; }
  :root[data-ka-theme="dark"] { --fs-b: #E58C5F; }
  .fs-widget { border: 1px solid var(--line); border-radius: 6px; padding: 1rem; margin: 1.8em 0; background: var(--surface); font-size: .9rem; line-height: 1.5; }
  .fs-widget.fs-ready > .fs-fallback { display: none; }
  .fs-live > * + * { margin-top: .7rem; }
  .fs-title { font-weight: 700; font-size: .95rem; }
  .fs-hint { color: var(--muted); font-size: .82rem; }
  .fs-row { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .fs-btn { font: inherit; font-size: .8rem; border: 1px solid var(--line); background: var(--bg); color: var(--text); padding: .3rem .6rem; border-radius: 4px; cursor: pointer; }
  .fs-btn:hover { border-color: var(--text); }
  .fs-btn[aria-pressed="true"] { background: var(--text); color: var(--bg); border-color: var(--text); }
  .fs-input { font: inherit; font-size: .9rem; border: 1px solid var(--line); background: var(--bg); color: var(--text); padding: .35rem .5rem; border-radius: 4px; width: 100%; max-width: 22rem; }
  .fs-num { width: 4.2rem; max-width: none; padding: .25rem .35rem; font-size: .82rem; }
  .fs-svg { width: 100%; height: auto; display: block; touch-action: none; user-select: none; -webkit-user-select: none; background: var(--bg); border: 1px solid var(--line); border-radius: 4px; }
  .fs-out { font-family: var(--mono, monospace); white-space: pre-wrap; overflow-wrap: anywhere; background: var(--bg); border: 1px solid var(--line); padding: .6rem .7rem; border-radius: 4px; font-size: .8rem; line-height: 1.6; }
  .fs-grid2 { display: grid; gap: .8rem; grid-template-columns: 1fr; }
  @media (min-width: 720px) { .fs-grid2 { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: start; } }
  .fs-table { border-collapse: collapse; width: 100%; font-size: .78rem; }
  .fs-table th, .fs-table td { border: 1px solid var(--line); padding: .3rem .35rem; text-align: center; }
  .fs-table th { font-weight: 700; }
  .fs-scroll { overflow-x: auto; }
  .fs-meter { position: relative; height: 10px; border: 1px solid var(--line); border-radius: 5px; background: var(--bg); }
  .fs-meter i { position: absolute; top: -4px; width: 3px; height: 16px; background: var(--fs-b); border-radius: 2px; transform: translateX(-50%); }
  .fs-meter-lbl { display: flex; justify-content: space-between; font-size: .72rem; color: var(--muted); }
  .fs-svg text { font-family: var(--mono, monospace); fill: var(--text); }
  .fs-svg .m { fill: var(--muted); }
  .fs-svg .grid { stroke: var(--line); stroke-width: 1; }
  .fs-svg .axis { stroke: var(--muted); stroke-width: 1.2; }
  .fs-svg .va { stroke: var(--text); fill: var(--text); }
  .fs-svg .vb { stroke: var(--fs-b); fill: var(--fs-b); }
  .fs-svg .tb { fill: var(--fs-b); }
  .fs-svg .faint { opacity: .25; }
  .fs-svg .band { fill: var(--muted); opacity: .26; stroke: none; }
  .fs-svg polyline { fill: none; }
  .fs-svg .handle { fill: transparent; stroke: none; cursor: grab; }
  .fs-svg .dash { stroke-dasharray: 5 4; fill: none; }
  .fs-range { width: 100%; max-width: 22rem; accent-color: var(--fs-b); }
  .fs-b-text { color: var(--fs-b); font-weight: 700; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Small helpers ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    kids.forEach(c => c != null && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }
  const fmt = (x, d = 2) => { const v = x.toFixed(d); return /^-0\.?0*$/.test(v) ? v.slice(1) : v; };
  const num = x => (Number.isInteger(x) ? String(x) : Number.isInteger(x * 10) ? fmt(x, 1) : fmt(x, 2));
  const dot = (a, b) => a.reduce((s, ai, i) => s + ai * b[i], 0);
  const norm = a => Math.sqrt(dot(a, a));
  const cos = (a, b) => { const n = norm(a) * norm(b); return n ? dot(a, b) / n : NaN; };
  const deg = r => r * 180 / Math.PI;
  function svgPoint(svg, evt) {
    const p = svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function arrow(g, x1, y1, x2, y2, cls, width = 2.5) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, hl = Math.min(12, len * .45), hw = hl * .5;
    const bx = x2 - ux * hl, by = y2 - uy * hl;
    sv('line', { x1, y1, x2: bx, y2: by, class: cls, 'stroke-width': width, 'stroke-linecap': 'round' }, g);
    sv('polygon', { points: `${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`, class: cls, 'stroke-width': 0 }, g);
  }
  function buttons(list, onPick, pressedIndex) {
    const row = h('div', { class: 'fs-row' });
    const btns = list.map((label, i) => h('button', { type: 'button', class: 'fs-btn', 'aria-pressed': String(i === pressedIndex), onclick: () => {
      if (pressedIndex != null) btns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      onPick(i);
    } }, label));
    btns.forEach(b => row.appendChild(b));
    return row;
  }
  function meter(value) {             // value in [-1, 1]
    const wrap = h('div');
    const bar = h('div', { class: 'fs-meter' });
    const tick = h('i'); bar.appendChild(tick);
    wrap.append(bar, h('div', { class: 'fs-meter-lbl' }, h('span', { text: '−1 opposite' }), h('span', { text: '0 unrelated' }), h('span', { text: '+1 same direction' })));
    wrap.set = v => { tick.style.left = isNaN(v) ? '50%' : ((v + 1) / 2 * 100) + '%'; tick.style.opacity = isNaN(v) ? .2 : 1; };
    wrap.set(value);
    return wrap;
  }

  const widgets = {};

  /* =========================================================
     1. encode: text to code points to bytes to bits
     ========================================================= */
  widgets.encode = function (root) {
    const input = h('input', { class: 'fs-input', value: 'cat', 'aria-label': 'Text to encode', maxlength: '24' });
    const out = h('div', { class: 'fs-scroll' });
    const sum = h('div', { class: 'fs-out' });
    const enc = new TextEncoder();
    function render() {
      const chars = Array.from(input.value);
      const t = h('table', { class: 'fs-table' });
      t.appendChild(h('tr', null, h('th', { text: 'character' }), h('th', { text: 'Unicode number' }), h('th', { text: 'stored as bytes (UTF-8, in bits)' })));
      let bytes = 0;
      chars.forEach(c => {
        const cp = c.codePointAt(0);
        const b = Array.from(enc.encode(c));
        bytes += b.length;
        t.appendChild(h('tr', null,
          h('td', { text: c === ' ' ? '(space)' : c }),
          h('td', { text: cp + '  (U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ')' }),
          h('td', { text: b.map(x => x.toString(2).padStart(8, '0')).join(' ') })));
      });
      out.replaceChildren(t);
      const nums = chars.map(c => c.codePointAt(0)).join(', ');
      sum.textContent = chars.length
        ? `"${input.value}" → numbers [${nums}]\n→ ${bytes} byte${bytes === 1 ? '' : 's'} = ${bytes * 8} bits (0s and 1s) in memory.\nThese numbers say WHICH characters you typed. They say nothing about what the word MEANS.`
        : 'Type something above.';
    }
    input.addEventListener('input', render);
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: how a computer stores text' }),
      h('div', { class: 'fs-hint', text: 'Type any word. Try "cat" and "Cat", or Hindi, or an emoji. Every character becomes a number, and every number becomes bits.' }),
      input,
      buttons(['cat', 'Cat', 'dog', 'café', 'नमस्ते', '🙂'], i => { input.value = ['cat', 'Cat', 'dog', 'café', 'नमस्ते', '🙂'][i]; render(); }),
      out, sum);
    render();
  };

  /* =========================================================
     2. schemes: IDs vs one-hot vs learned vectors
     ========================================================= */
  widgets.schemes = function (root) {
    const words = ['cat', 'kitten', 'dog', 'car', 'truck', 'banana'];
    const ids = { cat: 17, kitten: 4521, dog: 9402, car: 61, truck: 2210, banana: 18 };
    const learned = {
      cat: [0.92, 0.05, 0.10, 0.62], kitten: [0.88, 0.02, 0.08, 0.85], dog: [0.90, 0.10, 0.12, 0.40],
      car: [0.05, 0.95, 0.02, 0.30], truck: [0.04, 0.97, 0.01, 0.10], banana: [0.10, 0.02, 0.95, 0.35]
    };
    const onehot = Object.fromEntries(words.map((w, i) => [w, words.map((_, j) => (i === j ? 1 : 0))]));
    let mode = 0, focus = 'cat';
    const vecBox = h('div', { class: 'fs-out' });
    const tableBox = h('div', { class: 'fs-scroll' });
    const verdict = h('div', { class: 'fs-out' });
    const focusRow = h('div', { class: 'fs-row' });

    function score(a, b) {
      if (mode === 0) return Math.abs(ids[a] - ids[b]);
      return cos(mode === 1 ? onehot[a] : learned[a], mode === 1 ? onehot[b] : learned[b]);
    }
    function render() {
      if (mode === 0) vecBox.textContent = words.map(w => `${w.padEnd(7)} = ${ids[w]}`).join('\n');
      else {
        const src = mode === 1 ? onehot : learned;
        vecBox.textContent = words.map(w => `${w.padEnd(7)} = [${src[w].map(x => mode === 1 ? x : x.toFixed(2)).join(', ')}]`).join('\n');
      }
      const t = h('table', { class: 'fs-table' });
      t.appendChild(h('tr', null, h('th', { text: mode === 0 ? '|difference|' : 'cosine' }), ...words.map(w => h('th', { text: w }))));
      const all = words.flatMap(a => words.map(b => score(a, b)));
      const max = Math.max(...all);
      words.forEach(a => {
        const tr = h('tr', null, h('th', { text: a }));
        words.forEach(b => {
          const v = score(a, b);
          const strength = mode === 0 ? 1 - v / max : Math.max(0, v);   // darker = "closer"
          const td = h('td', { text: mode === 0 ? String(v) : v.toFixed(2) });
          td.style.background = `color-mix(in srgb, var(--fs-b) ${Math.round(strength * 70)}%, transparent)`;
          tr.appendChild(td);
        });
        t.appendChild(tr);
      });
      tableBox.replaceChildren(t);
      const ranked = words.filter(w => w !== focus).map(w => [w, score(focus, w)])
        .sort((x, y) => mode === 0 ? x[1] - y[1] : y[1] - x[1]);
      const list = ranked.map(([w, v]) => `${w} (${mode === 0 ? v : v.toFixed(2)})`).join(', ');
      const notes = [
        `By ID numbers, the word "closest" to ${focus} is ${ranked[0][0]}. The numbering was arbitrary, so this closeness is fake.`,
        `By one-hot vectors, every pair of different words has cosine 0. Nothing is wrongly close, but nothing is close at all: the machine learns no similarity.`,
        `By learned vectors, the closest word to ${focus} is ${ranked[0][0]}. Similar things now point in similar directions.`
      ];
      verdict.textContent = `Ranked from closest to farthest from "${focus}":\n${list}\n\n${notes[mode]}`;
    }
    words.forEach(w => focusRow.appendChild(h('button', { type: 'button', class: 'fs-btn', 'aria-pressed': String(w === focus), onclick: e => {
      focus = w; focusRow.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); render();
    } }, w)));
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: three ways to give words numbers' }),
      h('div', { class: 'fs-hint', text: 'Switch the scheme, then pick a word to see which words the scheme thinks are closest. Darker cells mean "closer".' }),
      buttons(['1. ID numbers', '2. One-hot vectors', '3. Learned vectors (toy)'], i => { mode = i; render(); }, 0),
      h('div', { class: 'fs-hint', text: 'Compare against:' }), focusRow,
      vecBox, tableBox, verdict);
    render();
  };

  /* =========================================================
     3. pixels: an image is a grid of numbers; shifting it breaks raw similarity
     ========================================================= */
  widgets.pixels = function (root) {
    const N = 5, S = 44;
    const shapes = {
      plus: [0,0,1,0,0, 0,0,1,0,0, 1,1,1,1,1, 0,0,1,0,0, 0,0,1,0,0],
      L:    [0,1,0,0,0, 0,1,0,0,0, 0,1,0,0,0, 0,1,0,0,0, 0,1,1,1,0],
      soft: [0,.5,1,.5,0, .5,1,1,1,.5, 1,1,1,1,1, .5,1,1,1,.5, 0,.5,1,.5,0]
    };
    let px = shapes.plus.slice(), ref = shapes.plus.slice(), paint = 1, down = false;
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${N * S + 2} ${N * S + 2}`, role: 'img', 'aria-label': '5 by 5 pixel grid you can paint' });
    svg.style.maxWidth = '240px';
    const cells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const g = sv('g', {}, svg);
      sv('rect', { x: 1 + c * S, y: 1 + r * S, width: S, height: S, fill: 'var(--bg)', stroke: 'var(--line)' }, g);
      const fill = sv('rect', { x: 1 + c * S + 2, y: 1 + r * S + 2, width: S - 4, height: S - 4, fill: 'var(--text)' }, g);
      const t = sv('text', { x: 1 + c * S + S / 2, y: 1 + r * S + S / 2 + 4, 'text-anchor': 'middle', 'font-size': 11 }, g);
      cells.push({ fill, t });
    }
    const vec = h('div', { class: 'fs-out' });
    const sim = h('div', { class: 'fs-out' });
    function render() {
      px.forEach((v, i) => {
        cells[i].fill.setAttribute('opacity', v);
        cells[i].t.textContent = v === 0 ? '0' : v === 1 ? '1' : '.5';
        cells[i].t.setAttribute('style', v > .4 ? 'fill: var(--bg)' : '');
      });
      const rows = [];
      for (let r = 0; r < N; r++) rows.push(px.slice(r * N, r * N + N).map(v => (v === .5 ? '0.5' : String(v))).join(', '));
      vec.textContent = `As a grid:\n${rows.map(r => '[' + r + ']').join('\n')}\n\nFlattened into ONE vector of ${N}×${N} = ${N * N} numbers:\n[${px.map(v => (v === .5 ? '0.5' : v)).join(', ')}]`;
      const ink = ref.reduce((s, v) => s + v, 0);
      const kept = ref.reduce((s, v, i) => s + Math.min(v, px[i]), 0);
      sim.textContent = ink ? `Ink of the reference picture that is still in the same squares: ${num(kept)} of ${num(ink)} (${Math.round(100 * kept / ink)}%)` : 'The reference picture is blank. Draw something and press "Use current as reference".';
    }
    function at(evt) {
      const p = svgPoint(svg, evt);
      const c = Math.floor((p.x - 1) / S), r = Math.floor((p.y - 1) / S);
      return r >= 0 && r < N && c >= 0 && c < N ? r * N + c : -1;
    }
    svg.addEventListener('pointerdown', e => {
      const i = at(e); if (i < 0) return;
      paint = px[i] === 0 ? 1 : px[i] === 1 ? .5 : 0;
      px[i] = paint; down = true; svg.setPointerCapture(e.pointerId); render();
    });
    svg.addEventListener('pointermove', e => { if (!down) return; const i = at(e); if (i >= 0 && px[i] !== paint) { px[i] = paint; render(); } });
    svg.addEventListener('pointerup', () => (down = false));
    svg.addEventListener('pointercancel', () => (down = false));
    function shift() {
      const n = new Array(N * N).fill(0);
      for (let r = 0; r < N; r++) for (let c = 0; c < N - 1; c++) n[r * N + c + 1] = px[r * N + c];
      px = n; render();
    }
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: a picture is already a vector' }),
      h('div', { class: 'fs-hint', text: 'Click or drag on the grid to paint (each click cycles white, black, grey). Then press "Shift right": the same shape moved by one pixel. Watch how much of the ink still lines up.' }),
      h('div', { class: 'fs-grid2' }, h('div', null, svg), h('div', null, vec)),
      h('div', { class: 'fs-row' },
        h('button', { type: 'button', class: 'fs-btn', onclick: shift }, 'Shift right →'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { px = shapes.plus.slice(); ref = px.slice(); render(); } }, 'Load "plus"'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { px = shapes.L.slice(); ref = px.slice(); render(); } }, 'Load "L"'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { px = shapes.soft.slice(); ref = px.slice(); render(); } }, 'Load "blob"'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { ref = px.slice(); render(); } }, 'Use current as reference'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { px = new Array(N * N).fill(0); render(); } }, 'Clear')),
      sim);
    render();
  };

  /* =========================================================
     4. angle: drag two arrows; dot product, lengths, angle, cosine
     ========================================================= */
  widgets.angle = function (root) {
    const W = 400, LIM = 8, U = 23, O = W / 2;
    let a = [2, 3], b = [4, 1];
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${W} ${W}`, role: 'img', 'aria-label': 'Two draggable arrows on a grid' });
    const bg = sv('g', {}, svg), layer = sv('g', {}, svg);
    for (let i = -LIM; i <= LIM; i++) {
      sv('line', { x1: O + i * U, y1: O - LIM * U, x2: O + i * U, y2: O + LIM * U, class: i ? 'grid' : 'axis' }, bg);
      sv('line', { x1: O - LIM * U, y1: O + i * U, x2: O + LIM * U, y2: O + i * U, class: i ? 'grid' : 'axis' }, bg);
      if (i && i % 4 === 0) {
        sv('text', { x: O + i * U, y: O + 14, 'text-anchor': 'middle', 'font-size': 10, class: 'm' }, bg).textContent = i;
        sv('text', { x: O - 8, y: O - i * U + 4, 'text-anchor': 'end', 'font-size': 10, class: 'm' }, bg).textContent = i;
      }
    }
    const out = h('div', { class: 'fs-out' });
    const m = meter(0);
    const toS = v => [O + v[0] * U, O - v[1] * U];
    function render() {
      layer.replaceChildren();
      const [ax, ay] = toS(a), [bx, by] = toS(b);
      const ta = Math.atan2(a[1], a[0]), tb = Math.atan2(b[1], b[0]);
      if (norm(a) && norm(b)) {                       // angle arc
        let d = tb - ta; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const r = 28, steps = 24, pts = [];
        for (let k = 0; k <= steps; k++) { const t = ta + d * k / steps; pts.push(`${O + r * Math.cos(t)},${O - r * Math.sin(t)}`); }
        sv('polyline', { points: pts.join(' '), class: 'vb dash', 'stroke-width': 1.5, fill: 'none' }, layer);
        const mid = ta + d / 2;
        sv('text', { x: O + 44 * Math.cos(mid), y: O - 44 * Math.sin(mid) + 4, 'text-anchor': 'middle', 'font-size': 12, class: 'tb' }, layer).textContent = 'φ';
      }
      arrow(layer, O, O, ax, ay, 'va', 3);
      arrow(layer, O, O, bx, by, 'vb', 3);
      const side = x => (x > W * 0.68 ? { dx: -8, anchor: 'end' } : { dx: 8, anchor: 'start' });
      const sa = side(ax), sb = side(bx);
      sv('text', { x: ax + sa.dx, y: ay - 10, 'text-anchor': sa.anchor, 'font-size': 13, 'font-weight': 700 }, layer).textContent = `a (${num(a[0])}, ${num(a[1])})`;
      sv('text', { x: bx + sb.dx, y: by + 20, 'text-anchor': sb.anchor, 'font-size': 13, 'font-weight': 700, class: 'tb' }, layer).textContent = `b (${num(b[0])}, ${num(b[1])})`;
      [['a', ax, ay], ['b', bx, by]].forEach(([k, x, y]) => {
        sv('circle', { cx: x, cy: y, r: 5, class: k === 'a' ? 'va' : 'vb' }, layer);
        sv('circle', { cx: x, cy: y, r: 20, class: 'handle', 'data-k': k }, layer);
      });
      const d = dot(a, b), na = norm(a), nb = norm(b), c = cos(a, b);
      const ang = isNaN(c) ? NaN : deg(Math.acos(Math.max(-1, Math.min(1, c))));
      out.textContent =
        `|a| = √(${num(a[0])}² + ${num(a[1])}²) = ${fmt(na)}\n` +
        `|b| = √(${num(b[0])}² + ${num(b[1])}²) = ${fmt(nb)}\n\n` +
        `a · b = (${num(a[0])})(${num(b[0])}) + (${num(a[1])})(${num(b[1])}) = ${num(a[0] * b[0])} + ${num(a[1] * b[1])} = ${num(d)}\n\n` +
        (isNaN(c) ? 'A zero-length arrow has no direction, so the angle is undefined.' :
        `cos φ = (a · b) / (|a| |b|) = ${num(d)} / (${fmt(na)} × ${fmt(nb)}) = ${fmt(c)}\n` +
        `angle φ = ${fmt(ang, 1)}°\n\n` +
        (c > 0.95 ? 'Almost the same direction: very similar.' : c > 0.3 ? 'Pointing roughly the same way: somewhat similar.' : c > -0.3 ? 'Close to 90°: unrelated.' : 'Pointing away from each other: opposite.'));
      m.set(c);
    }
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      const k = e.target.getAttribute && e.target.getAttribute('data-k');
      if (!k) return; drag = k; svg.setPointerCapture(e.pointerId); e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = svgPoint(svg, e);
      const v = [Math.round((p.x - O) / U * 2) / 2, Math.round((O - p.y) / U * 2) / 2].map(x => Math.max(-LIM, Math.min(LIM, x)));
      if (drag === 'a') a = v; else b = v;
      render();
    });
    const stop = () => (drag = null);
    svg.addEventListener('pointerup', stop); svg.addEventListener('pointercancel', stop);
    const presets = [[[2, 3], [4, 1]], [[1, 1], [3, 3]], [[3, 1], [-1, 3]], [[2, 2], [-3, -3]]];
    const note = h('div', { class: 'fs-hint' });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: drag the arrows' }),
      h('div', { class: 'fs-hint', text: 'Drag the tip of a or b. The numbers below are recalculated by hand-style steps every time. Arrows snap to half-steps so you can check the arithmetic yourself.' }),
      h('div', { class: 'fs-grid2' }, svg, h('div', null, out, m)),
      h('div', { class: 'fs-row' },
        buttons(['Example from the text', 'Same direction', 'Perpendicular', 'Opposite'], i => { a = presets[i][0].slice(); b = presets[i][1].slice(); render(); }),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => {
          if (Math.max(Math.abs(b[0]), Math.abs(b[1])) * 2 > LIM) { note.textContent = 'b is too long to double inside this grid. Shorten it first.'; return; }
          note.textContent = ''; b = b.map(x => x * 2); render();
        } }, 'Make b longer (×2)'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { note.textContent = ''; b = b.map(x => x / 2); render(); } }, 'Make b shorter (÷2)')),
      note);
    render();
  };

  /* =========================================================
     5. cosine3d: cat, dog, car in 3D, editable, with full working
     ========================================================= */
  widgets.cosine3d = function (root) {
    const names = ['cat', 'dog', 'car'];
    const V = { cat: [0.9, 0.8, 0.1], dog: [0.8, 0.9, 0.2], car: [0.1, 0.2, 0.9] };
    let pair = ['cat', 'dog'], yaw = -0.6, pitch = 0.35;
    const W = 360, H = 300, S = 150, cx = 150, cy = 215;
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Three vectors in 3D; drag to rotate' });
    svg.style.cursor = 'grab';
    const out = h('div', { class: 'fs-out' });
    const all = h('div', { class: 'fs-out' });
    function proj([x, y, z]) {
      const x1 = x * Math.cos(yaw) - y * Math.sin(yaw), y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
      const z2 = y1 * Math.sin(pitch) + z * Math.cos(pitch);
      return [cx + S * x1, cy - S * z2];
    }
    function render() {
      svg.replaceChildren();
      const o = proj([0, 0, 0]);
      [['feature 1', [1.1, 0, 0]], ['feature 2', [0, 1.1, 0]], ['feature 3', [0, 0, 1.1]]].forEach(([lbl, e]) => {
        const p = proj(e);
        sv('line', { x1: o[0], y1: o[1], x2: p[0], y2: p[1], class: 'axis dash' }, svg);
        sv('text', { x: p[0] + 4, y: p[1] - 4, 'font-size': 10, class: 'm' }, svg).textContent = lbl;
      });
      names.forEach(n => {
        const p = proj(V[n]);
        const on = pair.includes(n);
        const cls = n === pair[0] ? 'va' : n === pair[1] ? 'vb' : 'va faint';
        const g = sv('g', { class: on ? '' : 'faint' }, svg);
        arrow(g, o[0], o[1], p[0], p[1], cls.replace(' faint', ''), 2.5);
        sv('text', { x: p[0] + 6, y: p[1] - 6, 'font-size': 13, 'font-weight': 700, class: n === pair[1] ? 'tb' : '' }, g).textContent = n;
      });
      const [A, B] = pair, a = V[A], b = V[B];
      const d = dot(a, b), na = norm(a), nb = norm(b), c = d / (na * nb);
      out.textContent =
        `Step 1. Dot product (multiply matching numbers, then add)\n` +
        `${A} · ${B} = (${a[0]})(${b[0]}) + (${a[1]})(${b[1]}) + (${a[2]})(${b[2]})\n` +
        `        = ${fmt(a[0] * b[0])} + ${fmt(a[1] * b[1])} + ${fmt(a[2] * b[2])} = ${fmt(d)}\n\n` +
        `Step 2. Lengths (Pythagoras in 3D)\n` +
        `|${A}| = √(${a[0]}² + ${a[1]}² + ${a[2]}²) = √${fmt(dot(a, a))} = ${fmt(na, 3)}\n` +
        `|${B}| = √(${b[0]}² + ${b[1]}² + ${b[2]}²) = √${fmt(dot(b, b))} = ${fmt(nb, 3)}\n\n` +
        `Step 3. Cosine similarity\n` +
        `cos = ${fmt(d)} / (${fmt(na, 3)} × ${fmt(nb, 3)}) = ${isNaN(c) ? 'undefined' : fmt(c, 3)}` +
        (isNaN(c) ? '' : `   (angle ≈ ${fmt(deg(Math.acos(Math.max(-1, Math.min(1, c)))), 1)}°)`);
      all.textContent = 'All three pairs:\n' + [['cat', 'dog'], ['cat', 'car'], ['dog', 'car']]
        .map(([x, y]) => `cos(${x}, ${y}) = ${fmt(cos(V[x], V[y]), 3)}`).join('\n');
    }
    let rot = null;
    svg.addEventListener('pointerdown', e => { rot = [e.clientX, e.clientY, yaw, pitch]; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', e => {
      if (!rot) return;
      yaw = rot[2] + (e.clientX - rot[0]) * 0.01;
      pitch = Math.max(-1.2, Math.min(1.2, rot[3] + (e.clientY - rot[1]) * 0.01));
      render();
    });
    svg.addEventListener('pointerup', () => (rot = null)); svg.addEventListener('pointercancel', () => (rot = null));
    const tbl = h('table', { class: 'fs-table' });
    tbl.appendChild(h('tr', null, h('th', { text: '' }), h('th', { text: 'f1' }), h('th', { text: 'f2' }), h('th', { text: 'f3' })));
    names.forEach(n => {
      const tr = h('tr', null, h('th', { text: n }));
      V[n].forEach((x, i) => {
        const inp = h('input', { class: 'fs-input fs-num', type: 'number', step: '0.1', min: '-1', max: '1', value: String(x), 'aria-label': `${n} feature ${i + 1}` });
        inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (!isNaN(v)) { V[n][i] = Math.max(-1, Math.min(1, v)); render(); } });
        tr.appendChild(h('td', null, inp));
      });
      tbl.appendChild(tr);
    });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: cat, dog, and car as arrows in 3D' }),
      h('div', { class: 'fs-hint', text: 'Drag the picture to rotate it. Pick a pair to compare, or change any number in the table and watch the working update.' }),
      buttons(['cat vs dog', 'cat vs car', 'dog vs car'], i => { pair = [['cat', 'dog'], ['cat', 'car'], ['dog', 'car']][i]; render(); }, 0),
      h('div', { class: 'fs-grid2' }, svg, h('div', null, tbl, all)),
      out);
    render();
  };

  /* =========================================================
     6. search: a toy 2D embedding map; click to query, see nearest neighbours
     ========================================================= */
  widgets.search = function (root) {
    const P = (angDeg, r) => [r * Math.cos(angDeg * Math.PI / 180), r * Math.sin(angDeg * Math.PI / 180)];
    const words = {
      cat: P(36, 3.6), kitten: P(42, 2.9), dog: P(27, 3.8), puppy: P(31, 3.0), wolf: P(18, 4.2), lion: P(52, 4.2),
      car: P(140, 3.8), truck: P(128, 4.3), bus: P(150, 4.0), bicycle: P(162, 3.0),
      apple: P(226, 3.6), banana: P(240, 3.4), mango: P(214, 4.0), rice: P(252, 3.8),
      happy: P(300, 3.7), glad: P(306, 3.0), sad: P(325, 3.6), angry: P(338, 3.9)
    };
    const queries = [['"small pet animal"', P(38, 2.3)], ['"something to eat"', P(234, 2.4)], ['"vehicle for goods"', P(126, 3.0)], ['"feeling low"', P(322, 2.6)]];
    const W = 400, O = 200, U = 40;
    let q = queries[0][1], qLabel = queries[0][0], qWord = null, byCos = true;
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${W} ${W}`, role: 'img', 'aria-label': 'Toy map of word vectors; click to search' });
    svg.style.cursor = 'crosshair';
    const out = h('div', { class: 'fs-out' });
    const toS = v => [O + v[0] * U, O - v[1] * U];
    function render() {
      svg.replaceChildren();
      sv('line', { x1: 0, y1: O, x2: W, y2: O, class: 'grid' }, svg);
      sv('line', { x1: O, y1: 0, x2: O, y2: W, class: 'grid' }, svg);
      const ranked = Object.entries(words).filter(([w]) => w !== qWord)
        .map(([w, v]) => [w, cos(q, v), Math.hypot(q[0] - v[0], q[1] - v[1])])
        .sort((x, y) => byCos ? y[1] - x[1] : x[2] - y[2]);
      const top = ranked.slice(0, 3).map(r => r[0]);
      const [qx, qy] = toS(q);
      top.forEach(w => { const [x, y] = toS(words[w]); arrow(svg, O, O, x, y, 'va', 1.8); });
      arrow(svg, O, O, qx, qy, 'vb', 2.5);
      Object.entries(words).forEach(([w, v]) => {
        const [x, y] = toS(v), hit = top.includes(w);
        sv('circle', { cx: x, cy: y, r: hit ? 4.5 : 3, class: 'va', opacity: hit ? 1 : .55 }, svg);
        const t = sv('text', { x: x + 6, y: y + 4, 'font-size': 11, 'font-weight': hit ? 700 : 400, opacity: hit ? 1 : .7, 'data-w': w }, svg);
        t.textContent = w; t.style.cursor = 'pointer';
      });
      sv('circle', { cx: qx, cy: qy, r: 6, class: 'vb' }, svg);
      sv('text', { x: qx + 8, y: qy - 8, 'font-size': 12, 'font-weight': 700, class: 'tb' }, svg).textContent = qWord ? qWord : 'query';
      out.textContent = `Query: ${qLabel}\nRanked by ${byCos ? 'cosine similarity (direction)' : 'straight-line distance'}:\n` +
        ranked.slice(0, 5).map((r, i) => `${i + 1}. ${r[0].padEnd(8)} cos = ${r[1].toFixed(3).padStart(6)}  angle = ${deg(Math.acos(Math.max(-1, Math.min(1, r[1])))).toFixed(0).padStart(3)}°  distance = ${r[2].toFixed(2)}`).join('\n') +
        `\n\nThis is the whole idea behind semantic search and the "retrieval" step in RAG: turn the question into a vector, then return the stored vectors that point the most the same way.`;
    }
    svg.addEventListener('pointerdown', e => {
      const w = e.target.getAttribute && e.target.getAttribute('data-w');
      if (w) { q = words[w].slice(); qWord = w; qLabel = `the word "${w}" (itself excluded)`; }
      else { const p = svgPoint(svg, e); q = [(p.x - O) / U, (O - p.y) / U]; qWord = null; qLabel = 'a point you clicked'; }
      render();
    });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: search a tiny "meaning map"' }),
      h('div', { class: 'fs-hint', text: 'A toy 2D map, hand-placed so you can see it (real models use hundreds of dimensions). Click a word, click anywhere, or try a ready-made query. The three closest words get arrows.' }),
      buttons(queries.map(x => x[0]), i => { q = queries[i][1]; qLabel = queries[i][0] + ' (placed where a model might put it)'; qWord = null; render(); }),
      h('div', { class: 'fs-row' }, h('span', { class: 'fs-hint', text: 'Rank by:' }),
        buttons(['cosine', 'distance'], i => { byCos = i === 0; render(); }, 0)),
      h('div', { class: 'fs-grid2' }, svg, out));
    render();
  };

  /* =========================================================
     sentence: the simplest sentence vector is the average of its word vectors
     ========================================================= */
  widgets.sentence = function (root) {
    const P = (angDeg, r) => [r * Math.cos(angDeg * Math.PI / 180), r * Math.sin(angDeg * Math.PI / 180)];
    const words = {
      cat: P(36, 3.6), kitten: P(42, 2.9), dog: P(27, 3.8), puppy: P(31, 3.0),
      car: P(140, 3.8), truck: P(128, 4.3), bus: P(150, 4.0),
      apple: P(226, 3.6), banana: P(240, 3.4), rice: P(252, 3.8),
      happy: P(300, 3.7), sad: P(325, 3.6),
      chased: P(25, 1.8), ate: P(235, 2.0), drove: P(145, 2.0),
      the: [0.15, 0.1], a: [0.1, 0.15], my: [-0.1, 0.12], is: [0.12, -0.1], very: [-0.12, -0.1]
    };
    const presets = ['the cat chased the dog', 'the dog chased the cat', 'my puppy ate a banana', 'the sad kitten', 'a very happy puppy'];
    let sent = presets[0].split(' ').filter(w => words[w]);
    const W = 400, O = 200, U = 40;
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${W} ${W}`, role: 'img', 'aria-label': 'Toy word map with the average of the chosen words' });
    const out = h('div', { class: 'fs-out' });
    const toS = v => [O + v[0] * U, O - v[1] * U];
    function render() {
      svg.replaceChildren();
      sv('line', { x1: 0, y1: O, x2: W, y2: O, class: 'grid' }, svg);
      sv('line', { x1: O, y1: 0, x2: O, y2: W, class: 'grid' }, svg);
      sent.forEach(w => { const [x, y] = toS(words[w]); sv('line', { x1: O, y1: O, x2: x, y2: y, class: 'va', 'stroke-width': 1, opacity: .45 }, svg); });
      Object.entries(words).forEach(([w, v]) => {
        if (Math.hypot(v[0], v[1]) < .5) return;            // tiny words sit at the centre; drawn below
        const [x, y] = toS(v), on = sent.includes(w);
        sv('circle', { cx: x, cy: y, r: on ? 4.5 : 3, class: 'va', opacity: on ? 1 : .45 }, svg);
        sv('text', { x: x + 6, y: y + 4, 'font-size': 11, 'font-weight': on ? 700 : 400, opacity: on ? 1 : .6 }, svg).textContent = w;
      });
      sv('text', { x: O + 6, y: O + 16, 'font-size': 10, class: 'm' }, svg).textContent = 'the, a, my, is, very';
      sv('circle', { cx: O, cy: O, r: 3, class: 'va', opacity: .6 }, svg);
      if (!sent.length) { out.textContent = 'Click words to build a sentence.'; return; }
      const sum = sent.reduce((s, w) => [s[0] + words[w][0], s[1] + words[w][1]], [0, 0]);
      const avg = [sum[0] / sent.length, sum[1] / sent.length];
      const [ax, ay] = toS(avg);
      arrow(svg, O, O, ax, ay, 'vb', 2.8);
      sv('text', { x: ax + 8, y: ay - 8, 'font-size': 12, 'font-weight': 700, class: 'tb' }, svg).textContent = 'sentence';
      out.textContent = `Sentence: "${sent.join(' ')}"\n\n` +
        sent.map(w => `${w.padEnd(7)} (${fmt(words[w][0], 1).padStart(4)}, ${fmt(words[w][1], 1).padStart(4)})`).join('\n') +
        `\n\nAdd them:      (${fmt(sum[0], 1)}, ${fmt(sum[1], 1)})\nDivide by ${sent.length}:   (${fmt(avg[0], 2)}, ${fmt(avg[1], 2)})  ← the sentence vector`;
    }
    const chips = h('div', { class: 'fs-row' });
    Object.keys(words).forEach(w => chips.appendChild(h('button', { type: 'button', class: 'fs-btn', onclick: () => { sent.push(w); render(); } }, w)));
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: build a sentence vector by averaging' }),
      h('div', { class: 'fs-hint', text: 'Toy 2D word positions (the same kind of map as later in this note). Pick a sentence, or click words to build your own. The orange arrow is the average of the word arrows. Compare the first two sentences.' }),
      buttons(presets, i => { sent = presets[i].split(' ').filter(w => words[w]); render(); }, 0),
      chips,
      h('div', { class: 'fs-row' },
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { sent.pop(); render(); } }, 'Undo last word'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { sent = []; render(); } }, 'Clear')),
      h('div', { class: 'fs-grid2' }, svg, out));
    render();
  };

  /* =========================================================
     7. analogy: king - man + woman
     ========================================================= */
  widgets.analogy = function (root) {
    const words = { man: [1.0, 1.0], woman: [1.2, 3.0], king: [4.6, 1.2], queen: [4.7, 3.2], uncle: [2.8, 0.5], aunt: [2.9, 2.6], boy: [0.3, 1.8], girl: [0.4, 3.7] };
    const sets = [['king', 'man', 'woman'], ['uncle', 'man', 'woman'], ['queen', 'woman', 'man'], ['girl', 'woman', 'man']];
    let set = 0, step = 3;
    const W = 400, H = 300, U = 60, ox = 40, oy = 270;
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Word analogy as vector arithmetic' });
    const out = h('div', { class: 'fs-out' });
    const toS = v => [ox + v[0] * U, oy - v[1] * U];
    function render() {
      svg.replaceChildren();
      const [C, A, B] = sets[set];
      const res = [words[C][0] - words[A][0] + words[B][0], words[C][1] - words[A][1] + words[B][1]];
      Object.entries(words).forEach(([w, v]) => {
        const [x, y] = toS(v), on = [A, B, C].includes(w);
        sv('circle', { cx: x, cy: y, r: 4, class: 'va', opacity: on ? 1 : .5 }, svg);
        sv('text', { x: x + 7, y: y + 4, 'font-size': 12, 'font-weight': on ? 700 : 400, opacity: on ? 1 : .6 }, svg).textContent = w;
      });
      const [ax, ay] = toS(words[A]), [bx, by] = toS(words[B]), [cx0, cy0] = toS(words[C]), [rx, ry] = toS(res);
      if (step >= 1) arrow(svg, ax, ay, bx, by, 'vb', 2.2);
      if (step >= 2) { const g = sv('g', { opacity: .9 }, svg); arrow(g, cx0, cy0, rx, ry, 'vb', 2.2); }
      let nearest = null;
      if (step >= 3) {
        nearest = Object.entries(words).filter(([w]) => ![A, B, C].includes(w))
          .map(([w, v]) => [w, Math.hypot(v[0] - res[0], v[1] - res[1])]).sort((x, y) => x[1] - y[1])[0];
        sv('circle', { cx: rx, cy: ry, r: 9, class: 'vb dash', 'stroke-width': 2 }, svg);
      }
      const delta = [words[B][0] - words[A][0], words[B][1] - words[A][1]];
      out.textContent =
        `Question: ${A} is to ${B} as ${C} is to ?\n\n` +
        `Step 1. The arrow from ${A} to ${B}:  ${B} − ${A} = (${fmt(delta[0], 1)}, ${fmt(delta[1], 1)})\n` +
        (step >= 2 ? `Step 2. Start at ${C} and add that same arrow:\n        ${C} − ${A} + ${B} = (${fmt(res[0], 1)}, ${fmt(res[1], 1)})\n` : '') +
        (step >= 3 ? `Step 3. Nearest word to that point (not counting the inputs): ${nearest[0]}  (distance ${fmt(nearest[1])})` : '');
    }
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: analogies as arrow arithmetic' }),
      h('div', { class: 'fs-hint', text: 'Toy 2D positions. Pick an analogy and step through it.' }),
      buttons(sets.map(([C, A, B]) => `${C} − ${A} + ${B}`), i => { set = i; step = 1; render(); }, 0),
      h('div', { class: 'fs-row' },
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { step = Math.min(3, step + 1); render(); } }, 'Next step'),
        h('button', { type: 'button', class: 'fs-btn', onclick: () => { step = 1; render(); } }, 'Restart')),
      h('div', { class: 'fs-grid2' }, svg, out));
    render();
  };

  /* =========================================================
     8. highdim: random vectors become nearly perpendicular as d grows
     ========================================================= */
  widgets.highdim = function (root) {
    const dims = [2, 3, 5, 10, 30, 100, 300, 768, 1024, 2048];
    const PAIRS = 600, BINS = 40;
    let di = 7;
    const W = 400, H = 210, pad = 24;
    const svg = sv('svg', { class: 'fs-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Histogram of cosine similarity between random vectors' });
    const range = h('input', { type: 'range', min: '0', max: String(dims.length - 1), step: '1', value: String(di), class: 'fs-range', 'aria-label': 'Number of dimensions' });
    const lab = h('div', { class: 'fs-title' });
    const out = h('div', { class: 'fs-out' });
    function gauss() { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
    function run() {
      const d = dims[di];
      lab.textContent = `d = ${d} dimensions`;
      const cs = [];
      for (let p = 0; p < PAIRS; p++) {
        let ab = 0, aa = 0, bb = 0;
        for (let i = 0; i < d; i++) { const x = gauss(), y = gauss(); ab += x * y; aa += x * x; bb += y * y; }
        cs.push(ab / Math.sqrt(aa * bb));
      }
      const counts = new Array(BINS).fill(0);
      cs.forEach(c => counts[Math.min(BINS - 1, Math.floor((c + 1) / 2 * BINS))]++);
      const max = Math.max(...counts);
      svg.replaceChildren();
      const bw = (W - 2 * pad) / BINS, base = H - pad;
      counts.forEach((n, i) => sv('rect', { x: pad + i * bw + .5, y: base - (n / max) * (H - 2 * pad), width: bw - 1, height: (n / max) * (H - 2 * pad), class: 'va', opacity: .8 }, svg));
      sv('line', { x1: pad, y1: base, x2: W - pad, y2: base, class: 'axis' }, svg);
      [-1, -0.5, 0, 0.5, 1].forEach(v => {
        const x = pad + (v + 1) / 2 * (W - 2 * pad);
        sv('text', { x, y: base + 15, 'text-anchor': 'middle', 'font-size': 10, class: 'm' }, svg).textContent = v;
      });
      const sd = 1 / Math.sqrt(d);
      [-sd, sd].forEach(v => { const x = pad + (v + 1) / 2 * (W - 2 * pad); sv('line', { x1: x, y1: pad - 6, x2: x, y2: base, class: 'vb dash', 'stroke-width': 1.5 }, svg); });
      sv('text', { x: W - pad, y: 14, 'text-anchor': 'end', 'font-size': 10, class: 'tb' }, svg).textContent = 'dashed: ±1/√d';
      const mean = cs.reduce((s, x) => s + x, 0) / PAIRS;
      const std = Math.sqrt(cs.reduce((s, x) => s + (x - mean) ** 2, 0) / PAIRS);
      const big = cs.filter(x => Math.abs(x) > 0.3).length / PAIRS * 100;
      out.textContent =
        `${PAIRS} pairs of completely random vectors, each with ${d} numbers.\n` +
        `average cosine  = ${fmt(mean, 3)}\n` +
        `typical spread  = ${fmt(std, 3)}   (theory: 1/√${d} = ${fmt(sd, 3)})\n` +
        `pairs with |cos| > 0.3: ${fmt(big, 1)}%\n\n` +
        (d >= 300 ? `At ${d} dimensions, unrelated vectors almost never reach 0.3. So a cosine of 0.3 here is a real signal, while in 2D it would mean nothing.` :
          `In low dimensions random arrows often point the same way by chance. Slide right to see what happens in model-sized spaces.`);
    }
    range.addEventListener('input', () => { di = +range.value; run(); });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: random arrows in high dimensions' }),
      h('div', { class: 'fs-hint', text: 'The page generates random vectors right now in your browser and plots how similar random pairs are. Move the slider to change the number of dimensions.' }),
      lab, range, svg,
      h('div', { class: 'fs-row' }, h('button', { type: 'button', class: 'fs-btn', onclick: run }, 'Draw new random vectors')),
      out);
    run();
  };

  /* =========================================================
     Part 2 widgets: matrices, layers, and nonlinearity
     ========================================================= */

  /* 10. matrix: a matrix transforms the whole plane */
  widgets.matrix = function (root) {
    const PRESETS = [
      ['identity', [1, 0, 0, 1]], ['stretch', [2, 0, 0, 1]], ['rotate 90', [0, -1, 1, 0]],
      ['reflect', [1, 0, 0, -1]], ['shear', [1, 2, 0, 1]], ['project', [1, 0, 0, 0]]
    ];
    let M = [1, 2, 0, 1], P = [3, 1];
    const S = 28, OX = 168, OY = 140, VW = 420, VH = 224;
    const sx = x => OX + S * x, sy = y => OY - S * y;
    const svg = sv('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'fs-svg', role: 'img', 'aria-label': 'A matrix applied to the plane' });
    const out = h('div', { class: 'fs-out' });
    const cells = [0, 1, 2, 3].map(i => h('input', { class: 'fs-input fs-num', type: 'number', step: '0.5', value: String(M[i]), 'aria-label': 'matrix entry ' + (i + 1) }));
    const apply = p => [M[0] * p[0] + M[1] * p[1], M[2] * p[0] + M[3] * p[1]];

    function draw() {
      svg.replaceChildren();
      const g0 = sv('g', { class: 'faint' }, svg);
      for (let k = -7; k <= 10; k++) {
        sv('line', { x1: sx(k), y1: sy(-6), x2: sx(k), y2: sy(8), class: 'grid' }, g0);
        sv('line', { x1: sx(-7), y1: sy(k), x2: sx(10), y2: sy(k), class: 'grid' }, g0);
      }
      const g1 = sv('g', {}, svg);
      for (let k = -7; k <= 10; k++) {
        const a = apply([k, -7]), b = apply([k, 9]);
        sv('line', { x1: sx(a[0]), y1: sy(a[1]), x2: sx(b[0]), y2: sy(b[1]), class: 'grid' }, g1);
        const c = apply([-7, k]), d = apply([10, k]);
        sv('line', { x1: sx(c[0]), y1: sy(c[1]), x2: sx(d[0]), y2: sy(d[1]), class: 'grid' }, g1);
      }
      sv('line', { x1: sx(-7), y1: sy(0), x2: sx(10), y2: sy(0), class: 'axis' }, svg);
      sv('line', { x1: sx(0), y1: sy(-6), x2: sx(0), y2: sy(8), class: 'axis' }, svg);
      const q = apply(P);
      arrow(svg, sx(0), sy(0), sx(P[0]), sy(P[1]), 'va');
      arrow(svg, sx(0), sy(0), sx(q[0]), sy(q[1]), 'vb');
      sv('circle', { cx: sx(P[0]), cy: sy(P[1]), r: 4, class: 'va' }, svg);
      sv('circle', { cx: sx(q[0]), cy: sy(q[1]), r: 4, class: 'vb' }, svg);
      sv('circle', { cx: sx(P[0]), cy: sy(P[1]), r: 18, class: 'handle' }, svg);
      sv('text', { x: sx(P[0]) + 9, y: sy(P[1]) - 7, 'font-size': 11 }, svg).textContent = `x (${num(P[0])}, ${num(P[1])})`;
      sv('text', { x: sx(q[0]) + 9, y: sy(q[1]) - 7, 'font-size': 11, class: 'tb' }, svg).textContent = `Wx (${num(q[0])}, ${num(q[1])})`;
      const [a, b, c, d] = M, det = a * d - b * c;
      out.textContent =
        `W = [ ${num(a)}  ${num(b)} ]        x = (${num(P[0])}, ${num(P[1])})\n` +
        `    [ ${num(c)}  ${num(d)} ]\n\n` +
        `Wx = ( ${num(a)}·${num(P[0])} + ${num(b)}·${num(P[1])},  ${num(c)}·${num(P[0])} + ${num(d)}·${num(P[1])} )\n` +
        `   = ( ${num(q[0])}, ${num(q[1])} )\n\n` +
        (Math.abs(det) < 1e-9
          ? 'The grid has collapsed onto one line. Different inputs now land on the same output, and nothing later can tell them apart. This is a rank-1 matrix (Step 12).'
          : 'However far you drag, grid lines stay straight, stay parallel, and the origin stays put. That is what linear means, and it is exactly what a matrix alone cannot escape.');
    }
    cells.forEach((cell, i) => cell.addEventListener('input', () => {
      const v = parseFloat(cell.value); if (!isNaN(v)) { M[i] = v; draw(); }
    }));
    let drag = false;
    const move = e => {
      if (!drag) return;
      const p = svgPoint(svg, e.touches ? e.touches[0] : e);
      P = [Math.max(-5, Math.min(8, Math.round((p.x - OX) / S * 2) / 2)), Math.max(-2.5, Math.min(4.5, Math.round((OY - p.y) / S * 2) / 2))];
      draw(); e.preventDefault();
    };
    svg.addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); move(e); });
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', () => { drag = false; });
    const mrow = h('div', { class: 'fs-row' }, h('span', { text: 'W =' }), cells[0], cells[1], h('span', { text: '/' }), cells[2], cells[3]);
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: what a matrix does to the whole plane' }),
      h('div', { class: 'fs-hint', text: 'Pick a matrix, or type your own entries (top row, then bottom row). Drag anywhere on the figure to move the input point. Watch the grid, not just the arrow: the grid is the space.' }),
      buttons(PRESETS.map(p => p[0]), i => { M = PRESETS[i][1].slice(); cells.forEach((c, j) => c.value = String(M[j])); draw(); }, -1),
      mrow, svg, out);
    draw();
  };

  /* 11. collapse: stacked matrices are one matrix, until ReLU */
  widgets.collapse = function (root) {
    const W1 = [1, 1, 0, 1], W2 = [2, 0, 1, 1];
    const mul = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
    const W = mul(W2, W1);
    const ap = (A, p) => [A[0] * p[0] + A[1] * p[1], A[2] * p[0] + A[3] * p[1]];
    const relu = p => p.map(v => Math.max(0, v));
    let P = [1, 1], useRelu = false;
    const out = h('div', { class: 'fs-out' });
    const xi = [0, 1].map(i => h('input', { class: 'fs-input fs-num', type: 'number', step: '1', value: String(P[i]), 'aria-label': 'input component ' + (i + 1) }));
    const tog = h('button', { type: 'button', class: 'fs-btn', 'aria-pressed': 'false' }, 'ReLU after layer 1: off');

    function draw() {
      const h1 = ap(W1, P), h1r = useRelu ? relu(h1) : h1, h2 = ap(W2, h1r), one = ap(W, P);
      const same = Math.abs(h2[0] - one[0]) < 1e-9 && Math.abs(h2[1] - one[1]) < 1e-9;
      out.textContent =
        `W1 = [ 1  1 ]      W2 = [ 2  0 ]      W2W1 = [ ${num(W[0])}  ${num(W[1])} ]\n` +
        `     [ 0  1 ]           [ 1  1 ]             [ ${num(W[2])}  ${num(W[3])} ]\n\n` +
        `input x = (${num(P[0])}, ${num(P[1])})\n` +
        `----------------------------------------------\n` +
        `TWO LAYERS\n` +
        `  W1 x            = (${num(h1[0])}, ${num(h1[1])})\n` +
        (useRelu ? `  ReLU(W1 x)      = (${num(h1r[0])}, ${num(h1r[1])})\n` : '') +
        `  W2 ${useRelu ? 'ReLU(W1 x)' : '(W1 x)   '}   = (${num(h2[0])}, ${num(h2[1])})\n\n` +
        `ONE MATRIX\n` +
        `  (W2 W1) x       = (${num(one[0])}, ${num(one[1])})\n` +
        `----------------------------------------------\n` +
        (same
          ? 'Identical. Two matrices did the work of one, so the second layer added nothing a single matrix could not do.'
          : 'Different. One clipped number was enough: no single matrix can reproduce this for every input, because the clipping happens for some inputs and not others.');
      tog.textContent = 'ReLU after layer 1: ' + (useRelu ? 'on' : 'off');
      tog.setAttribute('aria-pressed', String(useRelu));
    }
    xi.forEach((el, i) => el.addEventListener('input', () => { const v = parseFloat(el.value); if (!isNaN(v)) { P[i] = v; draw(); } }));
    tog.addEventListener('click', () => { useRelu = !useRelu; draw(); });
    const setX = p => { P = p.slice(); xi.forEach((el, i) => el.value = String(P[i])); draw(); };
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: do two matrices beat one?' }),
      h('div', { class: 'fs-hint', text: 'Compare passing a vector through two matrices against passing it through their single product. Then switch ReLU on and try an input that goes negative, such as (-2, 1).' }),
      h('div', { class: 'fs-row' }, h('span', { text: 'x =' }), xi[0], xi[1]),
      buttons(['(1, 1)', '(3, 2)', '(-2, 1)', '(-1, -3)'], i => setX([[1, 1], [3, 2], [-2, 1], [-1, -3]][i]), -1),
      h('div', { class: 'fs-row' }, tog), out);
    draw();
  };

  /* 12. layer: one complete h = relu(Wx + b) */
  widgets.layer = function (root) {
    let M = [1, 2, 0, 1], P = [3, 1], B = [-4, 0], useRelu = true;
    const out = h('div', { class: 'fs-out' });
    const mk = (v, lbl) => h('input', { class: 'fs-input fs-num', type: 'number', step: '1', value: String(v), 'aria-label': lbl });
    const cells = [0, 1, 2, 3].map(i => mk(M[i], 'matrix entry ' + (i + 1)));
    const xi = [0, 1].map(i => mk(P[i], 'input ' + (i + 1)));
    const bi = [0, 1].map(i => mk(B[i], 'bias ' + (i + 1)));
    const tog = h('button', { type: 'button', class: 'fs-btn', 'aria-pressed': 'true' }, 'ReLU: on');

    function draw() {
      const wx = [M[0] * P[0] + M[1] * P[1], M[2] * P[0] + M[3] * P[1]];
      const z = [wx[0] + B[0], wx[1] + B[1]];
      const hh = useRelu ? z.map(v => Math.max(0, v)) : z.slice();
      const clipped = useRelu && (z[0] < 0 || z[1] < 0);
      out.textContent =
        `step 1   W x       = ( ${num(M[0])}·${num(P[0])} + ${num(M[1])}·${num(P[1])},  ${num(M[2])}·${num(P[0])} + ${num(M[3])}·${num(P[1])} )\n` +
        `                   = ( ${num(wx[0])}, ${num(wx[1])} )\n\n` +
        `step 2   W x + b   = ( ${num(wx[0])} + ${num(B[0])},  ${num(wx[1])} + ${num(B[1])} )\n` +
        `                   = ( ${num(z[0])}, ${num(z[1])} )\n\n` +
        `step 3   ${useRelu ? 'ReLU(W x + b)' : 'no activation'}\n` +
        `         h         = ( ${num(hh[0])}, ${num(hh[1])} )\n\n` +
        (clipped
          ? 'A negative number was clipped to zero. That clipping is the fold: it is the only part of this layer that is not a stretch or a tilt.'
          : useRelu
            ? 'Both numbers were already positive, so ReLU changed nothing for this input. Try an input that makes W x + b go negative, such as x = (1, 1).'
            : 'Without the activation this layer is a matrix and a shift, so stacking more of them collapses back to one (Step 7).');
      tog.textContent = 'ReLU: ' + (useRelu ? 'on' : 'off');
      tog.setAttribute('aria-pressed', String(useRelu));
    }
    const bind = (els, arr) => els.forEach((el, i) => el.addEventListener('input', () => { const v = parseFloat(el.value); if (!isNaN(v)) { arr[i] = v; draw(); } }));
    bind(cells, M); bind(xi, P); bind(bi, B);
    tog.addEventListener('click', () => { useRelu = !useRelu; draw(); });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: one complete layer' }),
      h('div', { class: 'fs-hint', text: 'Change any number and watch which of the three stages does the work. With x = (3, 1) nothing is clipped; with x = (1, 1) the first coordinate goes negative and ReLU acts.' }),
      h('div', { class: 'fs-row' }, h('span', { text: 'W =' }), cells[0], cells[1], h('span', { text: '/' }), cells[2], cells[3]),
      h('div', { class: 'fs-row' }, h('span', { text: 'x =' }), xi[0], xi[1], h('span', { text: '   b =' }), bi[0], bi[1]),
      h('div', { class: 'fs-row' }, tog), out);
    draw();
  };

  /* 13. untangle: XOR becomes separable after one layer */
  widgets.untangle = function (root) {
    const PTS = [[[0, 0], 'cat'], [[1, 1], 'cat'], [[0, 1], 'dog'], [[1, 0], 'dog']];
    const W = [1, 1, 1, 1], B = [0, -1];
    let useRelu = true;
    const S = 70, OX = 55, OY = 160, VW = 260, VH = 240;
    const sx = x => OX + S * x, sy = y => OY - S * y;
    const mkSvg = lbl => sv('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'fs-svg', role: 'img', 'aria-label': lbl });
    const s1 = mkSvg('The four points before the layer'), s2 = mkSvg('The four points after the layer');
    const out = h('div', { class: 'fs-out' });
    const tog = h('button', { type: 'button', class: 'fs-btn', 'aria-pressed': 'true' }, 'ReLU: on');
    const fwd = p => {
      const z = [W[0] * p[0] + W[1] * p[1] + B[0], W[2] * p[0] + W[3] * p[1] + B[1]];
      return useRelu ? z.map(v => Math.max(0, v)) : z;
    };
    function panel(svg, pts, title, line) {
      svg.replaceChildren();
      for (let k = -1; k <= 3; k++) {
        sv('line', { x1: sx(k), y1: sy(-1.2), x2: sx(k), y2: sy(2.2), class: 'grid faint' }, svg);
        sv('line', { x1: sx(-0.7), y1: sy(k), x2: sx(2.9), y2: sy(k), class: 'grid faint' }, svg);
      }
      sv('line', { x1: sx(-0.7), y1: sy(0), x2: sx(2.9), y2: sy(0), class: 'axis' }, svg);
      sv('line', { x1: sx(0), y1: sy(-1.2), x2: sx(0), y2: sy(2.2), class: 'axis' }, svg);
      if (line) sv('line', { x1: sx(line[0]), y1: sy(line[1]), x2: sx(line[2]), y2: sy(line[3]), class: 'vb dash', 'stroke-width': 2 }, svg);
      const seen = {};
      pts.forEach(([p, cls]) => {
        const key = num(p[0]) + ',' + num(p[1]);
        const n = (seen[key] = (seen[key] || 0) + 1);
        if (cls === 'cat') sv('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 6, class: 'va' }, svg);
        else sv('rect', { x: sx(p[0]) - 5.5, y: sy(p[1]) - 5.5, width: 11, height: 11, class: 'vb' }, svg);
        const right = sx(p[0]) > VW * 0.55;
        sv('text', { x: sx(p[0]) + (right ? -10 : 10), y: sy(p[1]) - 8 + (n - 1) * 12, 'font-size': 10, 'text-anchor': right ? 'end' : 'start', class: n > 1 ? 'm' : '' }, svg)
          .textContent = cls + ' (' + num(p[0]) + ', ' + num(p[1]) + ')';
      });
      sv('text', { x: 8, y: 16, 'font-size': 11, 'font-weight': '700' }, svg).textContent = title;
    }
    function draw() {
      panel(s1, PTS.map(([p, c]) => [p, c]), 'before: no line works', null);
      const after = PTS.map(([p, c]) => [fwd(p), c]);
      panel(s2, after, useRelu ? 'after: a line works' : 'after: still no line', useRelu ? [-0.7, -0.6, 2.9, 1.2] : null);
      out.textContent = PTS.map(([p, c]) => {
        const z = [W[0] * p[0] + W[1] * p[1] + B[0], W[2] * p[0] + W[3] * p[1] + B[1]];
        const hh = fwd(p);
        return `${c.padEnd(4)} (${num(p[0])}, ${num(p[1])})   Wx+b = (${num(z[0])}, ${num(z[1])})   h = (${num(hh[0])}, ${num(hh[1])})`;
      }).join('\n') + '\n\n' + (useRelu
        ? 'Both dogs have landed on the same point, and the two cats sit on the opposite side of the dashed line. One more row of weights can now finish the job.'
        : 'Without ReLU all four points land on one straight line, in the order cat, dog, dog, cat. No line can separate them, and no further matrix will change that.');
      tog.textContent = 'ReLU: ' + (useRelu ? 'on' : 'off');
      tog.setAttribute('aria-pressed', String(useRelu));
    }
    tog.addEventListener('click', () => { useRelu = !useRelu; draw(); });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: the smallest problem one matrix cannot solve' }),
      h('div', { class: 'fs-hint', text: 'Two cats (circles) and two dogs (squares), arranged so that no straight line separates them. The layer is h = ReLU(Wx + b) with W = [[1, 1], [1, 1]] and b = (0, -1). Switch ReLU off to see the matrix fail on its own.' }),
      h('div', { class: 'fs-row' }, tog),
      h('div', { class: 'fs-grid2' }, s1, s2), out);
    draw();
  };

  /* 14. rank: a rank-1 matrix flattens the plane */
  widgets.rank = function (root) {
    const MATS = [['rank 1: [[1,2],[2,4]]', [1, 2, 2, 4]], ['full rank: [[1,2],[0,1]]', [1, 2, 0, 1]], ['rank 1: [[1,0],[0,0]]', [1, 0, 0, 0]]];
    let M = MATS[0][1].slice();
    const S = 30, OX = 180, OY = 150, VW = 420, VH = 270;
    const sx = x => OX + S * x, sy = y => OY - S * y;
    const svg = sv('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'fs-svg', role: 'img', 'aria-label': 'Where a matrix sends the plane' });
    const out = h('div', { class: 'fs-out' });
    const ap = p => [M[0] * p[0] + M[1] * p[1], M[2] * p[0] + M[3] * p[1]];
    const A = [1, 0], Bp = [3, -1];
    function draw() {
      svg.replaceChildren();
      for (let k = -6; k <= 7; k++) {
        sv('line', { x1: sx(k), y1: sy(-5), x2: sx(k), y2: sy(4), class: 'grid faint' }, svg);
        sv('line', { x1: sx(-6), y1: sy(k), x2: sx(7), y2: sy(k), class: 'grid faint' }, svg);
      }
      const g = sv('g', {}, svg);
      for (let k = -7; k <= 8; k++) {
        const a = ap([k, -7]), b = ap([k, 8]); sv('line', { x1: sx(a[0]), y1: sy(a[1]), x2: sx(b[0]), y2: sy(b[1]), class: 'grid' }, g);
        const c = ap([-7, k]), d = ap([8, k]); sv('line', { x1: sx(c[0]), y1: sy(c[1]), x2: sx(d[0]), y2: sy(d[1]), class: 'grid' }, g);
      }
      sv('line', { x1: sx(-6), y1: sy(0), x2: sx(7), y2: sy(0), class: 'axis' }, svg);
      sv('line', { x1: sx(0), y1: sy(-5), x2: sx(0), y2: sy(4), class: 'axis' }, svg);
      const qa = ap(A), qb = ap(Bp);
      [[A, qa, 'a'], [Bp, qb, 'b']].forEach(([p, q, lbl]) => {
        sv('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 4, class: 'va' }, svg);
        sv('text', { x: sx(p[0]) + 7, y: sy(p[1]) - 6, 'font-size': 10 }, svg).textContent = `${lbl} (${num(p[0])}, ${num(p[1])})`;
        sv('line', { x1: sx(p[0]), y1: sy(p[1]), x2: sx(q[0]), y2: sy(q[1]), class: 'vb dash', 'stroke-width': 1.2 }, svg);
        sv('circle', { cx: sx(q[0]), cy: sy(q[1]), r: 5, class: 'vb' }, svg);
      });
      sv('text', { x: sx(qa[0]) + 8, y: sy(qa[1]) + 14, 'font-size': 10, class: 'tb' }, svg).textContent = `-> (${num(qa[0])}, ${num(qa[1])})`;
      const det = M[0] * M[3] - M[1] * M[2];
      const collide = Math.abs(qa[0] - qb[0]) < 1e-9 && Math.abs(qa[1] - qb[1]) < 1e-9;
      out.textContent =
        `W = [ ${num(M[0])}  ${num(M[1])} ]      determinant = ${num(det)}      rank = ${Math.abs(det) < 1e-9 ? (M.every(v => v === 0) ? 0 : 1) : 2}\n` +
        `    [ ${num(M[2])}  ${num(M[3])} ]\n\n` +
        `a = (${num(A[0])}, ${num(A[1])})   ->   (${num(qa[0])}, ${num(qa[1])})\n` +
        `b = (${num(Bp[0])}, ${num(Bp[1])})  ->   (${num(qb[0])}, ${num(qb[1])})\n\n` +
        (collide
          ? 'Two different inputs, one output. The difference between a and b has been destroyed, and no later layer can recover it. The whole plane now lies on a single line.'
          : 'Distinct inputs stay distinct. Every direction survives, so nothing downstream has been made impossible.');
    }
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: what a low-rank matrix throws away' }),
      h('div', { class: 'fs-hint', text: 'Two input points, a and b, and where each one lands. Switch between a rank-1 matrix and a full-rank one.' }),
      buttons(MATS.map(m => m[0]), i => { M = MATS[i][1].slice(); draw(); }, 0),
      svg, out);
    draw();
  };

  /* 15. activations: compare activation curves and their slopes */
  widgets.activations = function (root) {
    const erf = x => {                       // Abramowitz and Stegun 7.1.26
      const s = x < 0 ? -1 : 1; x = Math.abs(x);
      const t = 1 / (1 + 0.3275911 * x);
      const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
      return s * (1 - poly * Math.exp(-x * x));
    };
    const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
    const FNS = {
      'sigmoid': z => 1 / (1 + Math.exp(-z)),
      'tanh': z => Math.tanh(z),
      'ReLU': z => Math.max(0, z),
      'leaky ReLU': z => (z >= 0 ? z : 0.01 * z),
      'GELU': z => z * Phi(z)
    };
    const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
    const DFNS = {                            // exact derivatives, so the lower panel has no numerical artefacts
      'sigmoid': z => { const s = 1 / (1 + Math.exp(-z)); return s * (1 - s); },
      'tanh': z => 1 - Math.tanh(z) ** 2,
      'ReLU': z => (z > 0 ? 1 : 0),
      'leaky ReLU': z => (z >= 0 ? 1 : 0.01),
      'GELU': z => Phi(z) + z * phi(z)
    };
    const NAMES = Object.keys(FNS);
    let name = 'ReLU', probe = 2;
    const VW = 420, VH = 312, Z = 3;          // input axis runs -Z to Z
    // upper panel: the function. lower panel: its slope, on the same input axis.
    // x and y share one scale in the upper panel, so a slope of 1 really looks like 45 degrees.
    const S = 40, OX = 210, OY = 138;
    const SY = 52, OY2 = 272;                 // slope 0 sits on OY2
    const sx = x => OX + S * x;
    const sy = y => OY - S * Math.max(-1.2, Math.min(3, y));
    const sm = m => OY2 - SY * Math.max(-0.3, Math.min(1.3, m));
    const svg = sv('svg', { viewBox: `0 0 ${VW} ${VH}`, class: 'fs-svg', role: 'img', 'aria-label': 'Activation function curves and their slopes' });
    const out = h('div', { class: 'fs-out' });
    const range = h('input', { type: 'range', class: 'fs-range', min: String(-Z * 10), max: String(Z * 10), step: '1', value: String(probe * 10), 'aria-label': 'probe point z' });

    function draw() {
      svg.replaceChildren();
      const L = sx(-Z), R = sx(Z), N = 180;
      const curve = (g, cls, w, op) => {
        const pts = [];
        for (let i = 0; i <= N; i++) { const z = -Z + 2 * Z * i / N; pts.push(`${sx(z)},${g(z)}`); }
        sv('polyline', { points: pts.join(' '), fill: 'none', style: 'fill:none', class: cls, 'stroke-width': w, opacity: op }, svg);
      };

      // --- upper panel: the function itself
      for (let k = -Z; k <= Z; k++) sv('line', { x1: sx(k), y1: sy(3), x2: sx(k), y2: sy(-1.2), class: 'grid faint' }, svg);
      for (let k = -1; k <= 3; k++) sv('line', { x1: L, y1: sy(k), x2: R, y2: sy(k), class: 'grid faint' }, svg);
      sv('line', { x1: L, y1: sy(0), x2: R, y2: sy(0), class: 'axis' }, svg);
      sv('line', { x1: sx(0), y1: sy(3), x2: sx(0), y2: sy(-1.2), class: 'axis' }, svg);
      NAMES.forEach(n => {
        if (n === name) return;
        curve(z => sy(FNS[n](z)), 'va', 1, 0.2);
      });

      const f = FNS[name], v = f(probe), m = DFNS[name](probe);

      // the tangent: because x and y share a scale here, its steepness on screen IS the slope
      const w = 1.1;
      sv('line', { x1: sx(probe - w), y1: sy(v - w * m), x2: sx(probe + w), y2: sy(v + w * m), class: 'va dash', 'stroke-width': 1.6, opacity: 0.9 }, svg);
      curve(z => sy(f(z)), 'vb', 2.6, 1);
      sv('line', { x1: sx(probe), y1: sy(v), x2: sx(probe), y2: sm(1.3), class: 'vb dash', 'stroke-width': 1.1, opacity: 0.5 }, svg);
      sv('circle', { cx: sx(probe), cy: sy(v), r: 4.5, class: 'vb' }, svg);
      sv('text', { x: 8, y: 15, 'font-size': 11, 'font-weight': '700', class: 'tb' }, svg).textContent = name + '(z)';
      sv('text', { x: 8, y: 27, 'font-size': 9, class: 'm' }, svg).textContent = 'output, with the tangent at the probe';

      // --- lower panel: the slope at every input, which is the thing that matters
      sv('rect', { x: L, y: sm(0.08), width: R - L, height: Math.abs(sm(-0.08) - sm(0.08)), class: 'band' }, svg);
      sv('line', { x1: L, y1: sm(0), x2: R, y2: sm(0), class: 'axis' }, svg);
      sv('line', { x1: L, y1: sm(1), x2: R, y2: sm(1), class: 'grid faint dash' }, svg);
      sv('line', { x1: sx(0), y1: sm(1.3), x2: sx(0), y2: sm(-0.3), class: 'axis' }, svg);
      curve(z => sm(DFNS[name](z)), 'vb', 2.2, 1);
      sv('circle', { cx: sx(probe), cy: sm(m), r: 4, class: 'vb' }, svg);
      sv('text', { x: 8, y: sm(1.3) + 2, 'font-size': 11, 'font-weight': '700', class: 'tb' }, svg).textContent = 'slope';
      sv('text', { x: R + 5, y: sm(1) + 3.5, 'font-size': 9, class: 'm' }, svg).textContent = '1';
      sv('text', { x: R + 5, y: sm(0) + 3.5, 'font-size': 9, class: 'm' }, svg).textContent = '0';
      sv('text', { x: L, y: sm(-0.3) + 10, 'font-size': 9, class: 'm' }, svg).textContent = 'inside the shaded band, this layer has stopped learning';

      out.textContent =
        `${name} at z = ${fmt(probe, 2)}\n` +
        `  output = ${fmt(v, 4)}\n` +
        `  slope  = ${fmt(m, 4)}\n\n` +
        (Math.abs(m) < 0.08
          ? 'The curve is almost flat here, so the output barely responds to a change in the input. In training this means the layer receives almost no signal telling it how to improve, which is the vanishing gradient problem (Article 3).'
          : Math.abs(m) > 0.5
            ? 'The slope is healthy, so a change in the input produces a real change in the output and the training signal passes through undiminished.'
            : 'The slope is small but not zero, so some signal still gets through. This is why leaky ReLU exists: a dying unit can still climb back.');
    }
    range.addEventListener('input', () => { probe = Math.round(+range.value) / 10; draw(); });
    root.append(
      h('div', { class: 'fs-title', text: 'Try it: how flat does each activation go?' }),
      h('div', { class: 'fs-hint', text: 'Pick a function and slide the probe along the input axis. The upper panel is the function, with the tangent drawn at the probe. The lower panel is that tangent’s steepness at every input, which is the quantity training depends on: inside the shaded band a layer using this function has effectively stopped learning.' }),
      buttons(NAMES, i => { name = NAMES[i]; draw(); }, 2),
      range, svg, out);
    draw();
  };

  /* ---------- Start ---------- */
  function init() {
    document.querySelectorAll('.fs-widget[data-widget]').forEach(root => {
      const fn = widgets[root.getAttribute('data-widget')];
      if (!fn || root.classList.contains('fs-ready')) return;
      const live = h('div', { class: 'fs-live' });
      try {
        const box = document.createElement('div');
        fn(box);
        live.append(...box.childNodes);
        root.appendChild(live);
        root.classList.add('fs-ready');
      } catch (err) { live.remove(); }      // fallback text stays visible
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
