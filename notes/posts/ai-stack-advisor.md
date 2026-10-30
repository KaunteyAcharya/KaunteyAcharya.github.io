---
title: Building AI Stack Advisor, a build-vs-buy calculator for AI
date: 2026-10-21
updated: 2026-10-30
tags: [AI, projects]
summary: Should a business buy a SaaS tool, build on APIs, or run its own model? A free browser tool that answers with costs, TCO, break-even, and ROI, in your own currency and with your country's tax rules.
related: [local-rag-agent, ml-drift-alert-agent, tickerbrief]
---

Almost every business that wants an AI chatbot, voice agent, or document assistant runs into the same question: should we buy it or build it? Subscribe to a SaaS tool, build on hosted LLM APIs, run an open model on our own GPUs, or mix the two? The honest answer is "it depends", but it depends on things you can actually put numbers on: volume, data sensitivity, team skills, and what each conversation is worth.

So I built [AI Stack Advisor](https://github.com/KaunteyAcharya/ai-stack-advisor). You describe what you want AI to do, and it compares the four options on monthly cost, 36-month total cost of ownership (TCO), break-even volume, and ROI, then writes a consultant-style recommendation with every assumption listed. You can [try it live](https://kaunteyacharya.com/ai-stack-advisor/).

It is built for founders, operations leads, and consultants in India, the US, Canada, Australia, the UAE, the UK, Switzerland, and the Eurozone, and it works in each region's currency, number format, tax rules, and labour costs.

## The four options

- **A. SaaS:** a ready-made product, priced per seat, per conversation, or per resolved conversation.
- **B. API-based build:** your own app on hosted models, paying per token.
- **C. Self-hosted:** an open-weight model on rented GPUs that you run yourself.
- **D. Hybrid:** routine requests on your own GPUs, harder ones sent to an API.

## How it works

1. **Start from goals.** Pick what you want AI to do, like answering customers, processing invoices, or finding answers in company data. Each goal becomes a workload, and you can pick several.
2. **Volume.** Users per day × requests per user × 30, or documents × pages for document processing, growing month by month.
3. **Cost of each option.** API cost comes from tokens times published prices, plus hosting, databases, and maintenance. Self-hosting picks a model size, the cheapest GPU with enough memory, and enough GPUs for peak traffic. SaaS uses the cheapest plan whose limits fit.
4. **Value.** What a conversation is worth in sales, or how many staff hours an internal tool or agent saves.
5. **Recommendation.** A weighted score of cost and non-cost factors (privacy, time to launch, team fit, quality, lock-in, and scalability), plus a check on whether the answer is robust or a close call.

Every formula is written out in the [methodology](https://github.com/KaunteyAcharya/ai-stack-advisor/blob/main/docs/METHODOLOGY.md). The rest of this note is about the details that make the numbers believable.

## Your own currency, formatted the way you read it

You pick your country and currency first. The tool guesses them from the browser's language, without any network call. From then on, every amount you type, every result, and the report use that currency.

- **Eight currencies:** INR, USD, EUR, GBP, CHF, CAD, AUD, and AED, with an optional second currency shown alongside.
- **Local number formats.** Indian amounts use lakh and crore (₹65,00,000, or ₹65 lakh, or ₹1.4 crore), and the live hints follow suit ("≈ 2,00,040 requests a month"). Each Eurozone country gets its own locale, so the same number can read 1.234.567,89 € or €1,234,567.89.
- **One base currency underneath.** Everything is calculated in USD and converted only for display, using the **European Central Bank reference rates**. A weekly GitHub Action fetches new rates and opens a pull request for review instead of changing them silently, and it rejects any update where a rate moved more than 15%. The ECB does not publish the dirham, so AED uses its fixed peg of 3.6725 per US dollar.
- **Thresholds that behave the same everywhere.** Business profiles are defined in USD equivalents (for example, a "high-ticket" business sells at USD 10,000 or more), so switching currency never changes the recommendation by accident.

## Tax: VAT, GST, and sales tax, counted only when it is a real cost

Vendor prices are quoted before tax, but tax is not always a cost. A registered business usually reclaims VAT or GST, so adding it would overstate the bill. Sales tax in many US states, or tax paid by a VAT-exempt business, is a real cost. The tool models that difference per country (and per province in Canada):

| Country | Tax on cloud and SaaS purchases | Reclaimable by a registered business? |
|---|---|---|
| India | GST 18% | Yes (input tax credit) |
| United States | State and local sales tax where the state taxes SaaS (you enter the rate) | No |
| Canada | GST 5% or HST 13 to 15% by province, plus QST 9.975% (Quebec) or PST/RST 6 to 7% | GST, HST, and QST yes; PST and RST no |
| Australia | GST 10% | Yes |
| UAE | VAT 5% | Yes |
| United Kingdom | VAT 20% | Yes |
| Switzerland | VAT 8.1% | Yes |
| Eurozone | VAT from 17% (Luxembourg) to 25.5% (Finland) | Yes |

Only the taxes a business cannot reclaim are added, and only to money paid to vendors. In-house build and maintenance hours carry no tax. The healthcare and education presets default to "not reclaimable", because those sectors are often VAT or GST exempt. The API-versus-self-hosting break-even applies the same tax to external spend on both sides, so tax never tilts that comparison by itself. This is a planning simplification, not tax advice.

## Data protection rules that remove options

If your data must stay in-house, the tool does not just lower a score: it excludes SaaS and the API option, and limits the hybrid to its self-hosted share. Softer rules, such as personal data going to an external provider or a data residency requirement, lower the privacy score instead. The report also names the data-protection law to review for your region, such as India's DPDP Act, GDPR, UK GDPR, Switzerland's FADP, Canada's PIPEDA, Australia's Privacy Act, or the UAE's PDPL.

## Costs modelled the way the bills actually arrive

A build-vs-buy answer is only as good as its cost model, so the tool goes past "tokens × price":

- **Prompt caching.** Repeated parts of a prompt (system prompt, instructions, earlier agent steps) are billed at the provider's cheaper cached-input price, but only when the prompt is above the provider's minimum size (2,048 tokens). Short chatbot prompts correctly get no discount.
- **Batch pricing.** Work that can wait, like invoices, lead scoring, and reports, uses the providers' batch prices, which are about 50% lower.
- **GPU sizing from first principles.** The quality you need picks a model size, which sets the memory it needs, which picks the cheapest GPU that fits: an L4 (24 GB) for a small model, an L40S (48 GB) for a mid-size one, and an A100 (80 GB) for a large one. The GPU count covers peak traffic with 30% headroom, at least two GPUs if you need high availability, and GPUs are billed for all 730 hours of a month because they stay on.
- **Growth that stops.** Volume grows monthly, but only for a set number of months (12 by default). Without that, 5% a month for 36 months multiplies volume about 5.8 times, and the 36-month total ends up depending mostly on one guess. Every report also shows the 36-month cost with no growth.
- **Money now versus later.** Options are ranked on present value (10% a year by default), because a cost in year three weighs less than one today.
- **A hybrid that finds its own split.** The tool tries sending 10%, 20%, and so on up to 90% of traffic to your own GPUs, and keeps the cheapest split over 36 months.
- **One-time costs.** Build hours plus evaluation hours, because testing quality on your own data before launch is real work, and open models need more of it.

## Value: sales, saved time, or both

Costs alone do not answer "is it worth it?", so the tool values each kind of workload differently:

- **Customer-facing chat** is valued on sales. The headline uses only the gross profit on a first sale, which is deliberately conservative, and turns it into a plain sentence: "pays for itself with N extra sales a month". A second figure counts repeat purchases over 12 months.
- **Support savings** count only the conversations that reach a person today (20% by default), not every chatbot message. Counting every message would overstate the savings for high-volume chat.
- **Internal tools** such as a data assistant or an internal copilot are valued on minutes saved per request, at a staff hourly cost.
- **Workflow agents** are valued on hours saved after subtracting review time and the cost of errors, and reported in hours or full-time equivalents.

## Workflow agents, priced per task

Six agent workflows are modelled: invoice processing, lead qualification, report generation, ticket triage, stock data to report, and a content engine that creates posts and replies to comments on your own posts. (Automated comments on other people's posts would break the platforms' rules, so they are not modelled.)

The interesting part is how cost grows. Each step of an agent re-reads the base prompt plus everything produced so far, so the average input per call is `base + growth × (steps − 1) / 2`. Cost grows faster than the number of steps, which is why long agents get expensive, and why caching and batch prices matter so much for them.

## Several workloads: one stack or a mix

Most companies want more than one thing, for example a chatbot, a data assistant, and an invoice agent. You can add several workloads, and the tool asks whether they should all share one stack or each use a different option.

With up to five workloads it checks every combination (4⁵ = 1,024 at most). Beyond that it uses a local search, which on five workloads finds the same answer as checking everything. Workloads on the same stack share databases, hosting, and pooled GPUs, while each extra workload adds 50% of the base build and maintenance effort. That captures the real cost of a mix: two vendors and two skill sets. The report compares the best single stack with the best mix, and says from which month one self-hosted stack for everything becomes cheaper than one API stack.

## Showing the workings

A recommendation is only useful if you can see why. Click any monthly cost and it breaks down into quantity × rate, for example "200,040 requests × $0.00145".

Every number behind a result sits in an **assumption register** with its source, a last-reviewed date, and one of three confidence levels: verified (an official or primary source, such as a vendor's price page or a tax authority), benchmark (an official statistic used as a proxy), or estimate (a reasoned judgement). The estimates that move the answer most are flagged as "check these first".

Staff costs come from official statistics, loaded with employer on-costs: the BLS in the US, Eurostat, the ONS in the UK, Statistics Canada, the ABS in Australia, the Swiss FSO, and India's PLFS. Hours per full-time employee follow the region too (160 a month by default, 192 in India).

Prices are kept honest by automation: every price in the data files records its official source and the date it was last checked, values that could not be verified are marked as samples (with a banner whenever one affects a result), and a weekly GitHub Action opens an issue listing any price older than 30 days.

## Being honest about uncertainty

This is the same instinct as in my physics and quant work: a single number without error bars can mislead.

- **"Not sure?" ranges.** Mark inputs you are unsure about (volume, growth, completion rate, minutes saved, conversion, and others), and the summary shows the low and high end, for example "saves 64 to 250 hours a month, payback 0.3 to 1.3 months", and whether the recommendation changes.
- **300 simulations.** The analysis is re-run 300 times, drawing API prices, GPU prices, GPU throughput, labour costs, build hours, and the open-model quality gap from ranges. It then reports how often each option wins, and the 10th to 90th percentile of costs and net benefit. The runs are seeded, so the same inputs always give the same answer.
- **Tornado chart.** Each assumption is moved alone to its low and high end, and the bars show which ones move the result most.
- **Robustness check.** Each scoring weight is moved 10 points up and down. If the winner never changes, the report says "Robust"; otherwise it says "Close call, decided by X".
- **Quality-adjusted cost.** Open models can complete fewer tasks than frontier models. A "quality gap" (10 points by default, which you should replace with your own evaluation) lowers the self-hosted option's completion and savings, and the value it gives up is added to its cost before ranking.

## Made to be used, not just read

- **Quick mode** asks six questions (industry, use case, users per day, whether data can leave the company, engineers, and DevOps) for a first answer; "All inputs" opens about 40 fields.
- **Plain language as you type**, such as "≈ 1,100 words" or "1,600 of 2,000 invoices done without a person", plus short explanations of terms like tokens, TCO, RAG, batch, and FTE.
- **The answer stays in view.** A result bar shows the recommendation and monthly cost while you edit, and flags each change ("Recommendation changed").
- **Compare scenarios.** Save up to four, such as "today", "after growth", and "EU team", and compare them side by side.
- **Two report views.** A short executive summary or the full analyst view, printable to a clean PDF.
- **Sharing without a server.** A scenario can be shared as a link that carries the inputs inside the URL, or downloaded as JSON.
- **Industry presets** for D2C e-commerce, B2B SaaS, real estate, a healthcare clinic, ed-tech, and professional services.

## Tech stack

- Plain **HTML**, **CSS**, and **JavaScript** modules, with no framework and no build step
- A pure-function **engine** that runs the same in the browser and in Node tests, with unit and end-to-end scenario tests on Node's built-in test runner
- **Chart.js** for the charts, stored with the site rather than loaded from a CDN
- **GitHub Actions** that run the tests, refresh exchange rates from the European Central Bank, and flag prices older than 30 days

Everything runs in your browser. There is no backend, no API key, no LLM call, and no tracking, and a Content Security Policy only lets the page load files from its own site. The written recommendation comes from fixed sentence templates, not generated text.

## Limitations

- Vendor prices change often, and volume customers negotiate, so treat the results as planning estimates.
- GPU throughput, model memory needs, engineer costs, and build and maintenance hours are assumptions. Edit them to match your situation.
- Open-weight model quality varies by task. Test on your own data before committing.
- Tax treatment is simplified (no withholding tax, partial exemption, or place-of-supply edge cases), and the data-protection notes name laws to review with an advisor. Neither is legal or tax advice.

*The numbers are estimates for planning, not quotes. Vendor prices change often, so test with your own data before deciding.*
