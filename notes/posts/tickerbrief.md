---
title: Building TickerBrief, an equity research agent
date: 2026-10-01
tags: [AI, automation, finance, projects]
summary: Type a ticker, get a full equity research report with charts, filings, news sentiment, and an LLM-written narrative. All local and free.
---

Researching a single stock properly means opening a lot of tabs: price charts, financial statements, peer comparisons, SEC filings, and the latest news. I wanted to see how much of that I could automate, so I built [TickerBrief](https://github.com/KaunteyAcharya/tickerbrief). You type a ticker, and a few minutes later you get a full research report as an interactive web page and a PDF. There is a video demo in the [README](https://github.com/KaunteyAcharya/tickerbrief#readme).

## The workflow

![The TickerBrief workflow in n8n, in five stages: request, parallel data pulls, Python analysis, LLM drafting, and publishing](notes/images/tickerbrief-workflow.png)

The whole pipeline is one n8n workflow, built in five stages:

1. **Request.** A webhook or a simple form takes the ticker (and optional peers) and checks that it is valid.
2. **Parallel data pulls.** Prices, fundamentals, and peers come from yfinance; recent filings come from SEC EDGAR; and headlines come from Google News and Yahoo Finance RSS. Every branch keeps going if its source fails, so one broken feed never blocks the report.
3. **Analysis in Python.** A small FastAPI service computes ratios, peer comparisons, technical indicators (RSI, MACD, moving averages, and Bollinger bands), drawdown, volatility, news sentiment, and a simple scorecard.
4. **LLM drafting.** A local model writes the narrative in three passes: fundamentals, then technicals and news, then a lead-analyst summary. Each pass returns structured JSON.
5. **Publish.** The report is saved as JSON and a PDF, and the report site opens it.

## The design choice I care most about

The LLM never calculates anything. Every number it sees has already been computed in Python, and it only writes the words around them. If the model is unavailable or returns broken JSON, that section falls back to rule-based text, and a **Method** tab shows exactly which parts came from the model and which came from rules. Small local models can still misread numbers, so being open about where each sentence came from felt important.

## Tech stack

- **n8n** (self-hosted in Docker) for orchestration
- **yfinance**, **SEC EDGAR**, and **RSS** feeds as key-less data sources
- **Python**, **FastAPI**, and **pandas** for the analytics, with **VADER** plus a finance vocabulary for sentiment
- **Ollama** (`qwen3:4b` by default) for the three LLM passes
- **WeasyPrint** and **matplotlib** for the PDF, and **Apache ECharts** for the interactive charts

It runs entirely on my machine with free tools. It also works for Indian listings like `RELIANCE.NS`, with NIFTY 50 as the benchmark.

*This is a learning project, not investment advice.*
