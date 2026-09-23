/* =========================================================
   K's assistant: local, keyword-based portfolio chatbot.
   No AI service, no network requests, nothing stored.

   To add or change an answer, edit KB below:
     keys:   words/phrases that trigger it (lower-case, whole words;
             end with * for a prefix match, e.g. 'accelerat*')
     answer: text; [label](url) becomes a link
     chips:  optional follow-up suggestions
   Contact policy: email and LinkedIn only. Never add a phone number.
   ========================================================= */
(function () {
  const EMAIL = 'kaunteyacharya2000@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/kauntey-acharya';
  const GH = 'https://github.com/KaunteyAcharya';
  const WORDPRESS = 'https://kaunteyacharya.wordpress.com/';
  const MEDIUM = 'https://medium.com/@sometimes_rational';
  const CONTACT = `Email: [${EMAIL}](mailto:${EMAIL})\nLinkedIn: [linkedin.com/in/kauntey-acharya](${LINKEDIN})`;

  const KB = [
    /* ---------- Conversation ---------- */
    { id: 'greeting', keys: ['hello', 'hi', 'hey', 'hola', 'namaste', 'good morning', 'good afternoon', 'good evening', 'yo'],
      answer: 'Hi! I can tell you about Kauntey’s background, experience, projects, research papers, notes, or how to get in touch. What would you like to know?',
      chips: ['Who is Kauntey?', 'Publications', 'Projects', 'How to contact'] },
    { id: 'thanks', keys: ['thanks', 'thank you', 'thx', 'great', 'awesome', 'cool', 'helpful'],
      answer: 'Glad to help! Anything else, such as papers, projects, or contact details?' },
    { id: 'bye', keys: ['bye', 'goodbye', 'see you', 'cya'],
      answer: `Thanks for stopping by. If you’d like to talk to Kauntey directly:\n${CONTACT}` },

    /* ---------- Contact (phone intentionally excluded) ---------- */
    { id: 'phone', weight: 3, keys: ['phone', 'mobile', 'cell', 'whatsapp', 'call him', 'contact number', 'phone number', 'number', 'telephone', 'ring'],
      answer: `Kauntey doesn’t share a phone number publicly. The best ways to reach him are:\n${CONTACT}\n\nIf a call makes sense, you can arrange one over email or LinkedIn.` },
    { id: 'contact', weight: 2, keys: ['contact', 'reach', 'email', 'mail', 'linkedin', 'get in touch', 'connect', 'message him', 'dm', 'talk to', 'ping'],
      answer: `Ping Kauntey for opportunities, a research collab, or just a good paper to discuss:\n${CONTACT}` },
    { id: 'hire', weight: 2, keys: ['hire', 'hiring', 'job', 'opportunity', 'opportunities', 'available', 'open to', 'recruit', 'recruiter', 'position', 'role for', 'collaborate', 'collaboration', 'collab', 'freelance'],
      answer: `Kauntey is open to AI automation engineering and quantitative analyst roles, as well as research collaborations in AI or physics.\n\nTo start a conversation:\n${CONTACT}`,
      chips: ['Experience', 'Skills', 'Projects'] },
    { id: 'resume', keys: ['resume', 'cv', 'curriculum vitae', 'portfolio pdf'],
      answer: `A CV is available on request. Email [${EMAIL}](mailto:${EMAIL}) or message him on [LinkedIn](${LINKEDIN}).` },
    { id: 'location', keys: ['where is he', 'where does he live', 'where is kauntey', 'location', 'based', 'city', 'ahmedabad', 'india', 'timezone', 'time zone', 'relocate', 'remote'],
      answer: 'Kauntey is based in Ahmedabad, India (IST, UTC+5:30). For questions about remote work or relocation, it’s best to ask him directly by email or LinkedIn.' },

    /* ---------- About ---------- */
    { id: 'about', keys: ['about', 'who', 'what does he do', 'what does kauntey do', 'background', 'kauntey', 'profile', 'bio', 'introduce', 'yourself', 'summary'],
      answer: 'Kauntey Acharya is an AI Automation Engineer and Quantitative Analyst. At Innodata Inc. he designs and builds AI automations and evaluates large language models. He also builds fully local AI tools (RAG pipelines and research agents) with n8n, Ollama, and ChromaDB. Before that, he was a pre-doctoral research fellow in theoretical physics and published four peer-reviewed papers on naked singularities, energy extraction, and particle collisions in general relativity.',
      chips: ['Experience', 'Publications', 'Projects'] },
    { id: 'education', keys: ['education', 'degree', 'study', 'studied', 'university', 'college', 'masters', 'msc', 'phd', 'academic', 'qualification'],
      answer: 'Kauntey trained in physics and then worked as a Pre-Doctoral Research Fellow at Ahmedabad University (May 2022 to Mar 2024), doing theoretical and numerical research in general relativity. For full academic details, see his [LinkedIn](' + LINKEDIN + ').' },
    { id: 'interests', keys: ['interest', 'interests', 'hobby', 'hobbies', 'chess', 'sci-fi', 'science fiction', 'big bang theory', 'neuroscience', 'cognitive', 'biology', 'evolution', 'free time', 'fun'],
      answer: 'Outside work Kauntey reads research papers, plays chess, and watches sci-fi (and The Big Bang Theory). He’s also interested in neuroscience, cognitive science, and evolutionary biology.' },

    /* ---------- Experience ---------- */
    { id: 'experience', keys: ['experience', 'work', 'worked', 'career', 'employment', 'jobs', 'history', 'current'],
      answer: '• AI Automation Engineer & Analyst, Innodata Inc. (Aug 2024 to present)\n• Research Analyst and Writer, NetBotPro Technologies (Apr 2024 to Aug 2024)\n• Pre-Doctoral Research Fellow, Ahmedabad University (May 2022 to Mar 2024)',
      chips: ['Innodata', 'Research fellowship', 'Skills'] },
    { id: 'innodata', weight: 2, keys: ['innodata', 'automation engineer', 'ai automation', 'automations', 'ai analyst', 'prompt engineer', 'llm evaluation', 'evaluation'],
      answer: 'At Innodata Inc. (Aug 2024 to present) Kauntey is an AI Automation Engineer & Analyst. He designs and builds AI automations and workflows, and works on LLM evaluation, response-quality analysis, role-specific behaviour testing, and multimodal AI workflows.' },
    { id: 'netbotpro', weight: 2, keys: ['netbotpro', 'research analyst', 'writer', 'reviewer', 'seo'],
      answer: 'At NetBotPro Technologies (Apr 2024 to Aug 2024) Kauntey was a Research Analyst and Writer: research-driven technical scripts, academic content review, SEO-aware writing, and prompt engineering.' },
    { id: 'fellow', weight: 2, keys: ['fellow', 'fellowship', 'pre-doctoral', 'predoctoral', 'research fellowship', 'ahmedabad university'],
      answer: 'As a Pre-Doctoral Research Fellow at Ahmedabad University (May 2022 to Mar 2024), Kauntey did theoretical and numerical work on electromagnetic fields and particle dynamics in curved spacetime, collaborating with Prof. Pankaj S. Joshi and others. It produced four peer-reviewed papers.',
      chips: ['Publications'] },

    /* ---------- Skills ---------- */
    { id: 'skills', keys: ['skill', 'skills', 'stack', 'tools', 'tech', 'python', 'sql', 'pytorch', 'pandas', 'numpy', 'machine learning', 'ml', 'statistics', 'statistical', 'bayesian', 'time series', 'latex', 'matlab', 'mathematica', 'c++', 'programming', 'languages', 'zapier', 'api', 'apis', 'api integration', 'obsidian'],
      answer: 'AI & automation: n8n, Zapier, API integration, RAG pipelines, LLM evaluation, prompt engineering, Ollama, ChromaDB, and Docker.\nLanguages & libraries: Python, SQL, NumPy, Pandas, PyTorch, C++ (basic), MATLAB, and Mathematica.\nQuantitative methods: statistical analysis, time-series modelling, Bayesian inference, parameter estimation, and machine learning.\nResearch & writing: scientific research, research writing, peer-reviewed publishing, literature review, technical writing, LaTeX, and Obsidian.' },

    /* ---------- Research & publications ---------- */
    { id: 'research', keys: ['research', 'physics', 'theoretical', 'relativity', 'general relativity', 'gravity', 'spacetime', 'black hole', 'singularity', 'naked singularity', 'astrophysics', 'cosmology'],
      answer: 'Kauntey’s physics research is in general relativity: naked singularities (JMN-1 and JNW), black-hole mimickers, energy extraction (Penrose and magnetic Penrose processes), high-energy particle collisions, and magnetic fields around compact objects. He has also built Bayesian parameter estimation pipelines for gravitational-wave tests of GR.',
      chips: ['Publications', 'Particle collisions paper', 'Energy extraction'] },
    { id: 'publications', weight: 2, keys: ['publication', 'publications', 'paper', 'papers', 'journal', 'published', 'article', 'articles', 'citations', 'scholar'],
      answer: 'Four peer-reviewed papers:\n1. JMN-1 singularity in weak magnetic field, [Eur. Phys. J. C 84, 535](https://link.springer.com/article/10.1140/epjc/s10052-024-12905-4)\n2. High energy particle collision in vicinity of naked singularity, [Phys. Dark Univ. Vol. 50, 102101](https://doi.org/10.1016/j.dark.2025.102101)\n3. Energy extraction from Janis-Newman-Winicour naked singularity, [Phys. Rev. D 107, 064036](https://doi.org/10.1103/PhysRevD.107.064036)\n4. Rotational energy extraction from Kerr black hole’s mimickers, [Universe 2022, 8(11), 571](https://doi.org/10.3390/universe8110571)\n\nAsk about any one for details.',
      chips: ['Magnetic field paper', 'Particle collisions paper', 'JNW paper', 'Mimickers paper'] },
    { id: 'pub_collisions', weight: 3, keys: ['collision', 'collisions', 'particle collision', 'dark universe', 'planck', 'cosmic ray', 'hawking', 'center of mass', 'centre of mass', 'accelerat*'],
      answer: 'High energy particle collision in vicinity of naked singularity\nK. Acharya, P. Bambhaniya, P. S. Joshi, K. Pandey, and V. Patel. Kauntey is first author.\n\nParticles falling toward the JMN-1 naked singularity can turn back and collide head-on with incoming ones. For 1/2 ≤ M₀ ≤ 2/3, collisions at about 1.3M to 4M reach centre-of-mass energies near the Planck scale (~10²⁸ eV), could form micro black holes that evaporate into ~10²⁶ eV particles, and need less fine-tuning than black-hole mechanisms.\n\n[Phys. Dark Univ. Vol. 50, 102101](https://doi.org/10.1016/j.dark.2025.102101)' },
    { id: 'pub_magnetic', weight: 3, keys: ['magnetic', 'magnetic field', 'weak magnetic', 'jmn', 'jmn-1', 'epjc', 'eur phys', 'european physical', 'azreg', 'surface current', 'master equation'],
      answer: 'JMN-1 singularity in weak magnetic field\nM. Azreg-Ainou, K. Acharya, and P. S. Joshi.\n\nDerives the master equations for a weak magnetic field in spherically symmetric spacetimes and applies them to JMN-1. The tangential field jumps at the boundary between interior matter and the exterior Schwarzschild vacuum, creating surface currents, yet the centre-of-mass energy of colliding charged particles stays continuous across it.\n\n[Eur. Phys. J. C 84, 535](https://link.springer.com/article/10.1140/epjc/s10052-024-12905-4)' },
    { id: 'pub_jnw', weight: 3, keys: ['jnw', 'janis', 'newman', 'winicour', 'physical review', 'phys rev', 'prd', 'ergoregion', 'effective ergoregion'],
      answer: 'Energy extraction from Janis-Newman-Winicour naked singularity\nV. Patel, K. Acharya, P. Bambhaniya, and P. S. Joshi.\n\nThe rotating JNW spacetime has no true ergoregion, but in a magnetic field an “effective ergoregion” with negative-energy orbits appears, allowing energy extraction with efficiency up to about 60%. The paper maps how efficiency depends on field strength, spin, and particle charge.\n\n[Phys. Rev. D 107, 064036](https://doi.org/10.1103/PhysRevD.107.064036)' },
    { id: 'pub_mimickers', weight: 3, keys: ['mimicker', 'mimickers', 'simpson', 'visser', 'conformal', 'kerr', 'universe journal', 'mdpi', 'regular spacetime'],
      answer: 'Rotational energy extraction from Kerr black hole’s mimickers\nV. Patel, K. Acharya, P. Bambhaniya, and P. S. Joshi.\n\nApplies the Penrose process to Simpson-Visser and conformally transformed regular spacetimes. Simpson-Visser efficiency matches Kerr regardless of the regularisation parameter, while conformal geometries give much higher efficiency, a potential observational way to tell mimickers from Kerr black holes.\n\n[Universe 2022, 8(11), 571](https://doi.org/10.3390/universe8110571)' },
    { id: 'energy', weight: 2, keys: ['energy extraction', 'penrose', 'penrose process', 'rotational energy', 'extract energy'],
      answer: 'Two of Kauntey’s papers are on energy extraction:\n• JNW naked singularity (Phys. Rev. D, 2023): magnetic Penrose process, efficiency up to about 60%.\n• Kerr black hole mimickers (Universe, 2022): Penrose process in Simpson-Visser and conformal geometries.',
      chips: ['JNW paper', 'Mimickers paper'] },
    { id: 'coauthors', keys: ['coauthor', 'co-author', 'coauthors', 'collaborators', 'joshi', 'bambhaniya', 'patel', 'pandey', 'supervisor', 'advisor', 'mentor'],
      answer: 'Kauntey’s co-authors include Prof. Pankaj S. Joshi, Parth Bambhaniya, Vishva Patel, Kshitij Pandey, and Mustapha Azreg-Ainou.' },

    /* ---------- Projects ---------- */
    { id: 'projects', weight: 2, keys: ['project', 'projects', 'github', 'repo', 'repos', 'code', 'built', 'build', 'portfolio'],
      answer: `Projects:\n• FocusPulse (Chrome extension)\n• EasyAutoFill (browser extension)\n• ArXiv Research Analysis Agent (n8n, Ollama, and Telegram)\n• Local RAG Document Q&A Agent (n8n, Ollama, and ChromaDB)\n• Banking & Financial Stock Analysis\n• Gravitational-Wave Tests of GR (ppE, Bayesian parameter estimation)\n• Credit Score Data Analysis\n• Indian Startup Investment EDA\n\nAll on [GitHub](${GH}).`,
      chips: ['RAG agent', 'ArXiv agent', 'Stock analysis'] },
    { id: 'proj_rag', weight: 3, keys: ['rag', 'retrieval', 'document q&a', 'doc qa', 'chromadb', 'chroma', 'embedding', 'embeddings', 'vector', 'llama', 'nomic'],
      answer: 'Local RAG Document Q&A Agent: a fully local retrieval-augmented generation pipeline. Upload a PDF, TXT, DOCX, or MD file; it is chunked (400 characters, 100 overlap), embedded with nomic-embed-text, and stored in ChromaDB. Questions retrieve the top 15 chunks, and llama3.2:1b answers only from that context. Orchestrated in n8n with Docker, with no cloud APIs.\n\n[GitHub](https://github.com/KaunteyAcharya/RAG-doc-qa-agent) · [Demo](https://github.com/KaunteyAcharya/RAG-doc-qa-agent#readme) · [Note](notes.html?post=local-rag-agent)' },
    { id: 'proj_arxiv', weight: 3, keys: ['arxiv', 'telegram', 'research agent', 'paper monitor', 'automation', 'n8n', 'workflow', 'ollama', 'qwen'],
      answer: 'ArXiv Research Analysis Agent: an n8n workflow that checks arXiv new submissions daily (gr-qc and q-fin by default), filters by keywords, and sends a Telegram brief with a yes/no prompt. Reply “yes <id>” and it downloads the PDF, has a local Ollama model walk through the paper from first principles, and sends back a Markdown report. State lives in ChromaDB.\n\n[GitHub](https://github.com/KaunteyAcharya/n8n-arxiv-research-automation) · [Demo](https://github.com/KaunteyAcharya/n8n-arxiv-research-automation#readme) · [Note](notes.html?post=automating-arxiv)' },
    { id: 'proj_bank', weight: 3, keys: ['stock', 'stocks', 'banking', 'bank', 'yfinance', 'finance', 'financial', 'volatility', 'returns', 'quant'],
      answer: 'Banking & Financial Stock Analysis: quantitative analysis of banking stocks covering returns, volatility, correlations, and risk metrics, using yfinance and Pandas.\n\n[GitHub](https://github.com/KaunteyAcharya/yfinance-banking-stock-analysis)' },
    { id: 'proj_gw', weight: 3, keys: ['gravitational wave', 'gravitational waves', 'gw', 'ppe', 'post-einsteinian', 'ligo', 'test of gr', 'tests of gr', 'parameter estimation'],
      answer: 'Gravitational-Wave Tests of GR: Bayesian parameter estimation pipelines that test for deviations from General Relativity in gravitational-wave data, using the parametrized post-Einsteinian (ppE) framework.\n\n[GitHub](https://github.com/KaunteyAcharya/GW-GR-Test-ppe-formalism)' },
    { id: 'proj_credit', weight: 3, keys: ['credit', 'credit score', 'default', 'default risk', 'class imbalance', 'loan'],
      answer: 'Credit Score Data Analysis: EDA of credit data focusing on default risk, class imbalance, correlations, and interpretability.\n\n[GitHub](https://github.com/KaunteyAcharya/Credit-Score-Data-Analysis)' },
    { id: 'proj_startup', weight: 3, keys: ['startup', 'startups', 'start-up', 'funding', 'investment', 'investor', 'venture'],
      answer: 'Indian Startup Investment EDA: exploratory analysis of Indian startup funding trends, sectors, and investor activity.\n\n[GitHub](https://github.com/KaunteyAcharya/start-ups-data-analysis)' },

    { id: 'proj_focus', weight: 3, keys: ['focuspulse', 'focus pulse', 'focus', 'productivity', 'chrome extension', 'extension'],
      answer: 'FocusPulse: a Chrome extension where you track your own focus with four colours (deep work, work with music, distraction, and break), shown as a live floating widget. Built with Manifest V3, plain JavaScript, and chrome.storage.local, with no backend. Kauntey welcomes ideas to make it more engaging by email or LinkedIn.\n\n[GitHub](https://github.com/KaunteyAcharya/FocusPulse) · [Note](notes.html?post=creating-focuspulse)' },
    { id: 'proj_autofill', weight: 3, keys: ['easyautofill', 'easy auto fill', 'autofill', 'auto fill', 'auto-fill', 'form', 'forms'],
      answer: 'EasyAutoFill: a free, open-source browser extension that fills any form from a profile file (Markdown, JSON, TXT, or CSV). It matches fields by input type, keywords, and fuzzy matching, and stores everything locally in IndexedDB.\n\n[GitHub](https://github.com/KaunteyAcharya/Easy-Auto-Fill) · [Note](notes.html?post=creating-easyautofill)' },

    /* ---------- Notes / writing ---------- */
    { id: 'notes', weight: 2, keys: ['blog', 'blogs', 'series', 'stats with first principles', 'notes', 'note', 'writing', 'writes', 'write', 'posts', 'wordpress', 'medium', 'read more', 'essays'],
      answer: `Kauntey writes about AI, agents, quantitative finance, statistics, and data science, along with personal views and notes.\n\nThe [Notes](notes.html) section of this site has short updates and thoughts. For longer, specific blogs, read him on [WordPress](${WORDPRESS}) and [Medium](${MEDIUM}), where he is running the Stats_with_FirstPrinciples series.` }
  ];

  const START_CHIPS = ['Who is Kauntey?', 'Publications', 'Projects', 'How to contact'];
  const FALLBACK = {
    answer: `I’m a small local assistant, so I only know what’s on this site. Try one of these, or ask Kauntey directly:\n${CONTACT}`,
    chips: ['Experience', 'Publications', 'Projects', 'Skills']
  };

  /* ---------- Matching ---------- */
  const norm = s => ' ' + s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9+#&.\-\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const compiled = KB.map(e => ({ ...e, res: e.keys.map(k => k.endsWith('*')
    ? new RegExp('(^|[^a-z0-9])' + esc(k.slice(0, -1)), 'i')                    // prefix match
    : new RegExp('(^|[^a-z0-9])' + esc(k) + '($|[^a-z0-9])', 'i')) }));

  function answer(q) {
    const text = norm(q);
    let best = null;
    compiled.forEach(e => {
      let score = 0;
      e.res.forEach((re, i) => { if (re.test(text)) score += (e.keys[i].includes(' ') ? 2 : 1); });
      if (!score) return;
      score *= (e.weight || 1);
      if (!best || score > best.score) best = { score, e };
    });
    return best ? best.e : FALLBACK;
  }

  /* ---------- UI ---------- */
  const chat = document.getElementById('chat');
  const toggle = document.getElementById('chatToggle');
  const close = document.getElementById('chatClose');
  const log = document.getElementById('chatLog');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  if (!chat) return;

  // Render text safely; only the bot's own [label](url) syntax becomes links.
  function renderRich(el, text) {
    const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      const a = document.createElement('a');
      a.textContent = m[1];
      a.href = m[2];
      if (/^https?:/.test(m[2])) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      el.appendChild(a);
      last = re.lastIndex;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }

  function add(text, who) {
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    if (who === 'bot') renderRich(d, text); else d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  function addChips(list) {
    if (!list || !list.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'chips';
    list.forEach(label => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { wrap.remove(); ask(label); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  const CHIP_ALIASES = {
    'how to contact': 'contact', 'particle collisions paper': 'particle collision', 'magnetic field paper': 'magnetic field',
    'jnw paper': 'jnw', 'mimickers paper': 'mimickers', 'rag agent': 'rag', 'arxiv agent': 'arxiv',
    'stock analysis': 'stock', 'research fellowship': 'fellowship', 'energy extraction': 'energy extraction'
  };

  function ask(q) {
    add(q, 'user');
    const e = answer(CHIP_ALIASES[q.toLowerCase()] || q);
    setTimeout(() => { add(e.answer, 'bot'); addChips(e.chips); }, 220);
  }

  let greeted = false;
  function open() {
    chat.classList.add('open');
    chat.setAttribute('aria-hidden', 'false');
    toggle.hidden = true;
    toggle.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      add('Hi, I’m Kauntey’s portfolio assistant. Ask me about his work, projects, papers, notes, or how to get in touch.', 'bot');
      addChips(START_CHIPS);
    }
    setTimeout(() => input.focus(), 50);
  }
  function shut() {
    chat.classList.remove('open');
    chat.setAttribute('aria-hidden', 'true');
    toggle.hidden = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }

  toggle.addEventListener('click', open);
  close.addEventListener('click', shut);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && chat.classList.contains('open')) shut(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });

  // Exposed for quick testing in the console: kaAsk("what's his phone number")
  window.kaAsk = q => answer(q).id || 'fallback';
})();
