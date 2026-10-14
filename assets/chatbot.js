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
  /* ---------- Call booking ----------
     endpoint: your Google Apps Script web-app URL. Leave '' for demo mode
               (sample slots, nothing is booked, no email is sent).
     turnstileSiteKey: Cloudflare Turnstile SITE key (public by design).
     Never put secret keys, calendar IDs, or passwords in this file:
     it is public on GitHub and in every visitor's browser. */
  const BOOKING = {
    endpoint: 'https://script.google.com/macros/s/AKfycbyPIRpuZ7-yNebIvXen_JSsVFEIxY5-78oqKosIOacKapdUhoAGAm2YK6OJmtkN5HwOJQ/exec',
    turnstileSiteKey: '0x4AAAAAAFVrsFQVhIi8osXj',
    lengths: [15, 30],
    holdMinutes: 15,
    // Demo mode only runs in previews. On the live site (github.io) booking stays
    // hidden until an endpoint is set, so nobody thinks a demo booking was real.
    demoOnLiveSite: false
  };
  const BOOKING_ON = !!BOOKING.endpoint || BOOKING.demoOnLiveSite || !/\.github\.io$/i.test(location.hostname);
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
      answer: `Ping Kauntey for opportunities related to AI roles, agent builds, research collabs, or just a good paper to discuss:\n${CONTACT}` },
    { id: 'hire', weight: 2, keys: ['hire', 'hiring', 'job', 'opportunity', 'opportunities', 'available', 'open to', 'recruit', 'recruiter', 'position', 'role for', 'collaborate', 'collaboration', 'collab', 'freelance'],
      answer: `Kauntey is open to AI roles (AI automation engineering, AI strategy and consulting, and quantitative analysis), agent builds, and research collaborations in AI or physics.\n\nTo start a conversation:\n${CONTACT}`,
      chips: ['Experience', 'Skills', 'Projects'] },
    { id: 'consulting', weight: 3, keys: ['consult', 'consultant', 'consulting', 'strategy', 'strategist', 'ai strategy', 'advise', 'advisor', 'advisory', 'business', 'use case', 'use cases', 'roi', 'prototype', 'my company', 'our team', 'help us', 'automate our', 'agent build', 'build an agent'],
      answer: `Kauntey works as an AI strategist and consultant as well as an engineer. He helps identify where AI can create practical leverage, translates business problems into AI solutions, and builds working prototypes: agentic workflows, RAG systems, API automations, and human-in-the-loop systems.\n\nSee TickerBrief and the Drift Alert Agent in Projects for examples. To discuss a project:\n${CONTACT}`,
      chips: ['Projects', 'Skills', 'How to contact'] },
    { id: 'resume', keys: ['resume', 'cv', 'curriculum vitae', 'portfolio pdf'],
      answer: `A CV is available on request. Email [${EMAIL}](mailto:${EMAIL}) or message him on [LinkedIn](${LINKEDIN}).` },
    { id: 'location', keys: ['where is he', 'where does he live', 'where is kauntey', 'location', 'based', 'city', 'ahmedabad', 'india', 'timezone', 'time zone', 'relocate', 'remote'],
      answer: 'Kauntey is based in Ahmedabad, India (IST, UTC+5:30). For questions about remote work or relocation, it’s best to ask him directly by email or LinkedIn.' },

    /* ---------- About ---------- */
    { id: 'about', keys: ['about', 'who', 'what does he do', 'what does kauntey do', 'background', 'kauntey', 'profile', 'bio', 'introduce', 'yourself', 'summary'],
      answer: 'Kauntey Acharya is an AI Automation Engineer, AI Strategist & Consultant, and Quantitative Analyst. He designs AI-powered workflows, agents, and automation systems that turn repetitive processes into reliable, scalable solutions. At Innodata Inc. he designs and builds AI automations and evaluates large language models. He also builds fully local AI tools (RAG pipelines and research agents) with n8n, Ollama, and ChromaDB. Before that, he was a pre-doctoral research fellow in theoretical physics and published four peer-reviewed papers on naked singularities, energy extraction, and particle collisions in general relativity.',
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
    { id: 'skills', keys: ['skill', 'skills', 'stack', 'tools', 'tech', 'python', 'sql', 'pytorch', 'pandas', 'numpy', 'machine learning', 'ml', 'statistics', 'statistical', 'bayesian', 'time series', 'latex', 'matlab', 'mathematica', 'c++', 'programming', 'languages', 'zapier', 'api', 'apis', 'api integration', 'obsidian', 'git', 'github', 'ci', 'cd', 'ci/cd', 'cicd', 'github actions', 'docker', 'fastapi', 'scikit-learn', 'devops'],
      answer: 'AI & agents: LLMs, agentic workflows, RAG, prompt engineering, LLM evaluation, and human-in-the-loop design.\nAutomation & engineering: n8n, Zapier, API integration, FastAPI, Docker, Git, and CI/CD (GitHub Actions).\nLanguages & data: Python, SQL, NumPy, Pandas, PyTorch, scikit-learn, Postgres, ChromaDB, and Grafana.\nQuant & research: statistics, time-series modelling, Bayesian inference, research writing, LaTeX, MATLAB, and Mathematica.' },

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
      answer: `Projects:\n• TickerBrief: automated equity research reports (n8n, Python, and Ollama)\n• Model Monitoring + Drift Alert Agent (n8n, Evidently AI, Ollama, and Grafana)\n• FocusPulse (Chrome extension)\n• EasyAutoFill (browser extension)\n• ArXiv Research Analysis Agent (n8n, Ollama, and Telegram)\n• Local RAG Document Q&A Agent (n8n, Ollama, and ChromaDB)\n• Banking & Financial Stock Analysis\n• Gravitational-Wave Tests of GR (ppE, Bayesian parameter estimation)\n• Credit Score Data Analysis\n• Indian Startup Investment EDA\n\nAll on [GitHub](${GH}).`,
      chips: ['RAG agent', 'ArXiv agent', 'Stock analysis'] },
    { id: 'proj_ticker', weight: 3, keys: ['tickerbrief', 'ticker brief', 'ticker', 'equity research', 'equity', 'research report', 'stock report', 'sec', 'edgar', 'technical indicators', 'rsi', 'macd'],
      answer: 'TickerBrief: type a ticker and get a full equity research report (interactive web page and PDF). An n8n workflow pulls prices, fundamentals, peers, SEC filings, and news in parallel; Python computes ratios, technicals, and sentiment; and a local LLM (Ollama) writes the narrative in three structured passes, with rule-based fallbacks.\n\n[GitHub](https://github.com/KaunteyAcharya/tickerbrief) · [Demo](https://github.com/KaunteyAcharya/tickerbrief#readme) · [Note](notes.html?post=tickerbrief)' },
    { id: 'proj_drift', weight: 3, keys: ['drift', 'model drift', 'data drift', 'mlops', 'monitoring', 'model monitoring', 'evidently', 'grafana', 'postgres', 'slack', 'alert', 'alerts'],
      answer: 'Model Monitoring + Drift Alert Agent: a local MLOps stack. An n8n workflow scores new traffic, logs predictions to Postgres, and measures data, prediction, and target drift with Evidently AI. When a threshold is crossed, a local LLM (Ollama) explains the likely root cause and posts it to Slack, with a Grafana dashboard for history.\n\n[GitHub](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent) · [Demo](https://github.com/KaunteyAcharya/ML-model-drift-alert-agent#readme) · [Note](notes.html?post=ml-drift-alert-agent)' },
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

  const START_CHIPS = (BOOKING_ON ? ['Book a call'] : []).concat(['Who is Kauntey?', 'Projects', 'Publications', 'How to contact']);
  const FALLBACK = {
    answer: 'I can help with that, but I don’t have enough context here to give you a reliable answer. I’m primarily designed to answer questions about Kauntey’s research, projects, experience, publications, and technical work. If your question connects to any of those, ask away.',
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

  // Show a "typing" bubble for about a second before each answer
  const TYPING_MS = 1000;
  let busy = false;
  function showTyping() {
    const d = document.createElement('div');
    d.className = 'msg bot typing';
    d.setAttribute('aria-label', 'Assistant is typing');
    d.innerHTML = '<span class="typing-label">Typing</span><span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function ask(q) {
    if (busy || booking) return;
    if (isBookingIntent(q)) {
      add(q, 'user');
      if (BOOKING_ON) { startBooking(); return; }
      busy = true;
      const t = showTyping();
      setTimeout(() => { t.remove(); add('Online booking is coming soon. For now, the quickest way to set up a call is:\n' + CONTACT, 'bot'); busy = false; }, TYPING_MS);
      return;
    }
    busy = true;
    add(q, 'user');
    const e = answer(CHIP_ALIASES[q.toLowerCase()] || q);
    const t = showTyping();
    setTimeout(() => {
      t.remove();
      add(e.answer, 'bot');
      addChips(e.chips);
      busy = false;
    }, TYPING_MS);
  }

  /* =========================================================
     Booking mode
     While a booking is in progress the text box is locked; the
     visitor can only use the booking controls or "Cancel booking".
     ========================================================= */
  const BOOK_RE = /\b(book|booking|schedule|scheduling|set up a (call|meeting)|arrange a (call|meeting)|interview|appointment|meeting|slot|availability|available times?|calendar)\b/i;
  function isBookingIntent(q) {
    const t = q.toLowerCase();
    if (/\b(phone|number|whatsapp|mobile)\b/.test(t)) return false;   // phone questions keep their own answer
    return t.trim() === 'book a call' || BOOK_RE.test(t) || /\b(call|chat) with (him|kauntey)\b/.test(t);
  }

  let booking = null;
  const demo = !BOOKING.endpoint;
  // Time zones: slots are exact moments (UTC), so they land on Kauntey's calendar correctly whatever zone
  // the visitor views them in. The visitor's zone is detected, and they can switch it.
  const HOME_TZ = 'Asia/Kolkata';
  const zoneOk = z => { try { new Intl.DateTimeFormat('en', { timeZone: z }); return true; } catch (e) { return false; } };
  const MY_TZ = (() => { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; return z && zoneOk(z) ? z : HOME_TZ; })();
  let tz = MY_TZ;
  const fmtDay = d => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
  const fmtTime = d => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: tz });
  const fmtLong = (d, z) => d.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: z });
  const dayKey = d => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const zoneLabel = z => z === HOME_TZ ? 'IST' : z.replace(/_/g, ' ');
  function allZones() {
    let list = [];
    try { list = Intl.supportedValuesOf('timeZone'); } catch (e) {}
    if (!list.length) list = ['UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'America/Toronto', 'America/Sao_Paulo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
      'Asia/Shanghai', 'Australia/Sydney', 'Africa/Johannesburg', 'Pacific/Auckland'];
    return list;
  }
  function untilText(d) {
    const m = Math.max(0, Math.round((d - Date.now()) / 60000)), dd = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
    const part = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
    return dd ? part(dd, 'day') + (hh ? ', ' + part(hh, 'hour') : '') : hh ? part(hh, 'hour') + (mm ? ', ' + part(mm, 'minute') : '') : part(mm, 'minute');
  }
  const h = (tag, attrs, html) => { const e = document.createElement(tag); Object.assign(e, attrs || {}); if (html != null) e.innerHTML = html; return e; };
  const safe = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Cancel bar shown above the input while booking
  const cancelBar = h('div', { className: 'bk-bar', hidden: true },
    '<span>Booking a call</span><button type="button" class="bk-cancel">Cancel booking</button>');
  form.parentNode.insertBefore(cancelBar, form);
  cancelBar.querySelector('.bk-cancel').addEventListener('click', () => endBooking('cancel'));
  const sendBtn = form.querySelector('button[type="submit"]');
  const defaultPlaceholder = input.placeholder;

  function lock(on) {
    input.disabled = on; if (sendBtn) sendBtn.disabled = on;
    input.placeholder = on ? 'Booking in progress. Cancel to chat again.' : defaultPlaceholder;
    cancelBar.hidden = !on;
  }

  function botTyping(then) {
    const t = showTyping();
    setTimeout(() => { t.remove(); then(); }, TYPING_MS);
  }

  function card(html) {
    // retire the previous step's controls
    log.querySelectorAll('.bk.live').forEach(c => { c.classList.remove('live'); c.querySelectorAll('button, input, select').forEach(x => x.disabled = true); });
    const c = h('div', { className: 'msg bot bk live' }, html);
    log.appendChild(c); log.scrollTop = log.scrollHeight;
    return c;
  }

  function startBooking() {
    // Soft limit: one booking request per browser per day (real limits are enforced by the booking server)
    let last = 0; try { last = Number(localStorage.getItem('ka-book-req') || 0); } catch (e) {}
    if (!demo && Date.now() - last < 86400000) {
      botTyping(() => add('You already requested a call from this browser today. Check your inbox for the confirmation link, or reach Kauntey directly:\n' + CONTACT, 'bot'));
      return;
    }
    booking = { step: 1, minutes: 30, slots: [], day: null, slot: null, name: '', email: '', profile: '', topic: '' };
    lock(true);
    botTyping(() => {
      add('Happy to set that up! A quick heads-up first:\n' +
        '• One booking request per email address every 24 hours, so please enter your email carefully.\n' +
        '• You’ll get a confirmation link by email. Click it within ' + BOOKING.holdMinutes + ' minutes, or the slot is released.\n' +
        '• Please add your LinkedIn profile or website, so Kauntey knows who he’s meeting.\n' +
        '• Temporary email addresses aren’t accepted.\n\nNow pick a time that suits you.' +
        (demo ? '\n(Demo mode: this preview shows sample times and does not book anything yet.)' : ''), 'bot');
      loadSlots();
    });
  }

  function endBooking(reason) {
    if (!booking) return;
    log.querySelectorAll('.bk.live').forEach(c => { c.classList.remove('live'); c.querySelectorAll('button, input, select').forEach(x => x.disabled = true); });
    booking = null;
    lock(false);
    if (reason === 'cancel') {
      add('Booking cancelled. Ask me anything else.', 'bot');
      addChips(['Book a call', 'Projects', 'How to contact']);
    }
    input.focus();
  }

  // ----- Slots -----
  // Preview-only sample times that follow the real rules: Mon to Sat, 4:00 AM to 2:00 AM IST,
  // every 30 minutes, at least 3 hours ahead, up to 15 days out (some slots randomly "taken").
  function demoSlots(minutes) {
    const out = [], IST = 330, now = Date.now(), base = new Date(now + IST * 60000);
    for (let i = -1; i <= 15; i++) {
      const day = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i);
      const dow = new Date(day).getUTCDay();
      if (dow === 0) continue;
      const ws = day + 4 * 3600e3 - IST * 60000, we = day + 26 * 3600e3 - IST * 60000;
      for (let t = ws; t + minutes * 60000 <= we; t += 30 * 60000) {
        if (t < now + 3 * 3600e3 || t > now + 15 * 86400e3) continue;
        if ((t / 1800000 + i) % 5 === 0) continue;
        out.push(new Date(t));
      }
    }
    return out;
  }

  // keepDay: stay on the chosen day after switching between 15 and 30 minutes, if it still has times
  function loadSlots(keepDay) {
    const done = list => {
      if (!booking) return;
      booking.slots = list.map(x => new Date(x)).filter(d => !isNaN(d)).sort((a, b) => a - b);
      if (!booking.slots.length) {
        add('There are no open slots in the next 15 days. Please email Kauntey directly:\n' + CONTACT, 'bot');
        return endBooking();
      }
      if (!(keepDay && booking.slots.some(s => dayKey(s) === booking.day))) booking.day = dayKey(booking.slots[0]);
      renderSlots();
    };
    if (demo) return done(demoSlots(booking.minutes));
    fetch(BOOKING.endpoint + '?action=slots&minutes=' + booking.minutes)
      .then(r => r.json())
      .then(j => done((j && j.slots) || []))
      .catch(() => { add('I couldn’t reach the calendar right now. Please try again later, or email Kauntey:\n' + CONTACT, 'bot'); endBooking(); });
  }

  function renderSlots() {
    const days = [];
    booking.slots.forEach(s => { const k = dayKey(s); if (!days.some(d => d.k === k)) days.push({ k, d: s }); });
    const times = booking.slots.filter(s => dayKey(s) === booking.day);
    const c = card(
      '<div class="bk-tz"><label class="bk-l" for="bkTz">Show times in</label><select class="bk-in" id="bkTz">' +
        '<option value="' + safe(MY_TZ) + '"' + (tz === MY_TZ ? ' selected' : '') + '>Your time (' + safe(zoneLabel(MY_TZ)) + ')</option>' +
        (MY_TZ !== HOME_TZ ? '<option value="' + HOME_TZ + '"' + (tz === HOME_TZ ? ' selected' : '') + '>Kauntey’s time (IST)</option>' : '') +
        '<optgroup label="Other time zones">' + allZones().filter(z => z !== MY_TZ && z !== HOME_TZ)
          .map(z => '<option value="' + safe(z) + '"' + (tz === z ? ' selected' : '') + '>' + safe(z.replace(/_/g, ' ')) + '</option>').join('') + '</optgroup>' +
      '</select></div>' +
      '<div class="bk-row" role="group" aria-label="Day">' + days.map(d => '<button type="button" class="bk-chip" data-day="' + d.k + '" aria-pressed="' + (d.k === booking.day) + '">' + fmtDay(d.d) + '</button>').join('') + '</div>' +
      '<div class="bk-grid" role="group" aria-label="Time">' + times.map(t => '<button type="button" class="bk-chip" data-t="' + t.getTime() + '" aria-pressed="' + (booking.slot && booking.slot.getTime() === t.getTime()) + '">' + fmtTime(t) + '</button>').join('') + '</div>' +
      '<div class="bk-row" role="group" aria-label="Length">' + BOOKING.lengths.map(m => '<button type="button" class="bk-chip" data-m="' + m + '" aria-pressed="' + (booking.minutes === m) + '">' + m + ' min</button>').join('') + '</div>' +
      '<div class="bk-actions"><button type="button" class="bk-primary" data-next ' + (booking.slot ? '' : 'disabled') + '>Continue</button></div>');
    c.querySelector('#bkTz').onchange = e => {
      if (!zoneOk(e.target.value)) return;
      tz = e.target.value;
      // keep the same chosen moment; re-group the days in the new zone
      booking.day = dayKey(booking.slot || booking.slots[0]);
      c.remove(); renderSlots();
    };
    c.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { booking.day = b.dataset.day; booking.slot = null; c.remove(); renderSlots(); });
    c.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { booking.slot = new Date(+b.dataset.t); c.remove(); renderSlots(); });
    c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      if (booking.minutes === +b.dataset.m) return;
      booking.minutes = +b.dataset.m; booking.slot = null; c.remove(); loadSlots(true);   // 30-minute calls fit fewer gaps
    });
    c.querySelector('[data-next]').onclick = () => botTyping(renderCheck);
  }

  // ----- "Is this right?" check before the form -----
  function renderCheck() {
    if (!booking || !booking.slot) return;
    const s = booking.slot;
    const c = card(
      '<p class="bk-q">Just checking, is this the time you want?</p>' +
      '<p class="bk-when"><b>' + safe(fmtLong(s, tz)) + '</b><br><small>' + (tz === MY_TZ ? 'your time' : 'time in') + ' · ' + safe(zoneLabel(tz)) + '</small></p>' +
      (tz !== HOME_TZ ? '<p class="bk-q bk-sub">For Kauntey that’s ' + safe(fmtLong(s, HOME_TZ)) + ' IST.</p>' : '') +
      '<p class="bk-q bk-sub">' + booking.minutes + ' minutes · starts in ' + untilText(s) + '</p>' +
      '<div class="bk-actions"><button type="button" class="bk-ghost" data-back>Pick another time</button><button type="button" class="bk-primary" data-yes>Yes, continue</button></div>');
    c.querySelector('[data-back]').onclick = () => { c.remove(); renderSlots(); };
    c.querySelector('[data-yes]').onclick = () => {
      add(fmtDay(s) + ', ' + fmtTime(s) + ' (' + zoneLabel(tz) + ') · ' + booking.minutes + ' min', 'user');
      botTyping(renderDetails);
    };
  }

  // ----- Details -----
  let tsLoaded = false;
  function renderDetails() {
    if (!booking) return;
    const c = card(
      '<p class="bk-q">Great. Where should the invite go?</p>' +
      '<label class="bk-l" for="bkName">Your name</label><input class="bk-in" id="bkName" autocomplete="name" maxlength="80" value="' + safe(booking.name) + '">' +
      '<label class="bk-l" for="bkEmail">Work email</label><input class="bk-in" id="bkEmail" type="email" autocomplete="email" maxlength="120" value="' + safe(booking.email) + '">' +
      '<label class="bk-l" for="bkProfile">LinkedIn profile or website</label><input class="bk-in" id="bkProfile" type="url" inputmode="url" autocomplete="url" maxlength="200" placeholder="linkedin.com/in/your-name" value="' + safe(booking.profile) + '">' +
      '<label class="bk-l" for="bkTopic">Company and topic (optional)</label><input class="bk-in" id="bkTopic" maxlength="200" value="' + safe(booking.topic) + '">' +
      '<input class="bk-hp" id="bkWebsite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      (BOOKING.turnstileSiteKey ? '<div class="bk-ts" id="bkTs"></div><p class="bk-note">Protected by Cloudflare · <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy</a></p>' : '') +
      '<p class="bk-err" role="alert"></p>' +
      '<div class="bk-actions"><button type="button" class="bk-ghost" data-back>Back</button><button type="button" class="bk-primary" data-send>Send confirmation</button></div>');
    if (BOOKING.turnstileSiteKey) mountTurnstile(c.querySelector('#bkTs'));
    c.querySelector('[data-back]').onclick = () => { c.remove(); renderSlots(); };
    c.querySelector('[data-send]').onclick = () => submit(c);
    c.querySelector('#bkName').focus();
  }

  // Cloudflare's human check. Each form gets a fresh widget (tokens are single-use).
  let tsTarget = null, tsWidget = null;
  function mountTurnstile(el) {
    tsTarget = el;
    const render = () => {
      if (!window.turnstile || !tsTarget || !document.body.contains(tsTarget)) return;
      if (tsWidget !== null) { try { window.turnstile.remove(tsWidget); } catch (e) {} }
      // 'interaction-only': the check runs in the background and the box only appears if Cloudflare needs a click
      tsWidget = window.turnstile.render(tsTarget, { sitekey: BOOKING.turnstileSiteKey, size: 'flexible', appearance: 'interaction-only' });
    };
    if (window.turnstile) return render();
    if (tsLoaded) return;   // script still loading; it renders into the latest form when ready
    tsLoaded = true;
    const s = h('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', async: true, defer: true });
    s.onload = render; document.head.appendChild(s);
  }

  function submit(c) {
    const err = c.querySelector('.bk-err');
    booking.name = c.querySelector('#bkName').value.trim();
    booking.email = c.querySelector('#bkEmail').value.trim();
    booking.topic = c.querySelector('#bkTopic').value.trim();
    booking.profile = c.querySelector('#bkProfile').value.trim();
    if (c.querySelector('#bkWebsite').value) return;                       // honeypot: bots fill hidden fields
    if (!booking.name) { err.textContent = 'Please enter your name.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(booking.email)) { err.textContent = 'Please enter a valid email so the invite can reach you.'; return; }
    if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(booking.profile)) { err.textContent = 'Please add your LinkedIn profile or website link, so Kauntey knows who he is meeting.'; return; }
    if (/(^|\/\/|\.)linkedin\.com\/?$/i.test(booking.profile)) { err.textContent = 'Please use the link to your own LinkedIn profile (linkedin.com/in/…).'; return; }
    if (BOOKING.turnstileSiteKey) {
      // The background check usually finishes in a second or two; wait for it briefly instead of erroring
      const getTok = () => (window.turnstile && tsWidget !== null ? window.turnstile.getResponse(tsWidget) : '') || '';
      if (!getTok()) {
        if (c.dataset.waiting) return;
        c.dataset.waiting = '1'; err.textContent = 'One moment, finishing a quick security check…';
        const t0 = Date.now(), iv = setInterval(() => {
          if (getTok()) { clearInterval(iv); delete c.dataset.waiting; err.textContent = ''; submit(c); }
          else if (Date.now() - t0 > 8000) { clearInterval(iv); delete c.dataset.waiting; err.textContent = 'Please complete the quick human check above, then send again.'; }
        }, 250);
        return;
      }
    }
    const token = BOOKING.turnstileSiteKey && window.turnstile && tsWidget !== null ? window.turnstile.getResponse(tsWidget) : '';
    err.textContent = '';
    c.querySelectorAll('button').forEach(b => b.disabled = true);
    add(booking.name + ' · ' + booking.email, 'user');

    const payload = { action: 'request', start: booking.slot.toISOString(), minutes: booking.minutes,
      name: booking.name, email: booking.email, profile: booking.profile, topic: booking.topic, tz, token };
    const send = demo
      ? Promise.resolve({ ok: true })
      : fetch(BOOKING.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).then(r => r.json());

    const t = showTyping();
    Promise.all([send, new Promise(r => setTimeout(r, TYPING_MS))])
      .then(([res]) => {
        t.remove();
        if (!booking) return;
        if (!res || !res.ok) {
          const msg = (res && res.message) || 'That slot was just taken or something went wrong. Please pick another time.';
          // Limit reached (this email already asked today, or already has a call): stop here, no more time pickers
          if ((res && (res.code === 'limit' || res.code === 'blocked')) || /already (requested|have a call)|too many|lots of requests|isn.t available for this email/i.test(msg)) {
            try { localStorage.setItem('ka-book-req', String(Date.now())); } catch (e) {}
            add(msg + '\n\nYou can still reach Kauntey directly:\n' + CONTACT, 'bot');
            return endBooking();
          }
          // Fake or unusable email: say clearly that the booking stopped, then let them switch to a real address
          if (/temporary inbox|disposable|can.t receive email/i.test(msg)) {
            const why = /can.t receive email/i.test(msg)
              ? 'the domain of ' + booking.email + ' can’t receive email, so the invite would never arrive. Please check it for typos.'
              : booking.email + ' looks like a temporary (fake) email address, and calls can only be booked with a real one.';
            add('Booking not completed: ' + why + '\n\nIf you’d like to book, enter your real work or personal email below.', 'bot');
            if (!/can.t receive email/i.test(msg)) booking.email = '';   // keep it for typo fixes
            return renderDetails();
          }
          // Something in the form needs fixing: go back to the form, keep what they typed
          if ((res && res.code === 'input') || /email|linkedin|website|name|human check/i.test(msg)) {
            add(msg, 'bot');
            return renderDetails();
          }
          add(msg, 'bot');
          booking.slot = null; booking.slots = []; return loadSlots();
        }
        if (!demo) { try { localStorage.setItem('ka-book-req', String(Date.now())); } catch (e) {} }
        renderCheckInbox();
      })
      .catch(() => { t.remove(); add('I couldn’t reach the booking service. Please try again later, or email Kauntey:\n' + CONTACT, 'bot'); endBooking(); });
  }

  // ----- Confirmation -----
  function renderCheckInbox() {
    const when = fmtDay(booking.slot) + ' at ' + fmtTime(booking.slot);
    const c = card(
      '<p class="bk-q"><b>Almost done.</b> I sent a confirmation link to <b>' + safe(booking.email) + '</b>. ' +
      'Click it within ' + BOOKING.holdMinutes + ' minutes to confirm your ' + booking.minutes + '-minute call on ' + when + '. ' +
      'Until then the slot is held for you.</p>' +
      '<p class="bk-q">Not in your inbox after a minute? Please check your Spam or Promotions folder, and mark it “Not spam” so the calendar invite reaches you too.</p>' +
      (demo ? '<div class="bk-mail"><small>Demo: this is what arrives in their inbox</small>Confirm your call with Kauntey on ' + when + '.<br><button type="button" class="bk-link" data-confirm>Confirm booking</button></div>'
            : '<div class="bk-actions"><button type="button" class="bk-primary" data-done>Done</button></div>'));
    const fin = c.querySelector('[data-confirm]');
    if (fin) fin.onclick = () => { add('Clicked the confirmation link', 'user'); botTyping(renderBooked); };
    const done = c.querySelector('[data-done]');
    if (done) done.onclick = () => {
      endBooking();
      add('Once you confirm, a calendar invite with a Meet link will arrive by email. Anything else I can help with?', 'bot');
      addChips(['Projects', 'Publications', 'Skills']);
    };
  }

  function renderBooked() {
    if (!booking) return;
    card('<p class="bk-q bk-ok"><b>You’re booked.</b></p><p class="bk-q">' + fmtDay(booking.slot) + ', ' + fmtTime(booking.slot) +
      ' (' + safe(zoneLabel(tz)) + ') · ' + booking.minutes + ' min with Kauntey Acharya. A calendar invite with a Meet link is on its way to ' +
      safe(booking.email) + ', and Kauntey has been notified.' + (demo ? '<br><small>(Demo: nothing was actually booked.)</small>' : '') + '</p>');
    endBooking();
    add('Anything else you’d like to know about Kauntey?', 'bot');
    addChips(['Projects', 'Publications', 'Skills']);
  }

  let greeted = false;
  function open() {
    chat.classList.add('open');
    chat.setAttribute('aria-hidden', 'false');
    toggle.hidden = true;
    toggle.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      add('Hi, I’m Kauntey’s portfolio assistant. Ask me about his work, projects, papers, or notes' + (BOOKING_ON ? ', or book a call with him.' : '.'), 'bot');
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

  /* ---------- Resizable panel (desktop): drag the top-left corner; double-click it to reset ---------- */
  const grip = document.createElement('div');
  grip.className = 'chat-resize'; grip.title = 'Drag to resize, double-click to reset';
  grip.setAttribute('aria-hidden', 'true');
  chat.appendChild(grip);
  const SIZE_KEY = 'ka-chat-size';
  const fit = (w, h) => [Math.max(300, Math.min(innerWidth - 40, w)), Math.max(360, Math.min(innerHeight - 40, h))];
  function applySize(w, h) { [w, h] = fit(w, h); chat.style.width = w + 'px'; chat.style.height = h + 'px'; }
  try { const z = JSON.parse(localStorage.getItem(SIZE_KEY) || 'null'); if (z && innerWidth > 480) applySize(z.w, z.h); } catch (e) {}
  grip.addEventListener('pointerdown', e => {
    e.preventDefault();
    const r = chat.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
    chat.classList.add('resizing');
    grip.setPointerCapture(e.pointerId);
    const move = ev => applySize(r.width + (sx - ev.clientX), r.height + (sy - ev.clientY));
    const stop = () => {
      chat.classList.remove('resizing');
      grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', stop);
      try { const b = chat.getBoundingClientRect(); localStorage.setItem(SIZE_KEY, JSON.stringify({ w: b.width, h: b.height })); } catch (err) {}
    };
    grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', stop);
  });
  grip.addEventListener('dblclick', () => { chat.style.width = ''; chat.style.height = ''; try { localStorage.removeItem(SIZE_KEY); } catch (e) {} });

  // "Book a call" links on the page (e.g. next to Email): open the assistant straight into the booking flow
  document.querySelectorAll('[data-book-call]').forEach(a => {
    if (!BOOKING_ON) return;            // stays hidden until booking is switched on
    a.hidden = false;
    a.addEventListener('click', e => {
      e.preventDefault();
      open();
      if (!booking) ask('Book a call');
    });
  });

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
  window.kaAsk = q => isBookingIntent(q) ? 'booking' : (answer(q).id || 'fallback');
})();
