/* =========================================================
   Konzi: the site's tour guide. Separate from the chat assistant.
   Plain JavaScript, no libraries, nothing sent anywhere.

   How it behaves
   - Floats beside the section being read (right-hand margin on
     laptops and desktops, bottom-left corner on phones).
   - A section's line starts when that section's heading crosses a
     line a quarter of the way down the screen, and stays until the
     next heading crosses it. Scrolling back brings lines back.
   - Visitors can drag Konzi; it then stays where they dropped it
     for the rest of the visit. Double-click sends it back.
   - "Skip tour" is remembered in this browser (localStorage).

   To edit what Konzi says, change STOPS below. Each stop has:
     parts:   list of [expression, text], one bubble at a time
     actions: optional buttons on the last bubble
   Expressions: neutral, happy, laugh, smug, shocked, puppy, wink, sleepy
   ========================================================= */
(function () {
  if (window.__konzi) return;
  window.__konzi = true;

  const EMAIL = 'kaunteyacharya2000@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/kauntey-acharya';
  const BLUE = '#5C9DF2', EYE = '#0B1A33';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onHome = !!document.getElementById('about');
  const onNotes = !!document.getElementById('blogRoot');

  /* ---------- What Konzi says ---------- */
  const A = {
    email:    { label: 'Email him', href: 'mailto:' + EMAIL },
    linkedin: { label: 'LinkedIn', href: LINKEDIN, ext: true },
    notes:    { label: 'Read his notes →', href: 'notes.html' },
    chat:     { label: 'Open the assistant', run: () => { const t = document.getElementById('chatToggle'); if (t) t.click(); } },
    tour:     { label: 'Tour me again!', run: () => restartTour() },
    explore:  { label: 'Explore again', run: () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }) }
  };
  const STOPS = {
    hero: { parts: [
      ['happy', "Hiiii! I'm Konzi! 💙 I'll show you around Kauntey's website and make it fun, 'cause he is way too serious! Hehe!"],
      ['wink', "Just scroll and I'll follow along with commentary. Let's see what this nerd has been up to, shall we?"]
    ] },
    heroAgain: { parts: [
      ['happy', 'Ohhh, you came back! 🥹 Want the grand tour again, or are you a pro now?']
    ], actions: [A.tour] },

    about: { parts: [
      ['smug', 'What a nerd! Started with physics and then switched to AI!'],
      ['laugh', 'Oh, oh! And he reads research papers as a hobby. A HOBBY. Who does that?! 🤓'],
      ['wink', 'Message him and tell him, "Get a life, bro." Hehe.'],
      ['puppy', "But really, he's curious about how things work, from black holes to AI systems. So I guess that explains a lot."]
    ] },

    experience: { parts: [
      ['happy', 'Ah yes, the professional era! Physics research first, then research writing, and now AI automation and LLM evaluation at Innodata.'],
      ['neutral', 'From studying the universe to building AI systems. Same curiosity, different playground!'],
      ['puppy', "But between us, he's not satisfied yet. He wants to grow! If you have an interesting opportunity, do reach out to him. 🥹"]
    ], actions: [A.email, A.linkedin] },

    skills: { parts: [
      ['shocked', "Ooooh, the skills section! Let's see what's going on inside that brain."],
      ['neutral', 'AI agents, RAG, automation, Python, statistics, and a whole lot of physics.'],
      ['smug', "Give him a problem and he'll spend three hours on first principles instead of just Googling it."],
      ['laugh', '...Okay, he probably Googles it eventually. Hehe!']
    ] },

    // The first project, paper and note are commented on inside these intro stops (they sit level with
    // the section heading). Every later project, paper and note gets its own line as it scrolls past.
    projects: { parts: [
      ['shocked', "Ummm... let's see what he's built! 👀"],
      ['neutral', 'Most projects have a live demo link, so go try them! Just come back after, okay? I still have a whole tour planned. 🥹']
    ] },

    publications: { parts: [
      ['shocked', 'Wait. Four peer-reviewed papers? In journals like Physical Review D?'],
      ['puppy', "Okay, I'm actually impressed. Don't tell him I said that."]
    ] },

    notes: { parts: [
      ['wink', 'Ah, notes! He basically lost his personal blog site, so he started posting here instead: anything he wonders, learns, or builds.'],
      ['puppy', 'Wanna have a look? 🥹']
    ], actions: [A.notes] },

    contact: { spin: true, parts: [
      ['shocked', 'WAIT WAIT WAIT! One tiny favour before you go.'],
      ['puppy', "If you liked his work and have an opportunity for him, do reach out! And if not, he'd still be happy to hear your comments on his projects, talk research, or just have a simple conversation."],
      ['happy', 'Got questions first? The assistant in the corner knows his whole story.'],
      ['wink', "Thanks for roaming around with me! Don't forget to check out his Notes before leaving. Don't be a stranger, okay? Love youuu! Byeee! 💙"]
    ], actions: [A.notes, A.linkedin, A.email, A.explore] },

    // Not tied to a section
    leaving: { parts: [['puppy', "Come back soon, okay? I'll wait right here! 🥹"]] },
    back: { spin: true, parts: [
      ['happy', 'Ohhh, welcome back, cutie! 🥹 You are a wonderful hooman!'],
      ['wink', 'Sooo, what did you think? Did something break? Did you find a bug before Kauntey did?'],
      ['laugh', 'Hehe. Just kidding. Mostly. Keep scrolling, there is more!']
    ] },
    tap: { parts: [['laugh', 'Hehe! That tickles!']] },
    tapOff: { parts: [['puppy', "Hehe! I'm on a break. Want me to show you around after all?"]], actions: [A.tour] },
    notesPage: { parts: [
      ['happy', "Welcome to his Notes! Pick one that looks fun, he'd love that. 💙"],
      ['wink', 'If you want to contact Kauntey directly for an opportunity, here are his email and LinkedIn. He would be happy to get in touch!'],
      ['neutral', 'Or, if you want to explore the virtual assistant on this site, it lives in the corner.']
    ], actions: [A.email, A.linkedin, A.chat] }
  };

  // One-liners when a visitor hovers a project (matched by its GitHub link) or a paper (matched by title)
  const HOVER = [
    ['a[href*="/tickerbrief"]', 'happy', 'TickerBrief! Type one stock ticker and an agent writes a whole research report. Fancy! 📈'],
    ['a[href*="drift-alert"]', 'wink', 'The drift agent! It notices when a model goes off the rails, then explains why on Slack. Very responsible. 🧐'],
    ['a[href*="arxiv"]', 'laugh', 'The arXiv agent! He automated reading papers... so he could read even MORE papers. 🤓'],
    ['a[href*="RAG-doc"]', 'happy', 'Fully local RAG! Your documents never leave your machine. Privacy, but make it nerdy.'],
    ['a[href*="banking-stock"]', 'smug', 'Bank stocks, volatility, risk. He calls it research. I say he just likes charts.'],
    ['a[href*="GW-GR"]', 'shocked', 'Testing Einstein with gravitational waves?! Bold move, Kauntey. Bold move.'],
    ['a[href*="Credit-Score"]', 'neutral', 'Credit scores and default risk. Numbers that decide loans, so he checks them twice.'],
    ['a[href*="start-ups"]', 'wink', 'Indian startup funding trends. Follow the money... with Pandas. 🐼'],
    ['JMN-1 singularity', 'shocked', 'Magnetic fields around a naked singularity. Spicy physics! 🌶️'],
    ['High energy particle', 'shocked', 'Particles smashing near a naked singularity at Planck-scale energies. And he is first author on this one!'],
    ['Janis-Newman-Winicour', 'happy', 'Pulling energy out of a naked singularity, up to about 60% efficiency. Free energy, but make it cosmic.'],
    ['mimickers', 'wink', 'Black hole mimickers: things that look like black holes but are not. Imposter syndrome, astrophysics edition. 🕳️']
  ];
  // What Konzi says when a visitor opens a note (by file name). New notes get a generic line.
  const NOTE_LINES = {
    'tickerbrief': [['happy', "The TickerBrief story! Ask him how many tickers he tested. Actually, don't. It's a lot."]],
    'ml-drift-alert-agent': [['wink', 'Models drift, Kauntey notices. This agent is basically a babysitter for ML models.']],
    'local-rag-agent': [['happy', 'Fully local RAG! No cloud, no leaks, just one laptop working very hard. 💪']],
    'what-is-rag': [['neutral', 'RAG explained without the jargon. Bookmark-worthy, if you ask me.']],
    'ai-benchmarks': [['smug', 'Benchmarks from first principles, with error bars. He really, REALLY likes error bars.']],
    'creating-focuspulse': [['laugh', 'He built a focus tracker... and probably got distracted while building it. Hehe.']],
    'creating-easyautofill': [['happy', 'EasyAutoFill! Because filling the same form 50 times is a crime against humanity.']],
    'stats-with-first-principles': [['puppy', 'Stats from first principles. He gets excited about probability, be gentle with him. 🥹']],
    'automating-arxiv': [['laugh', 'He automated his morning paper reading. The coffee is still manual, though.']],
    'ml-vs-deep-learning': [['wink', 'TL;DR: classic ML learns a decision on top of features humans design. Deep learning learns the features too. You\'re welcome. 😌']],
    'jmn-magnetic-field': [['shocked', 'Magnetic fields around a naked singularity. Yes, those are real words. 🌶️']],
    'first-paper-penrose': [['puppy', 'His very first paper! Look at baby Kauntey stealing energy from black holes. 🥹']],
    'msc-thesis': [['happy', 'The MSc thesis! Where it all began. Peak physics era.']],
    'ml-black-hole-energy-extraction': [['shocked', 'Black holes AND machine learning? He put his two favourite things in one note.']],
    'chatgpt-interface': [['wink', 'Written two weeks after ChatGPT came out. A little time capsule! ⏳']],
    'gpt-origins': [['happy', 'GPT-1 to GPT-4 in one sitting. History class, but fun.']],
    'maths-physics-inside-llms': [['shocked', 'This one has equations. Brave of you. I believe in you! 💪'], ['wink', 'Spoiler: softmax is secretly the Boltzmann distribution. Physics wins again.']],
    'claude-overtook-gpt': [['smug', 'The great AI race of 2024. Grab some popcorn. 🍿']],
    'gradient-descent-better-code': [['laugh', 'Gradient descent writes better code than you. He took that personally.']],
    'how-labs-train-ai-models': [['neutral', 'How the big labs actually train their models. Long, but worth every scroll.']]
  };
  const GENERIC_NOTE = [
    [['happy', 'Ooh, good pick! Tell me if you spot a typo, I will tell on him. Hehe.']],
    [['puppy', "Reading his notes? You're officially one of the 31. 🥹"]]
  ];
  const postSlug = onNotes ? new URLSearchParams(location.search).get('post') : null;
  if (postSlug) STOPS.note = { parts: NOTE_LINES[postSlug] || GENERIC_NOTE[Math.floor(Math.random() * GENERIC_NOTE.length)] };

  // Section heading that anchors each stop, in page order
  const SECTIONS = onHome ? [
    ['hero', '#hero-name'], ['about', '#about-h'], ['experience', '#exp-h'], ['skills', '#skills-h'],
    ['projects', '#proj-h'], ['publications', '#pub-h'], ['notes', '#notes-h'], ['contact', '#contact-h']
  ] : onNotes ? [postSlug ? ['note', '#postTitle'] : ['notesPage', '#blogRoot']] : [];

  /* ---------- Saved choices ---------- */
  const KEY = 'konzi-v2';
  const mem = (() => { try { return Object.assign({ off: false, done: false }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { off: false, done: false }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} };
  const session = (() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  const saveSession = () => { try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch (e) {} };

  /* ---------- Drawing ---------- */
  const EXPR = {
    neutral: { L: 'open', R: 'open', s: 1, lid: 0, shine: 1, cheeks: 0, tilt: 0, mouth: 'M-9 40 Q0 46 9 40' },
    happy:   { L: 'arc', R: 'arc', s: 1, lid: 0, shine: 1, cheeks: .9, tilt: -4, mouth: 'M-15 37 Q0 53 15 37' },
    laugh:   { L: 'squint', R: 'squint', s: 1, lid: 0, shine: 1, cheeks: 1, tilt: 0, bounce: 1, mouth: 'M-15 35 Q0 60 15 35 Z', fill: 1 },
    smug:    { L: 'open', R: 'open', s: .95, lid: .5, shine: 0, cheeks: 0, tilt: 7, lidline: 1, mouth: 'M-10 45 Q4 47 15 37' },
    shocked: { L: 'open', R: 'open', s: 1.38, lid: 0, shine: 1, cheeks: 0, tilt: 0, jump: 1, mouth: 'M0 33 C8 33 8 51 0 51 C-8 51 -8 33 0 33 Z', fill: 1 },
    puppy:   { L: 'open', R: 'open', s: 1.28, lid: 0, shine: 1.5, shine2: 1, cheeks: .8, tilt: -9, mouth: 'M-9 43 Q-4.5 47 0 43 Q4.5 47 9 43' },
    wink:    { L: 'open', R: 'arc', s: 1.05, lid: 0, shine: 1, cheeks: .7, tilt: 5, mouth: 'M-13 40 Q2 51 15 36' },
    dizzy:   { L: 'spiral', R: 'spiral', s: 1, lid: 0, shine: 0, cheeks: 0, tilt: 0, mouth: 'M-11 44 Q-5.5 38 0 44 Q5.5 50 11 44' },
    sleepy:  { L: 'open', R: 'open', s: 1, lid: .74, shine: 0, cheeks: 0, tilt: -6, zzz: 1, lidline: 1, mouth: 'M-6 45 Q0 47 6 45' }
  };
  let uid = 0;
  function svgMarkup() {
    const id = 'kz' + (++uid);
    const eye = side => `
      <g class="kz-eye" data-side="${side}" transform="translate(${side === 'L' ? -30 : 30},10)">
        <clipPath id="${id}${side}"><rect class="kz-lid" x="-24" y="-40" width="48" height="80"/></clipPath>
        <g class="kz-v kz-open">
          <g clip-path="url(#${id}${side})"><g class="kz-inner">
            <ellipse rx="12" ry="14.5" fill="${EYE}"/>
            <circle class="kz-shine" cx="-4" cy="-6" r="3.4" fill="#fff"/>
            <circle class="kz-shine2" cx="4.5" cy="5" r="1.6" fill="#fff" opacity="0"/>
          </g></g>
          <line class="kz-lidline" x1="-13" x2="13" y1="-18" y2="-18" stroke="${EYE}" stroke-width="3.2" stroke-linecap="round" opacity="0"/>
        </g>
        <path class="kz-v kz-arc" d="M-12 4 Q0 -13 12 4" fill="none" stroke="${EYE}" stroke-width="5.5" stroke-linecap="round" opacity="0"/>
        <path class="kz-v kz-spiral" d="M0 0 m-1.5 0 a1.5 1.5 0 1 1 3 0 a4 4 0 1 1 -8 0 a6.5 6.5 0 1 1 13 0 a9 9 0 1 1 -18 0" fill="none" stroke="${EYE}" stroke-width="3.2" stroke-linecap="round" opacity="0"/>
        <path class="kz-v kz-squint" d="${side === 'L' ? 'M-9 -9 L8 0 L-9 9' : 'M9 -9 L-8 0 L9 9'}" fill="none" stroke="${EYE}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      </g>`;
    return `<svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <defs><radialGradient id="${id}g" cx="0" cy="0" r="95" gradientUnits="userSpaceOnUse" gradientTransform="translate(-30,-35)">
        <stop offset="0" stop-color="#93C0F8"/><stop offset=".55" stop-color="${BLUE}"/><stop offset="1" stop-color="#3F86E6"/></radialGradient>
        <clipPath id="${id}f"><circle r="89"/></clipPath></defs>
      <circle r="90" fill="url(#${id}g)"/>
      <g clip-path="url(#${id}f)"><g class="kz-face">
        <g class="kz-cheeks" opacity="0"><ellipse cx="-55" cy="34" rx="13" ry="7.5" fill="#FF9DBA" opacity=".6"/><ellipse cx="55" cy="34" rx="13" ry="7.5" fill="#FF9DBA" opacity=".6"/></g>
        ${eye('L')}${eye('R')}
        <g class="kz-mouth-g"><path class="kz-mouth" d="M-9 40 Q0 46 9 40" fill="none" stroke="${EYE}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>
      </g></g>
      <g class="kz-zzz"><text x="62" y="-58" font-size="24">z</text><text x="82" y="-82" font-size="17">z</text></g>
    </svg>`;
  }

  function makeFace(host) {
    host.innerHTML = svgMarkup();
    const svg = host.querySelector('svg');
    const q = s => svg.querySelector(s);
    const eyes = [...svg.querySelectorAll('.kz-eye')].map(g => ({
      g, side: g.dataset.side, base: g.getAttribute('transform'),
      open: g.querySelector('.kz-open'), inner: g.querySelector('.kz-inner'), arc: g.querySelector('.kz-arc'),
      squint: g.querySelector('.kz-squint'), spiral: g.querySelector('.kz-spiral'), lid: g.querySelector('.kz-lid'), lidline: g.querySelector('.kz-lidline'),
      shine: g.querySelector('.kz-shine'), shine2: g.querySelector('.kz-shine2')
    }));
    const face = q('.kz-face'), cheeks = q('.kz-cheeks'), mouth = q('.kz-mouth'), mouthG = q('.kz-mouth-g'), zzz = q('.kz-zzz');
    const st = { expr: 'neutral', s: 1, lid: 0, shine: 1, shine2: 0, look: [0, 0], lookT: [0, 0], turn: [0, 0], turnT: [0, 0], talk: false, nextBlink: performance.now() + 1500, blinkStart: 0 };

    function setExpr(name) {
      const e = EXPR[name] || EXPR.neutral; st.expr = EXPR[name] ? name : 'neutral';
      eyes.forEach(ey => {
        const v = e[ey.side];
        ey.open.style.opacity = v === 'open' ? 1 : 0;
        ey.arc.style.opacity = v === 'arc' ? 1 : 0;
        ey.squint.style.opacity = v === 'squint' ? 1 : 0;
        ey.spiral.style.opacity = v === 'spiral' ? 1 : 0;
      });
      cheeks.style.opacity = e.cheeks;
      zzz.style.opacity = e.zzz ? 1 : 0;
      mouth.setAttribute('d', e.mouth);
      mouth.style.d = `path('${e.mouth}')`;
      mouth.setAttribute('fill', e.fill ? EYE : 'none');
    }
    function lookAt(dx, dy) {
      const d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 220), c = v => Math.max(-1, Math.min(1, v));
      st.lookT = [dx / d * 6 * m, dy / d * 5 * m];
      st.turnT = [c(dx / 300) * .8, c(dy / 300) * .55];
    }
    function frame(now) {
      const e = EXPR[st.expr], k = reduce ? 1 : .18;
      st.s += (e.s - st.s) * k; st.lid += (e.lid - st.lid) * k;
      st.shine += (e.shine - st.shine) * k; st.shine2 += ((e.shine2 || 0) - st.shine2) * k;
      for (let i = 0; i < 2; i++) { st.look[i] += (st.lookT[i] - st.look[i]) * .15; st.turn[i] += (st.turnT[i] - st.turn[i]) * (reduce ? 1 : .1); }
      face.setAttribute('transform', `translate(${(st.turn[0] * 24).toFixed(2)},${(st.turn[1] * 16).toFixed(2)}) scale(${(1 - Math.abs(st.turn[0]) * .2).toFixed(3)},${(1 - Math.abs(st.turn[1]) * .14).toFixed(3)})`);
      const flap = st.talk && !reduce ? 1 + Math.abs(Math.sin(now / 70)) * .55 : 1;
      mouthG.setAttribute('transform', `translate(0,42) scale(1,${flap.toFixed(3)}) translate(0,-42)`);
      if (now > st.nextBlink) { st.blinkStart = now; st.nextBlink = now + 2400 + Math.random() * 3200; }
      let b = 0; if (st.blinkStart) { const t = (now - st.blinkStart) / 150; b = t < 1 ? Math.sin(t * Math.PI) : 0; }
      const sy = Math.max(.08, 1 - b * .92);
      eyes.forEach(ey => {
        ey.g.setAttribute('transform', `${ey.base} translate(${st.look[0].toFixed(2)},${st.look[1].toFixed(2)})`);
        if (st.expr === 'dizzy') ey.spiral.setAttribute('transform', `rotate(${((now / 3) % 360) * (ey.side === 'L' ? 1 : -1)})`);
        ey.inner.setAttribute('transform', `scale(${st.s.toFixed(3)},${(st.s * sy).toFixed(3)})`);
        const eh = 14.5 * st.s * sy, y = -eh - 2 + st.lid * (2 * eh + 2);
        ey.lid.setAttribute('y', y.toFixed(2));
        ey.lidline.setAttribute('y1', y.toFixed(2)); ey.lidline.setAttribute('y2', y.toFixed(2));
        ey.lidline.setAttribute('opacity', st.lid > .2 && e.lidline ? 1 : 0);
        ey.shine.setAttribute('r', (3.4 * Math.max(st.shine, 0)).toFixed(2));
        ey.shine.setAttribute('opacity', st.shine > .05 ? 1 : 0);
        ey.shine2.setAttribute('opacity', st.shine2.toFixed(2));
      });
    }
    setExpr('neutral');
    return { setExpr, lookAt, frame, st };
  }

  /* ---------- Elements ---------- */
  const root = document.createElement('div');
  root.className = 'konzi';
  root.innerHTML = `
    <div class="konzi-say" role="status" aria-live="polite" hidden>
      <div class="konzi-say-top"><span class="konzi-name">Konzi</span><button type="button" class="konzi-x" aria-label="Hide Konzi's message">×</button></div>
      <p class="konzi-text"></p>
      <div class="konzi-acts"></div>
    </div>
    <span class="konzi-bub konzi-b2"></span><span class="konzi-bub konzi-b1"></span>
    <button type="button" class="konzi-head" aria-label="Konzi, the tour guide. Drag to move, double-click to send back."></button>`;
  document.body.appendChild(root);

  const headBtn = root.querySelector('.konzi-head');
  const b1 = root.querySelector('.konzi-b1'), b2 = root.querySelector('.konzi-b2');
  const sayBox = root.querySelector('.konzi-say'), sayText = root.querySelector('.konzi-text'), acts = root.querySelector('.konzi-acts');
  const K = makeFace(headBtn);

  /* ---------- Which stop should be showing ---------- */
  let headings = [];
  // Builds the list of things Konzi talks about, in page order: section headings plus each project,
  // paper and note title. Rebuilt now and then because the latest notes load a moment after the page.
  function buildAnchors() {
    const list = [];
    SECTIONS.forEach(([id, sel]) => {
      const el = document.querySelector(sel); if (!el) return;
      list.push([id, el]);
      const items = id === 'projects' ? document.querySelectorAll('#projects .row')
        : id === 'publications' ? document.querySelectorAll('#publications .row')
        : id === 'notes' ? document.querySelectorAll('#latestPosts .post-item') : [];
      [...items].forEach((row, i) => {
        const line = itemLine(id, row);
        if (!line) return;
        const key = id + ':' + i;
        STOPS[key] = line.stop;
        if (i === 0) {
          // the first item sits level with the heading, so its line joins the section's intro
          const intro = STOPS[id];
          if (!intro._first) { intro.parts.splice(1, 0, ...line.stop.parts); intro._first = true; }
        } else list.push([key, row.querySelector('h3') || row.querySelector('a') || row]);
      });
    });
    headings = list;
  }
  function itemLine(sec, row) {
    if (sec === 'notes') {
      const a = row.querySelector('a[href*="post="]'); if (!a) return null;
      const slug = decodeURIComponent(a.getAttribute('href').split('post=')[1] || '');
      const parts = NOTE_LINES[slug]; if (!parts) return null;
      return { stop: { item: true, parts: [parts[0]], actions: [{ label: 'Read it →', href: 'notes.html?post=' + encodeURIComponent(slug) }] } };
    }
    const h3 = row.querySelector('h3'); if (!h3) return null;
    const hit = HOVER.find(([key]) => key.startsWith('a[') ? row.querySelector(key) : h3.textContent.includes(key));
    return hit ? { stop: { item: true, parts: [[hit[1], hit[2]]] } } : null;
  }
  buildAnchors();
  if (onHome) { const tick = setInterval(() => { const n = document.querySelectorAll('#latestPosts .post-item').length; if (n) { buildAnchors(); clearInterval(tick); } }, 600); }
  const tourOn = () => !mem.off && !session.quiet;
  let activeId = headings.length ? headings[0][0] : null;
  let override = null;          // a one-off stop (leaving, back, tap) that sits on top of the section's line
  let closedFor = null;         // the section whose line the visitor closed; it reopens when the section changes
  const partOf = {};
  // A quick one-liner (hover comment, waking up, landing) that sits on top of the section's line
  function aside(key, expr, text, ttl) {
    STOPS['aside:' + key] = { bare: true, parts: [[expr, text]] };
    override = 'aside:' + key; partOf[override] = 0;
    if (ttl) setTimeout(() => { if (override === 'aside:' + key) override = null; }, ttl);
  }

  function sectionStop(id) {
    if (!id) return null;
    if (id === 'hero' && mem.done && !session.tourAgain) return 'heroAgain';
    return id;
  }
  function wanted() {
    if (performance.now() - t0 < 1000) return null;   // let the page settle first
    if (dozing || thrown) return null;
    if (override) return override;
    if (!tourOn() || closedFor === activeId) return null;
    return sectionStop(activeId);
  }
  // Most things trigger a quarter of the way down the screen. Papers, Notes and Contact sit near the bottom of
  // the page and can't scroll that high, so they (and the notes listed under Notes) trigger lower.
  const LINE = { publications: .45, notes: .55, contact: .74 };
  const lineFor = id => LINE[id] || LINE[id.split(':')[0]] || .25;
  function scanActive() {
    // Most headings trigger a quarter of the way down the screen. Notes and Contact sit at the
    // bottom of the page and can't scroll that high, so their trigger lines are lower.
    let id = headings.length ? headings[0][0] : null;
    headings.forEach(([sid, el]) => { if (el.getBoundingClientRect().top <= innerHeight * lineFor(sid)) id = sid; });
    if (id !== activeId) {
      activeId = id; closedFor = null;
      if (id === 'contact' && !mem.done) { mem.done = true; save(); }
      if (shownId && !override) hop();
    }
  }

  /* ---------- Speech ---------- */
  let shownId = null, typer = null;
  function render(id) {
    clearInterval(typer); K.st.talk = false;
    shownId = id;
    if (!id) {
      sayBox.classList.remove('on'); root.classList.remove('talking');
      setTimeout(() => { if (!shownId) sayBox.hidden = true; }, 220);
      K.setExpr('neutral');
      return;
    }
    const stop = STOPS[id];
    if (stop.spin) spin();
    showPart();
  }
  function showPart() {
    const id = shownId, stop = STOPS[id];
    const p = Math.min(partOf[id] || 0, stop.parts.length - 1);
    const [expr, text] = stop.parts[p], last = p === stop.parts.length - 1;
    setExpression(expr);
    sayBox.hidden = false; root.classList.add('talking');
    requestAnimationFrame(() => sayBox.classList.add('on'));
    acts.innerHTML = '';
    clearInterval(typer);
    const done = () => { K.st.talk = false; buttons(); };
    if (reduce) { sayText.textContent = text; done(); }
    else {
      let i = 0; sayText.textContent = ''; K.st.talk = true;
      typer = setInterval(() => {
        if (shownId !== id) return clearInterval(typer);
        i = Math.min(text.length, i + 2);
        sayText.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(typer); done(); }
      }, 26);
    }
    function buttons() {
      if (stop.bare) return;
      if (!last) acts.appendChild(btn('Next →', () => { partOf[id] = p + 1; showPart(); }, 'primary'));
      else {
        (stop.actions || []).forEach((a, i) => acts.appendChild(btn(a.label, a.run ? () => { a.run(); } : null, i === 0 ? 'primary' : '', a)));
        if (!stop.actions && !stop.item) acts.appendChild(btn('Got it', close, 'primary'));
      }
      if (id === 'heroAgain') acts.appendChild(btn('Not now', () => { session.quiet = true; saveSession(); close(); }, ''));
      if (onHome && !override && id !== 'heroAgain') acts.appendChild(btn('Skip tour', skipTour, 'quiet'));
    }
  }
  function btn(label, fn, kind, a) {
    let el;
    if (a && a.href) {
      el = document.createElement('a'); el.href = a.href;
      if (a.ext) { el.target = '_blank'; el.rel = 'noopener noreferrer'; el.dataset.konziStay = '1'; }
    } else { el = document.createElement('button'); el.type = 'button'; if (fn) el.addEventListener('click', fn); }
    el.className = 'konzi-btn' + (kind ? ' ' + kind : '');
    el.textContent = label;
    return el;
  }
  // Close the current line: a one-off stop goes away, a section's line stays closed until the section changes
  function close() {
    if (override) override = null; else closedFor = activeId;
  }
  function skipTour() { mem.off = true; save(); override = null; }
  function restartTour() {
    mem.off = false; save(); session.quiet = false; session.tourAgain = true; saveSession();
    override = null; closedFor = null; Object.keys(partOf).forEach(k => delete partOf[k]);
    if (onHome) { shownId = '__restart'; scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    else location.href = 'index.html';
  }
  root.querySelector('.konzi-x').addEventListener('click', close);
  function setExpression(name) {
    K.setExpr(name);
    if (EXPR[name] && EXPR[name].jump && !reduce) P.vy -= 7;
  }

  /* ---------- Placement ---------- */
  const corner = () => innerWidth < 760;
  const wrapEl = document.querySelector('main.wrap') || document.querySelector('.wrap');
  let drop = session.drop || null;          // where the visitor dragged Konzi to, for this visit
  function size() { return headBtn.offsetWidth || 60; }
  function homePoint() {
    const S = size(), vw = document.documentElement.clientWidth, vh = innerHeight;
    if (drop) return { x: Math.min(vw - S / 2 - 8, Math.max(S / 2 + 8, drop.x)), y: Math.min(vh - S / 2 - 40, Math.max(S / 2 + 70, drop.y)) };
    if (corner()) return { x: 16 + S / 2, y: vh - 46 - S / 2 };
    const wr = wrapEl ? wrapEl.getBoundingClientRect().right : vw - 40;
    const gutter = vw - wr;
    const x = gutter >= S + 40 ? wr + Math.min(40, (gutter - S) / 2) + S / 2 : vw - S / 2 - 14;
    let anchor = 0;
    const h = headings.find(([id]) => id === activeId);
    if (h) anchor = h[1].getBoundingClientRect().top + S / 2;
    return { x, y: Math.min(vh - 150, Math.max(96 + S / 2, anchor)) };
  }
  function placeSpeech() {
    if (sayBox.hidden) return;
    const S = size(), vw = document.documentElement.clientWidth, vh = innerHeight;
    const w = sayBox.offsetWidth, h = sayBox.offsetHeight;
    let x, y;
    if (corner() && !drop) { x = 12; y = P.y - S / 2 - 12 - h; }
    else {
      const right = P.x + S / 2 + 14;
      x = right + w <= vw - 12 ? right : P.x - S / 2 - 14 - w;
      y = P.y - S / 2;
    }
    x = Math.max(12, Math.min(vw - w - 12, x));
    y = Math.max(76, Math.min(vh - h - 12, y));
    sayBox.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
  }

  /* ---------- Dragging, tapping ---------- */
  let dragging = false, downAt = null, dragPt = null, trail = [], thrown = false, settle = 0, rot = 0;
  headBtn.addEventListener('pointerdown', e => {
    downAt = { x: e.clientX, y: e.clientY }; dragPt = null;
    try { headBtn.setPointerCapture(e.pointerId); } catch (_) {}
  });
  headBtn.addEventListener('pointermove', e => {
    if (!downAt) return;
    if (!dragging && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) { dragging = true; root.classList.add('dragging'); }
    if (dragging) {
      dragPt = { x: e.clientX, y: e.clientY };
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (trail.length > 8) trail.shift();
    }
  });
  const up = () => {
    if (!downAt) return;
    if (dragging) {
      dragging = false; root.classList.remove('dragging');
      // a fast release throws Konzi: it flies, falls with gravity, and bounces off the edges
      const now = performance.now(), recent = trail.filter(p => now - p.t < 90);
      let vx = 0, vy = 0;
      if (recent.length > 1) { const a = recent[0], b = recent[recent.length - 1], dt = Math.max(16, b.t - a.t); vx = (b.x - a.x) / dt * 16; vy = (b.y - a.y) / dt * 16; }
      if (!reduce && Math.hypot(vx, vy) > 12) {
        thrown = true; settle = 0; override = null;
        P.x = dragPt.x; P.y = dragPt.y;
        const m = Math.min(1, 46 / Math.hypot(vx, vy)); P.vx = vx * m; P.vy = vy * m;
        K.setExpr('shocked');
      } else { drop = dragPt ? { x: dragPt.x, y: dragPt.y } : { x: P.x, y: P.y }; session.drop = drop; saveSession(); }
      trail = [];
    } else tap();
    downAt = null;
  };
  headBtn.addEventListener('pointerup', up);
  headBtn.addEventListener('pointercancel', () => { downAt = null; dragging = false; root.classList.remove('dragging'); });
  headBtn.addEventListener('dblclick', () => { drop = null; delete session.drop; saveSession(); spin(); });
  headBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });

  function tap() {
    if (thrown) return;
    hop();
    if (!tourOn()) { override = 'tapOff'; partOf.tapOff = 0; return; }
    if (!shownId) { closedFor = null; if (!wanted()) { override = 'tap'; partOf.tap = 0; } return; }
    const prev = K.st.expr; K.setExpr('laugh'); setTimeout(() => { if (K.st.expr === 'laugh') K.setExpr(prev); }, 900);
  }

  /* ---------- Motion ---------- */
  const P = { x: -200, y: -200, vx: 0, vy: 0 }, B1 = { x: -200, y: -200, vx: 0, vy: 0 }, B2 = { x: -200, y: -200, vx: 0, vy: 0 };
  let spinStart = 0, pointer = null, placed = false;
  function spin() { if (!reduce) spinStart = performance.now(); }
  function hop() { if (!reduce) P.vy -= 5; }
  addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; poke(); }, { passive: true });
  /* Dozing: after a while with no activity Konzi falls asleep, and wakes up embarrassed */
  const DOZE_MS = 25000;
  let lastActive = performance.now(), dozing = false;
  function poke() {
    lastActive = performance.now();
    if (!dozing) return;
    dozing = false; K.setExpr('shocked'); hop();
    if (tourOn()) aside('wake', 'shocked', "I wasn't sleeping! I was... processing. 😳", 3200);
  }
  ['scroll', 'keydown', 'touchstart', 'wheel', 'pointerdown'].forEach(ev => addEventListener(ev, poke, { passive: true }));
  document.addEventListener('pointerleave', () => { pointer = null; });

  const spring = (o, tx, ty, k, damp) => { o.vx = (o.vx + (tx - o.x) * k) * damp; o.vy = (o.vy + (ty - o.y) * k) * damp; o.x += o.vx; o.y += o.vy; };
  const lean = (v, m) => Math.max(-m, Math.min(m, v));
  const leash = (o, ax, ay, max) => { const dx = o.x - ax, dy = o.y - ay, d = Math.hypot(dx, dy); if (d > max) { o.x = ax + dx / d * max; o.y = ay + dy / d * max; } };
  const t0 = performance.now();

  function loop(now) {
    const t = (now - t0) / 1000, S = size(), r = S / 2;
    scanActive();
    const want = wanted();
    if (want !== shownId) render(want);

    if (!dozing && !dragging && !thrown && now - lastActive > DOZE_MS && document.visibilityState === 'visible') {
      dozing = true; override = null;
    }
    if (dozing && !shownId && K.st.expr !== 'sleepy') K.setExpr('sleepy');

    const home = dragging && dragPt ? dragPt : homePoint();
    const e = EXPR[K.st.expr];
    const ty = home.y + (reduce || dragging ? 0 : Math.sin(t * (dozing ? .8 : 1.6)) * 3);
    if (thrown) {
      const vw = document.documentElement.clientWidth, vh = innerHeight, floor = vh - r - 34;
      P.vy += .9; P.x += P.vx; P.y += P.vy; rot += P.vx * 2.2;
      if (P.x < r + 6) { P.x = r + 6; P.vx = -P.vx * .7; }
      if (P.x > vw - r - 6) { P.x = vw - r - 6; P.vx = -P.vx * .7; }
      if (P.y < r + 70) { P.y = r + 70; P.vy = -P.vy * .6; }
      if (P.y > floor) { P.y = floor; P.vy = -P.vy * .5; P.vx *= .86; if (Math.abs(P.vy) < 2.2) P.vy = 0; }
      settle = P.y >= floor - .5 && Math.abs(P.vx) < .6 && P.vy === 0 ? settle + 1 : 0;
      if (settle > 12) {
        thrown = false; rot = 0;
        drop = { x: P.x, y: P.y }; session.drop = drop; saveSession();
        K.setExpr('dizzy');
        const lines = ['Wheee! ...Okay, the room is spinning. 😵‍💫', 'Gravity: 1, Konzi: 0. Again?', '9.8 m/s² confirmed. Physics still works!', 'Was that a Penrose process? I feel... energetic.'];
        aside('land', 'dizzy', lines[Math.floor(Math.random() * lines.length)], 3800);
      }
    }
    else if (!placed || reduce) { Object.assign(P, { x: home.x, y: ty, vx: 0, vy: 0 }); placed = true; }
    else spring(P, home.x, ty, dragging ? .25 : .05, dragging ? .6 : .84);

    // trailing bubbles hang below the head and drag behind its motion
    const r1 = S * .1, r2 = S * .065, g1 = r + r1 + 5, g2 = r1 + r2 + 4;
    const a1x = P.x - lean(P.vx * 3, 18), a1y = P.y + g1 - lean(P.vy * 2, 12);
    if (reduce || B1.x < -100) Object.assign(B1, { x: a1x, y: a1y, vx: 0, vy: 0 }); else { spring(B1, a1x, a1y, .045, .86); leash(B1, P.x, P.y + g1, 22); }
    const a2x = B1.x - 2 - lean(B1.vx * 3, 12), a2y = B1.y + g2 - lean(B1.vy * 2, 8);
    if (reduce || B2.x < -100) Object.assign(B2, { x: a2x, y: a2y, vx: 0, vy: 0 }); else { spring(B2, a2x, a2y, .04, .86); leash(B2, B1.x, B1.y + g2, 16); }

    let tilt = e.tilt + (thrown ? rot : lean(P.vx * 1.5, 12)), bob = 0;
    if (!reduce) {
      if (e.bounce) bob -= Math.abs(Math.sin(t * 9)) * 4;
      if (K.st.talk) bob += Math.sin(t * 16) * 1.2;
      if (spinStart) {
        const u = (now - spinStart) / 750;
        if (u >= 1) spinStart = 0;
        else tilt += (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) * 360;
      }
    }
    headBtn.style.transform = `translate(${(P.x - r).toFixed(1)}px,${(P.y - r + bob).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
    b1.style.transform = `translate(${(B1.x - r1).toFixed(1)}px,${(B1.y - r1).toFixed(1)}px)`;
    b2.style.transform = `translate(${(B2.x - r2).toFixed(1)}px,${(B2.y - r2).toFixed(1)}px)`;
    placeSpeech();

    // eyes follow the pointer, or glance at the speech bubble while talking
    if (hoverEl && override && override.startsWith('aside:hover')) { const hb = hoverEl.getBoundingClientRect(); K.lookAt(hb.left + hb.width / 2 - P.x, hb.top + 20 - P.y); }
    else if (K.st.talk) { const sb = sayBox.getBoundingClientRect(); K.lookAt(sb.left + sb.width / 2 - P.x, sb.top + 20 - P.y); }
    else if (pointer) K.lookAt(pointer.x - P.x, pointer.y - P.y);
    else K.lookAt(0, 0);
    K.frame(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------- Leaving for a demo, then coming back ---------- */
  if (onHome) {
    let awayAt = 0;
    document.addEventListener('click', ev => {
      const a = ev.target.closest && ev.target.closest('a[target="_blank"]');
      if (!a || a.dataset.konziStay) return;
      awayAt = Date.now();
      if (tourOn() && a.closest('#projects')) { override = 'leaving'; partOf.leaving = 0; }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !awayAt) return;
      const gone = Date.now() - awayAt; awayAt = 0;
      if (gone > 4000 && tourOn()) { override = 'back'; partOf.back = 0; hop(); }
      else if (override === 'leaving') override = null;
    });
  }

  /* ---------- Hover comments on projects and papers (mouse users only) ---------- */
  let hoverEl = null;
  if (onHome && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const rows = [...document.querySelectorAll('#projects .row, #publications .row')];
    const said = new Set();
    rows.forEach((row, i) => {
      const h3 = row.querySelector('h3'); if (!h3) return;
      const hit = HOVER.find(([key]) => key.startsWith('a[') ? row.querySelector(key) : h3.textContent.includes(key));
      if (!hit) return;
      let timer = null;
      row.addEventListener('mouseenter', () => {
        timer = setTimeout(() => {
          if (!tourOn() || dragging || thrown || dozing || said.has(i)) return;
          if (headings.some(([id, el]) => id === activeId && row.contains(el))) return;   // its line is already up
          if (override && !override.startsWith('aside:hover')) return;   // don't talk over a welcome-back
          said.add(i); hoverEl = row;
          aside('hover' + i, hit[1], hit[2]);
        }, 450);
      });
      row.addEventListener('mouseleave', () => {
        clearTimeout(timer);
        setTimeout(() => { if (override === 'aside:hover' + i) { override = null; hoverEl = null; } }, 900);
      });
    });
  }

  window.konzi = { restart: restartTour };
})();
