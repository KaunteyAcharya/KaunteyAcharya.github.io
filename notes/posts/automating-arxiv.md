---
title: Automating my morning arXiv routine with n8n, Telegram, and an LLM
date: 2026-06-02
updated: 2026-10-30
tags: [AI, projects]
summary: Checking arXiv every day and feeding papers to an LLM ate my mornings, so I built an n8n agent to do it. How it works, the bugs that made it silently return nothing, and how it went from a small local model to full-paper derivations.
related: [tickerbrief, local-rag-agent, ml-drift-alert-agent]
---

Every morning I used to do the same thing: open arXiv, scroll through the new submissions in my categories, skim abstracts to guess which papers mattered, download a few PDFs, and then paste them into an LLM to walk me through the derivations. It was useful, but it quietly ate a big chunk of my morning. So I automated it.

The result is the [ArXiv Research Analysis Agent](https://github.com/KaunteyAcharya/n8n-arxiv-research-automation). In one line: each morning it reads arXiv's new-submissions pages, keeps the papers that match my keywords, and sends each one to me on Telegram; if I reply yes, an LLM reads the full paper and sends back a detailed, step-by-step walkthrough of its derivation.

## What it does

1. Each morning at 08:30 IST it checks arXiv's new-submissions listing for the categories I care about (General Relativity and Quantum Cosmology, and Quantitative Finance by default).
2. It filters the new papers against my keyword list.
3. For every match, I get a Telegram message with the title, the abstract, and a yes/no prompt.
4. If I reply `yes <arxiv_id>`, it downloads the full PDF, extracts the text, and asks an LLM to explain the paper's derivation and methodology from first principles. The analysis comes back to me on Telegram as a Markdown report.
5. If I reply `no`, it marks the paper as skipped and moves on.

The yes/no step is the part I like most. I stay in control of what gets a deep read, without doing any of the busywork.

## What I watch for

The keyword lists are short on purpose. For gr-qc, a paper passes if its title or abstract mentions **energy extraction** or **naked singularities**, the two topics of my own physics research (I wrote about them in [my first paper](notes/first-paper-penrose/) and [the JMN-1 magnetic field paper](notes/jmn-magnetic-field/)). For quantitative finance, it watches four sub-categories (portfolio management, mathematical finance, risk management, and statistical finance) for **portfolio optimization**.

A short, specific list keeps the Telegram messages rare and relevant, instead of a daily wall of abstracts.

## Architecture

```
Daily, 08:30 IST (one branch per category)
  Read arXiv "new" listing page -> parse + keyword gate
    -> store as "pending" -> Telegram brief with yes/no

Every minute
  Read new Telegram replies -> match "yes/no <id>" to a pending paper
    yes -> download PDF -> extract text -> build prompt
        -> LLM (Gemini API or local Ollama) -> Markdown report -> Telegram
    no  -> mark as declined
```

- **n8n** (self-hosted) orchestrates two branches: a daily schedule that reads and filters arXiv, and a one-minute poller that reads my Telegram replies.
- **The LLM** is my choice per setup: the **Gemini API** (a free API key) by default, or a model running locally through **Ollama** when I want paper content to stay on my machine.
- **ChromaDB** is used purely as a small key-value store for paper status (pending, in progress, or declined) and the Telegram polling offset, which turned out more reliable than n8n's built-in static data across separate triggers.
- The **Telegram Bot API** handles both the daily briefs and my replies.
- arXiv's public listing pages need no API key.

## The bugs that made it silently do nothing

The first versions ran without errors and sent me nothing. Two separate problems caused it.

**The arXiv API index was days behind.** The first version queried arXiv's search API by submission date. That index lags the public "new" listing page by several days: on the day I checked, a matching paper (*Naked Singularities beyond Spherical Symmetry*) was on the listing page but not in the API results, which only went up to papers about three days old. No date window on my side could fix a stale index. The fix was to parse the exact page a human checks, `arxiv.org/list/gr-qc/new`, which is always correct for today. The parser also reads only the "New submissions" section, so an old paper that was revised or cross-listed today does not count as new.

**Exact keyword matching missed plurals.** That same paper said "naked singularities", and the filter was looking for the exact phrase "naked singularity". The keyword gate now uses patterns that accept plural and hyphenated forms ("naked-singularity", "singularities") and British spellings ("optimisation").

Both bugs had the same shape: nothing crashed, the output was just empty. For automations that watch for rare events, "no results" needs to be tested against a day where you know there should be one.

## From a small local model to full-paper derivations

The first version ran everything locally, on `qwen3:4b` through Ollama, on a laptop with 8 GB of RAM. The goal from the start was a detailed derivation of the whole paper. Sending a full 51-page paper (tens of thousands of characters) and asking for a complete derivation across eight sections took many minutes per paper on that hardware, mostly on the CPU.

So the first version made compromises to stay usable: it read only the opening part of each paper, asked the model to walk through the paper's own steps rather than rederive them, and capped the report at a few hundred words. That made it fast, but it was a summary of the setup, not the detailed derivation I actually wanted.

The fix was a bigger model rather than a smaller task. Today the analysis step can run on either of two back ends:

- **Gemini API** with a free API key, which takes the full paper text and writes the detailed derivation in a reasonable time, without needing a powerful machine.
- **A local model through Ollama**, for when I would rather keep a paper on my own machine.

The prompt lessons from the first version apply to any model: explain the derivation in the paper's own logical order, fill in only the short intermediate steps the paper skips, use clean LaTeX for equations, and say plainly if something is unclear instead of inventing it.

## What it does not do

- Keyword matching looks at titles and abstracts, so a relevant paper that uses different words will be missed.
- It relies on arXiv's listing page layout. If arXiv changes its HTML, the parser needs updating.

It now runs every morning, and I spend that time actually reading the papers that matter. The workflow file and setup steps for the first, fully local version are in the [GitHub repository](https://github.com/KaunteyAcharya/n8n-arxiv-research-automation).
