---
title: Building AI Stack Advisor, a build-vs-buy calculator for AI
date: 2026-10-21
tags: [AI, consulting, projects]
summary: Should a business buy a SaaS tool, build on APIs, or run its own model? A free browser tool that answers with costs, TCO, break-even, and ROI.
---

Almost every business that wants an AI chatbot, voice agent, or document assistant runs into the same question: should we buy it or build it? Subscribe to a SaaS tool, build on hosted LLM APIs, run an open model on our own GPUs, or mix the two? The honest answer is "it depends", but it depends on things you can actually put numbers on: volume, data sensitivity, team skills, and what each conversation is worth.

So I built [AI Stack Advisor](https://github.com/KaunteyAcharya/ai-stack-advisor). You describe what you want AI to do, and it compares the four options on monthly cost, 36-month total cost of ownership (TCO), break-even volume, and ROI, then writes a consultant-style recommendation with every assumption listed. You can [try it live](https://kaunteyacharya.github.io/ai-stack-advisor/).

## How it works

1. **Start from goals.** Pick what you want AI to do, like answering customers, processing invoices, or finding answers in company data. Each goal becomes a workload, and you can pick several.
2. **Volume.** Users per day, requests per user, or documents and pages, growing month by month.
3. **Cost of each option.** API cost comes from tokens times published prices, plus hosting, databases, and maintenance. Self-hosting picks a model size, the cheapest GPU with enough memory, and enough GPUs for peak traffic. SaaS uses the cheapest plan whose limits fit.
4. **Value.** What a conversation is worth in sales, or how many staff hours an internal tool saves.
5. **Recommendation.** A weighted score of cost and non-cost factors (privacy, time to launch, team fit, quality, lock-in, and scalability), plus a check on whether the answer is robust or a close call.

Every formula is written out in the [methodology](https://github.com/KaunteyAcharya/ai-stack-advisor/blob/main/docs/METHODOLOGY.md).

## The parts I care most about

**Showing the workings.** A recommendation is only useful if you can see why. Click any monthly cost and it breaks down into quantity × rate. Every number has a source, a last-checked date, and a confidence level, and the high-impact guesses are flagged as "check these first".

**Being honest about uncertainty.** You can mark inputs you are unsure about, and the tool shows results as ranges. It also runs 300 simulations that vary prices, GPU throughput, labour costs, and model quality, then reports how often each option wins. A tornado chart shows which assumptions move the answer most. This is the same instinct as in my physics and quant work: a single number without error bars can mislead.

**Real-world details.** Taxes (VAT, GST, and US sales tax, counted only when a business can't reclaim them), data-protection rules that rule out options when data must stay in-house, labour costs from official statistics, and eight currencies, including lakh and crore formatting for India.

## Tech stack

- Plain **HTML**, **CSS**, and **JavaScript** modules, with no framework and no build step
- A pure-function **engine** that runs the same in the browser and in Node tests
- **Chart.js** for the charts
- **GitHub Actions** that refresh exchange rates from the European Central Bank and flag prices older than 30 days

Everything runs in your browser. There is no backend, no API key, no LLM call, and no tracking.

*The numbers are estimates for planning, not quotes. Vendor prices change often, so test with your own data before deciding.*
