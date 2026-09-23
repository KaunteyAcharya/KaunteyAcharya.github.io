Every morning I used to do the same thing: open arXiv, scroll through the new submissions in my categories, skim abstracts to guess which papers mattered, download a few PDFs, and then paste them into an LLM to walk me through the derivations. It was useful, but it quietly ate a big chunk of my morning. So I automated it.

The result is the [ArXiv Research Analysis Agent](https://github.com/KaunteyAcharya/n8n-arxiv-research-automation). This repo's readme file also includes a 2 minute video demonstration of this workflow.

## What it does

1. Each morning it checks arXiv's new-submissions listing for the categories I care about (General Relativity and Quantum Cosmology, and Quantitative Finance by default).
2. It filters the new papers against my keyword list.
3. For every match, I get a Telegram message with the title, the abstract, and a yes/no prompt.
4. If I reply `yes <arxiv_id>`, it downloads the full PDF, extracts the text, and asks a local LLM to explain the paper's derivation and methodology from first principles. The analysis comes back to me on Telegram as a Markdown report.
5. If I reply `no`, it marks the paper as skipped and moves on.

The yes/no step is the part I like most. I stay in control of what gets a deep read, without doing any of the busywork.

## Under the hood

- **n8n** (self-hosted) orchestrates two branches: a daily schedule that queries and filters arXiv, and a one-minute poller that reads my Telegram replies.
- **Ollama** runs the model locally (`qwen3:4b`), so paper content never goes to a third-party API.
- **ChromaDB** is used purely as a small key-value store for paper status (pending, in progress, or declined) and the Telegram polling offset, which turned out more reliable than n8n's built-in static data across separate triggers.
- The **Telegram Bot API** handles both the daily briefs and my replies.
- arXiv's public listing pages need no API key.

It now runs every morning, and I spend that time actually reading the papers that matter.
