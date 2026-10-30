---
title: Building TickerBrief, an equity research agent with n8n, Python, and a local LLM
date: 2026-10-01
updated: 2026-10-30
tags: [AI, projects]
summary: Type a ticker, get a full equity research report with charts, filings, news sentiment, and an LLM-written narrative. How the data, the scorecard, and the three LLM passes work, and why the LLM never touches a number.
related: [automating-arxiv, ml-drift-alert-agent, ai-stack-advisor]
---

Researching a single stock properly means opening a lot of tabs: price charts, financial statements, peer comparisons, SEC filings, and the latest news. I wanted to see how much of that I could automate, so I built [TickerBrief](https://github.com/KaunteyAcharya/tickerbrief). You type a ticker, and a few minutes later you get a full research report as an interactive web page and a PDF. There is a video demo in the [README](https://github.com/KaunteyAcharya/tickerbrief#readme).

In short: n8n pulls prices, fundamentals, peers, filings, and news in parallel; a Python service turns them into ratios, indicators, a sentiment score, and a six-part scorecard; and a local LLM writes the narrative around those numbers in three structured passes. Everything runs on one machine, with free tools and data sources that need no API key.

## The workflow

![The TickerBrief workflow in n8n, in five stages: request, parallel data pulls, Python analysis, LLM drafting, and publishing](notes/images/tickerbrief-workflow.png)

The whole pipeline is one n8n workflow, built in five stages:

1. **Request.** A webhook or a simple form takes the ticker (and optional peers) and checks that it is valid.
2. **Parallel data pulls.** Prices, fundamentals, and peers come from yfinance; recent filings come from SEC EDGAR; and headlines come from Google News and Yahoo Finance RSS. Every branch keeps going if its source fails, so one broken feed never blocks the report.
3. **Analysis in Python.** A small FastAPI service computes ratios, peer comparisons, technical indicators (RSI, MACD, moving averages, and Bollinger bands), drawdown, volatility, news sentiment, and a simple scorecard.
4. **LLM drafting.** A local model writes the narrative in three passes: fundamentals, then technicals and news, then a lead-analyst summary. Each pass returns structured JSON.
5. **Publish.** The report is saved as JSON and a PDF, and the report site opens it.

## What is in a report

The report site has seven tabs, and the PDF has the same sections:

- **Overview:** a headline, an executive summary, the bull and bear case, the scorecard, key stats, the 52-week range, analyst targets, and returns.
- **Price and technicals:** a zoomable candlestick chart with 20, 50, and 200-day moving averages, Bollinger bands, and volume, plus linked RSI and MACD panels, a signal checklist, and key levels.
- **Fundamentals:** annual revenue, net income, and free cash flow; margin trends; quarterly results; and valuation, profitability, and balance-sheet tables.
- **Peers:** a switchable metric comparison, one-year performance against the benchmark, and how far the stock trades above or below the peer median.
- **News:** sentiment by day, and scored headlines you can filter by tone.
- **Filings:** a timeline of 10-K, 10-Q, and 8-K filings with links to EDGAR.
- **Method:** where each piece of data came from, which parts the LLM wrote, and any data warnings.

## Where the data comes from

All three sources are free and need no API key:

- **yfinance** for two years of daily prices (the charts show the last trading year, about 252 days), financial statements, analyst targets, and industry peers.
- **SEC EDGAR** for filings. The workflow maps the ticker to the SEC's company ID (CIK) and pulls the recent filings. EDGAR rejects anonymous requests, so it needs a contact email in the request header, which lives in a local settings file.
- **RSS feeds** from Google News and Yahoo Finance for headlines.

It also handles Indian listings such as `RELIANCE.NS` or `INFY.NS`: the benchmark switches automatically from the S&P 500 ETF (SPY) to the NIFTY 50, and a curated peer set is used. SEC filings exist only for US-registered companies, so that tab says so for other listings.

## The scorecard

The overview scores the stock from 0 to 100 on six dimensions. It is a transparent heuristic, not a model: each score is an average of a few metrics, each mapped linearly between a "bad" and a "good" value.

| Dimension | What it uses |
|---|---|
| Valuation | Forward P/E and EV/EBITDA compared with the peer median, PEG ratio, and free cash flow yield |
| Quality | Operating, gross, and net margins, and return on equity |
| Growth | Revenue growth, earnings growth, and forward EPS growth |
| Momentum | The technical signal score plus 6-month and 1-year returns |
| Financial health | Debt to equity, current ratio, and whether free cash flow and net cash are positive |
| News sentiment | The average tone of recent headlines |

Valuation is scored against peers on purpose. A forward P/E of 30 says little on its own; it is cheap for some industries and expensive for others. The technical score works the same way: each signal (trend, RSI, MACD, and so on) counts as bullish (1), neutral (0.5), or bearish (0), and the average sets a bias of bullish at 60 or above and bearish at 40 or below.

Next to the scorecard, the report lists up to six **positives** and six **risks**, generated by fixed rules, for example: debt to equity above 1.5, negative free cash flow, an RSI of 70 or more (overbought), trading below the 200-day moving average, a drawdown worse than 30% in the past year, or a forward P/E more than 25% above the peer median.

## News sentiment, tuned for finance

General sentiment dictionaries are written for everyday language, not market headlines. In a headline, "beat" is good news, "downgrade" is bad news, and "fined" is a penalty, not "okay". So TickerBrief uses VADER, a fast rule-based sentiment analyser, with a small finance vocabulary added on top: "beat" and "upgrade" score +2.0, "surge" +2.2, "miss" and "downgrade" −2.0, "plunge" −2.6, "fined" −1.6, and "fraud" and "bankruptcy" −3.0.

Headlines from both feeds are merged, duplicates are removed, anything older than 45 days is dropped, and up to 30 are scored. The News tab shows each headline with its score, so you can see why the average came out the way it did.

## How the LLM writes without inventing numbers

The design choice I care most about: **the LLM never calculates anything.** Every number it sees has already been computed in Python, and it only writes the words around them. Small local models can still misread numbers, so they are given as little room to make mistakes as possible:

- **A compact brief, not raw data.** Python writes a plain-text brief for each pass: the company, valuation multiples, margins, growth, the balance sheet, analyst consensus, the annual figures, a peer table, recent filings, technical signals, and scored headlines.
- **Strict instructions.** The system prompt says to use only the facts in the brief, never invent figures, dates, products, events, or price targets, quote numbers where they support a point, and give no buy, sell, or hold advice.
- **A JSON schema for every pass.** The fundamentals pass must return a business overview, financial performance, valuation, peer positioning, and filings highlights. The technicals and news pass returns trend and momentum, key levels, news sentiment, and lists of risks and catalysts. The lead-analyst pass reads both drafts and returns a headline of at most 12 words, an executive summary, a bull and a bear case where each point cites a number, a stance (Constructive, Neutral, or Cautious, described as a research tone rather than trading advice), a confidence level based on how complete the data is and how much the signals agree, and things to watch.
- **Fallbacks for every field.** If the model is unavailable or returns broken JSON, the parser still tries to recover it (stripping thinking tags and code fences, then pulling out the JSON object). Anything still missing falls back to rule-based text built from the same numbers, so a report is always complete.

The **Method** tab then shows exactly which fields came from the model and which came from rules. Being open about where each sentence came from felt as important as the analysis itself.

## Built to be shared safely

Because the project is public on GitHub, it is set up so that nothing private can leak:

- Every service listens on localhost only, so n8n, the analytics API, and the site cannot be reached from the network.
- Secrets live only in a local `.env` file and n8n's encrypted volume, both kept out of git. The workflow itself uses no credentials.
- A script cleans n8n workflow exports (credential references, pinned data, instance IDs) and refuses to write a file that still looks like it holds a secret.
- gitleaks scans for secrets before every commit and in CI.
- The report site inserts all text safely, only follows web links, and is served with a strict Content Security Policy; the charting library is stored with the site instead of loaded from a CDN.
- The analytics container runs as an unprivileged user, and the Python pipeline has its own test suite.

## Tech stack

- **n8n** (self-hosted in Docker) for orchestration
- **yfinance**, **SEC EDGAR**, and **RSS** feeds as key-less data sources
- **Python**, **FastAPI**, and **pandas** for the analytics (indicators written in plain pandas), with **VADER** plus a finance vocabulary for sentiment
- **Ollama** (`qwen3:4b` by default) for the three LLM passes
- **WeasyPrint** and **matplotlib** for the PDF, and **Apache ECharts** for the interactive charts
- **nginx** to serve the report site, all started with one `docker compose up`

## Other ways to run it

- **A different local model.** Any Ollama chat model works. `llama3.2:1b` is faster, with weaker writing.
- **A hosted model.** The three LLM steps are plain HTTP calls, so they can point at Groq's OpenAI-compatible API instead, with the key kept in n8n's encrypted credential store. Every number is still computed locally, so a faster, larger model mainly improves the writing.

## Limitations

- yfinance is an unofficial Yahoo Finance scraper. It is fine for personal and educational use, but fields sometimes go missing or change.
- The scorecard is a transparent heuristic, not a predictive model.
- Small local LLMs can still misread numbers, even though every figure they see is computed upstream, which is why the Method tab exists.

*This is a learning project, not investment advice.*
