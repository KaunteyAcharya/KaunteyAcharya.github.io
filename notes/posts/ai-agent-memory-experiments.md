---
title: "AI agent memory: 5 research based experiments on an agent with real data"
date: 2026-11-12
tags: [AI, projects]
summary: Five experiments on two months of my real coding-session history, testing ideas from the Mem0 and MemoryTax papers on a free-tier model. Overwriting memory destroyed history; facts plus raw text plus mixed keyword and embedding search did best.
related: [building-a-personal-ai-agent, what-is-rag, local-rag-agent]
---

On two months of my own developer history, the memory design that worked best for a small, free model kept old facts with a "no longer valid" label instead of overwriting them. It used those facts as an index into the raw transcripts, and it found passages with a mix of keyword and embedding search. That setup scored 85% on 71 questions. Overwriting facts when they changed, as the 2025 Mem0 paper proposed, dropped history questions from 68% to 29%.

This is a follow-up to [building Saati, my personal agent](notes.html?post=building-a-personal-ai-agent). It covers five experiments I ran on Saati's own data. For each run I wrote down the setup and what I would compare before running anything, and every model call was cached, so every number below can be reproduced.

![Left: history questions score 68% when keeping all facts, 29% when overwriting, 100% when marking old facts invalid. Right: the hybrid design scores 76% with keyword search, 75% with local embeddings, 82% with Gemini embeddings, and 85% with keyword plus Gemini.](notes/images/ai-agent-memory-experiments.png)

## Key takeaways

- Overwriting a changed fact fixed stale answers (85% to 98% on current state) but erased history (68% to 29%). Keeping the old fact with a validity label got 98% and 100%.
- Extracted facts lost technical details (7% on detail questions), and raw transcript search lost dates and order (19%). Using facts as an index into the raw text got 76%, tied for best at that stage.
- When a design answered at all, it was right 86% to 98% of the time. Most of the gap between designs came from how often the right evidence reached the model, not from wrong answers.
- The embedding model mattered more than "embeddings or keywords". Google's embedding model took raw search on exact technical questions from 64% to 96%. A small local model went from 64% to 50%.
- Combining keyword and embedding rankings gave the best overall score, 85%: a confirmed 9 points over keyword search, but within noise of embeddings alone (82%).

## The question

Any agent with long-term memory has to decide two things. When a fact changes, does it overwrite the old one or keep it? And does it extract facts up front, or keep raw transcripts and search them when asked?

Two papers point in different directions. [Mem0](https://arxiv.org/abs/2504.19413) (Chhikara et al., 2025) has an LLM resolve conflicts when it writes memory, choosing ADD, UPDATE, DELETE, or NOOP. [MemoryTax](https://arxiv.org/abs/2610.29823) (Peng, 2026) argues that extracting memory up front is a costly, lossy step, and that strong models do as well by searching raw history. Both evaluate on LoCoMo, a benchmark of synthetic conversations; MemoryTax uses one of them. I wanted to know what holds on real data, with a free-tier model.

There are many more questions, such as which embedding model to choose, and some of them come up in the later runs here. The rest will go into future notes. This is my favourite kind of activity as an ex-researcher: read papers, think about the concepts, test the ideas that seem rigorous or interesting, and see whether the results reveal something unexpected.

## Setup

- **Data:** 23 of my real coding sessions, about 2.1 million characters from July to November 2026, across about 12 projects. I froze the data with checksums before running anything. From it the model extracted 337 facts, and the raw text was split into 1,569 passages.
- **Model:** `gemini-3.5-flash-lite` on the free tier for every extraction, memory decision, and answer.
- **Questions:** 71 questions with gold answers, which I checked by hand before any system answered. 57 came from the extracted facts, in five categories: current state, history, dates and order, stable facts, and cross-project. 14 technical-detail questions came from randomly sampled raw passages. Later I added 14 reworded versions of the technical questions, for 85 in total.
- **Grading:** answers were graded blind (system names hidden, order shuffled) as correct, partly correct (half a point), or wrong. Two AI graders from different providers graded runs 1 and 2 independently and agreed 97% and 93% of the time (Cohen's kappa 0.91 and 0.86), and I went through their grades. In later runs, 30 answers that had already been graded were mixed into each new sheet as a consistency check. Agreement on them was 97% to 100%.
- **Statistics:** paired bootstrap 95% confidence intervals (CI). When a CI includes zero, the difference could be chance.

## Run 1: overwrite or keep? (Mem0)

Three designs, fed the same facts: **append-only** (keep everything), **overwrite** (Mem0 2025: UPDATE replaces the old fact), and **mark invalid** (the same decisions, but the old fact stays, labelled "no longer valid since <date>", the idea behind [Zep](https://arxiv.org/abs/2501.13956) and [StateMem](https://arxiv.org/abs/2608.19652)).

| Questions (n) | Keep all | Overwrite | Mark invalid |
|---|---|---|---|
| Current state (23) | 85% | 98% | 98% |
| History (14) | 68% | 29% | 100% |
| Overall (57) | 82% | 76% | 95% |

**Findings.** Marking old facts invalid beat keeping everything by 13 points (95% CI +5 to +22) and beat overwriting by 18 (+9 to +29). Overwriting was no better than keeping everything overall. Over the whole replay the model chose UPDATE 28 times and DELETE never.

**What it means.** Overwriting trades history for freshness, and a label gets both. The UPDATE and DELETE counts suggest that development history refines facts far more often than it retracts them, so a delete-based design has little to gain here. That fits with Mem0 itself moving to add-only memory in April 2026. One caveat: the history questions were drafted from facts that the overwrite design replaced, so this test is built to expose that weakness. The fair claim is that overwrite memory cannot answer history questions, not how often you will ask them.

## Run 2: extract facts, or search raw transcripts? (MemoryTax)

Five designs. Three store extracted facts: keep all, mark invalid (from Run 1), and **newest note wins** (my approximation of Mem0's 2026 add-only approach, where the model is told to trust the latest note). **Raw search** skips extraction and finds the top 8 raw passages for each question. **Hybrid** is my own addition, not in the MemoryTax paper: it searches the facts, then shows the raw passages those facts came from. All designs used keyword search (BM25) here.

| Questions (n) | Extracted facts | Facts marked invalid | Newest note wins | Raw search | Hybrid |
|---|---|---|---|---|---|
| Technical details (14) | 7% | 0% | 11% | 64% | 50% |
| Dates and order (8) | 100% | 100% | 100% | 19% | 100% |
| History (14) | 68% | 100% | 71% | 36% | 61% |
| Overall (71) | 67% | 76% | 65% | 57% | 76% |

**Findings.** Fact-based designs scored 0% to 11% on technical details; raw search scored 19% on dates and order. The hybrid tied for best overall at 76%. I tested two of my own choices that could have caused the technical result. A detail-preserving extraction prompt still scored 0% on the technical questions. Rewording the questions so they shared fewer words with the transcript dropped raw search from 64% to 29%. Looking at the failures, 93 of 101 wrong answers were "I don't know", not invented answers. And "newest note wins" scored 74% on current state against 98% for explicit labels.

**What it means.** A fixed budget of facts cannot keep arbitrary details, so MemoryTax's "tax" is real, but here it applies to details only. On a small model, raw search fails at everything structured, like dates, order, and history. Raw search's good score on details also leaned on the questions sharing words with the transcript. And with "newest note wins", the newer note was often right there in the context; the small model simply did not use it. Explicit labels do that work for it.

## Where the errors came from

Before changing the search method, I went back through every graded answer from runs 1 to 3 and split each design's score into two parts. **Coverage** is how often the design gave an answer at all, instead of saying "I don't know". **Selective score** is how good the answers were when it did answer. The overall score is exactly coverage times selective score. A "confident wrong" answer is one that answered and was graded wrong.

| Run and design | Score | Coverage | Selective score | Said "I don't know" | Confident wrong |
|---|---|---|---|---|---|
| Run 1, keep all | 82% | 88% | 93% | 7 | 2 |
| Run 1, overwrite | 76% | 79% | 97% | 12 | 1 |
| Run 1, mark invalid | 95% | 96% | 98% | 2 | 0 |
| Run 2, keep all | 67% | 72% | 93% | 20 | 2 |
| Run 2, mark invalid | 76% | 77% | 98% | 16 | 0 |
| Run 2, newest note wins | 65% | 72% | 90% | 20 | 2 |
| Run 2, raw search | 57% | 66% | 86% | 24 | 3 |
| Run 2, hybrid | 76% | 82% | 93% | 13 | 1 |
| Run 3, raw search (local embeddings) | 51% | 58% | 89% | 30 | 0 |
| Run 3, hybrid (local embeddings) | 75% | 82% | 92% | 13 | 1 |

(57 questions for Run 1, 71 otherwise.)

**Findings.** Every design was right 86% to 98% of the time when it answered. Mark invalid had the highest selective score in both runs (98%) and no confident errors. Overwrite was accurate when it answered (97%) but said "I don't know" six times as often as mark invalid (12 against 2). In Run 2, 14 of mark invalid's 16 "I don't know" answers were technical questions and 2 were cross-project.

**What it means.** The designs differ mainly in whether the right evidence reaches the model, not in how well the model reads it. That is exactly what deleting history should cause, and it points at retrieval as the thing to improve next. Mark invalid's lower coverage in Run 2 is not caution: it has no raw passages, so it cannot answer technical questions at all. Its high accuracy holds for the question types it can answer.

## Runs 3 to 5: keyword search vs semantic search

In the tables below, **Raw** means raw search (no facts, just the top 8 transcript passages) and **Hybrid** means facts used as an index into the raw passages. The word after the comma is how passages were found: **keyword** (BM25), **local** (embeddings from a small model on my laptop), **Gemini** (Google's embedding model), or **fusion** (keyword and Gemini rankings merged). So "Raw, Gemini" is raw search using Gemini embeddings.

Runs 3 to 5 changed only how passages are ranked. Everything else stayed the same: the 85 questions, the prompt, the number of passages shown (8 for raw search; for the hybrid, the top 10 facts lead to 6 passages, of which 5 are shown), and the answering model. Only raw search and the hybrid were tested, because the fact-only designs do not depend on search. As a check, the new code rebuilt Run 2's keyword-search prompts, and all 170 matched the old ones exactly.

The three ways of ranking:

- **Keyword search (BM25)** scores a passage by the words it shares with the question, weighting rare words more. It is great when the question uses the transcript's own words and blind when it does not.
- **Embeddings** turn the question and each passage into vectors of numbers, so that passages with similar meaning sit close together even when they share no words. Search returns the closest passages.
- **Reciprocal rank fusion (RRF)** merges the two rankings. Each passage gets 1/(60 + its keyword rank) plus 1/(60 + its embedding rank), so a passage near the top of either list rises. It took me a while to see why something this simple works: it uses only rank positions, so it never has to compare a keyword score with a similarity score.

Overview of the three runs, against keyword search from Run 2:

| Questions (n) | Keyword | Local embeddings | Gemini embeddings | Keyword + Gemini |
|---|---|---|---|---|
| Raw search, technical, original wording (14) | 64% | 50% | 96% | 75% |
| Raw search, technical, reworded (14) | 29% | 50% | 43% | 43% |
| Hybrid, overall (71) | 76% | 75% | 82% | 85% |
| Hybrid, history (14) | 61% | 75% | 75% | 89% |

### Run 3: local embeddings

The embedding model was `bge-small-en-v1.5`, a small open model (384 numbers per vector) running on my laptop's CPU. It made no API calls and embedded everything in about five minutes.

Before answering anything, I measured a rough signal of what the search found: the share of questions where at least 80% of the gold answer's words appeared in the passages shown. It counts shared words, so it favours keyword search by design, but it shows what reached the model.

| Design | Search | Structured (57) | Technical, original (14) | Technical, reworded (14) |
|---|---|---|---|---|
| Raw search | Keyword | 67% | 93% | 43% |
| Raw search | Local | 61% | 71% | 71% |
| Hybrid | Keyword | 86% | 64% | 43% |
| Hybrid | Local | 88% | 71% | 50% |

Graded answers:

| Questions (n) | Raw, keyword | Raw, local | Change (95% CI) | Hybrid, keyword | Hybrid, local | Change (95% CI) |
|---|---|---|---|---|---|---|
| Technical, original wording (14) | 64% | 50% | −14 (−50 to +29) | 50% | 46% | −4 (−32 to +25) |
| Technical, reworded (14) | 29% | 50% | +21 (−11 to +50) | 32% | 54% | +21 (−7 to +50) |
| Structured (57) | 55% | 52% | −4 (−15 to +8) | 82% | 82% | 0 (−9 to +8) |
| Overall, 71 original | 57% | 51% | −6 (−18 to +6) | 76% | 75% | −1 (−10 to +8) |
| History (14) | 36% | 50% | +14 | 61% | 75% | +14 (−4 to +32) |
| Current state (23) | 74% | 63% | −11 | 89% | 89% | 0 |
| Dates (8) | 19% | 12% | −6 | 100% | 100% | 0 |
| Stable (7) | 71% | 79% | +7 | 100% | 86% | −14 |
| Cross-project (5) | 60% | 30% | −30 | 60% | 40% | −20 |

The overall score above counts only the 71 original questions, and categories have very different sizes. So I also scored each design two other ways: over all 85 questions, and with all seven categories weighted equally. The equal-weight score is one stated mix, not an estimate of real use.

| Design | All 85 | Categories weighted equally |
|---|---|---|
| Raw search, keyword | 52% | 50% |
| Raw search, local | 51% | 48% |
| Hybrid, keyword | 69% | 70% |
| Hybrid, local | 72% | 70% |

**Findings.** Local embeddings raised both designs by about 21 points on reworded questions (29% to 50%, and 32% to 54%), similar to or better than adding an LLM call to expand the query, at no API cost. They lost exact-word matches (64% to 50% for raw search) and did not fix dates or current state. Overall, the hybrid went from 76% to 75%. None of these differences are statistically confirmed with 14 questions per technical group. Over all 85 questions, the hybrid rose 3 points; with equal category weights it stayed flat at 70%.

**What it means.** Embeddings and keywords fail on different questions. A small local model understands meaning well enough to find a reworded question's passage, but it blurs the exact identifiers that keyword search catches. The hybrid's gains came in big 14-question categories (reworded, history) and its losses in small ones (stable, cross-project), which is why the two summary scores disagree. The hybrid stays the best design whichever search it uses.

### Run 4: Gemini embeddings

The embedding model was `gemini-embedding-2` through the API (3,072 numbers per vector, with separate settings for documents and queries). A practical note: the free tier allows 1,000 texts a day and counts each text in a batch separately, so embedding 1,991 texts took two days.

| Questions (n) | Raw, keyword | Raw, Gemini | Change (95% CI) | Hybrid, keyword | Hybrid, Gemini | Change (95% CI) |
|---|---|---|---|---|---|---|
| Technical, original wording (14) | 64% | 96% | +32 (+11 to +57) | 50% | 64% | +14 (0 to +36) |
| Technical, reworded (14) | 29% | 43% | +14 (−21 to +50) | 32% | 50% | +18 (−11 to +46) |
| Structured (57) | 55% | 54% | −1 (−15 to +13) | 82% | 87% | +4 (−4 to +13) |
| Overall, 71 original | 57% | 63% | +6 (−7 to +18) | 76% | 82% | +6 (−1 to +15) |
| Dates (8) | 19% | 50% | +31 | 100% | 100% | 0 |
| History (14) | 36% | 29% | −7 | 61% | 75% | +14 |
| Current state (23) | 74% | 72% | −2 | 89% | 91% | +2 |
| Stable (7) | 71% | 71% | 0 | 100% | 100% | 0 |
| Cross-project (5) | 60% | 30% | −30 | 60% | 60% | 0 |

Gemini against the local model, same questions:

| Questions | Raw, local | Raw, Gemini | Change (95% CI) | Hybrid, local | Hybrid, Gemini | Change (95% CI) |
|---|---|---|---|---|---|---|
| Technical, original (14) | 50% | 96% | +46 (+21 to +71) | 46% | 64% | +18 (0 to +39) |
| Technical, reworded (14) | 50% | 43% | −7 (−43 to +32) | 54% | 50% | −4 (−29 to +21) |
| Structured (57) | 52% | 54% | +3 (−11 to +17) | 82% | 87% | +4 (−5 to +14) |
| Overall, 71 | 51% | 63% | +11 (−1 to +25) | 75% | 82% | +7 (−1 to +16) |
| All 85 | 51% | 59% | +8 (−5 to +21) | 72% | 77% | +5 (−3 to +14) |

On the word-overlap check, Gemini's raw search covered 93% of original-wording technical questions and 86% of reworded ones, against keyword search's 93% and 43%.

**Findings.** Gemini embeddings took raw search on original-wording technical questions from 64% to 96% (CI +11 to +57), the only confirmed difference against keyword search in this run, and 46 points above the local model (CI +21 to +71). On reworded questions both embedding models beat keyword search, and Gemini was no better than the local model. The hybrid with Gemini reached 82% on the 71 original questions and 77% on all 85, the best so far but not confirmed. Raw search still failed at structure: history 29%, cross-project 30%.

**What it means.** The embedding model matters more than the choice between embeddings and keywords. A stronger model keeps the exact technical details that the small one blurred, so it can beat keyword search even on questions written in the transcript's own words. But better search does not give raw text the structure that extracted facts carry, so the hybrid stays ahead.

### Run 5: keyword plus Gemini, fused

Same Gemini vectors as Run 4 (no new embedding calls), merged with the keyword ranking by reciprocal rank fusion with the standard constant of 60, not tuned. Fusion was applied at every search step, including the hybrid's fact search.

Fusion against keyword search alone:

| Questions (n) | Raw, keyword | Raw, fusion | Change (95% CI) | Hybrid, keyword | Hybrid, fusion | Change (95% CI) |
|---|---|---|---|---|---|---|
| Technical, original wording (14) | 64% | 75% | +11 (−21 to +43) | 50% | 57% | +7 (0 to +21) |
| Technical, reworded (14) | 29% | 43% | +14 (−14 to +43) | 32% | 46% | +14 (−14 to +43) |
| Structured (57) | 55% | 61% | +6 (−4 to +17) | 82% | 92% | +10 (+3 to +18) |
| Overall, 71 original | 57% | 64% | +7 (−4 to +18) | 76% | 85% | +9 (+3 to +16) |
| Dates (8) | 19% | 38% | +19 | 100% | 100% | 0 |
| History (14) | 36% | 46% | +11 | 61% | 89% | +29 (+4 to +54) |
| Current state (23) | 74% | 76% | +2 | 89% | 93% | +4 (0 to +11) |
| Stable (7) | 71% | 86% | +14 | 100% | 100% | 0 |
| Cross-project (5) | 60% | 40% | −20 | 60% | 70% | +10 |
| All 85 | 52% | 61% | | 69% | 79% | |

Fusion against Gemini alone:

| Questions | Raw, Gemini | Raw, fusion | Change (95% CI) | Hybrid, Gemini | Hybrid, fusion | Change (95% CI) |
|---|---|---|---|---|---|---|
| Technical, original (14) | 96% | 75% | −21 (−43 to 0) | 64% | 57% | −7 (−21 to 0) |
| Technical, reworded (14) | 43% | 43% | 0 (−21 to +21) | 50% | 46% | −4 (−25 to +18) |
| Structured (57) | 54% | 61% | +7 (−5 to +19) | 87% | 92% | +5 (−4 to +15) |
| Cross-project (5) | 30% | 40% | +10 (0 to +30) | 60% | 70% | +10 (0 to +30) |
| Overall, 71 | 63% | 64% | +1 (−10 to +12) | 82% | 85% | +3 (−5 to +11) |
| All 85 | 59% | 61% | +1 (−9 to +11) | 77% | 79% | +2 (−5 to +9) |

**Findings.** The fused hybrid reached 85% on the 71 original questions and 79% on all 85. Against keyword search, that is the first confirmed overall gain in runs 3 to 5: +9 (CI +3 to +16), mostly from structured questions (+10, CI +3 to +18) and above all history (61% to 89%, CI +4 to +54). Against Gemini alone, fusion lost exact technical recall for raw search (96% to 75%) and gained on structured and cross-project questions; every overall difference is within noise.

**What it means.** Fusion is a safe default rather than a clear win. Keyword search pushed some exact-detail passages out of the top eight that Gemini alone would have kept, while the two rankings together found more of the facts that history questions need. So the best search depends on the question: Gemini alone for exact technical recall, fusion for history and structure. Raw search stays far behind the hybrid whichever search it uses.

## What I would build

1. Keep every fact, and mark replaced ones "no longer valid since <date>". Do not overwrite.
2. Link each fact to the raw passage it came from, and show both when answering.
3. Search with a good embedding model, and merge it with keyword search when history and structure matter more than exact details.

## Limits

This is a case study that uses only my data, one small model, and 5 to 23 questions per category, so differences under about 15 to 20 points can be chance; only the results with confidence intervals that exclude zero are firm. The word-overlap check measures shared words, not whether the search understood the question. The reworded questions were written to avoid the transcript's words, which makes them harder for keyword search than most real questions. I tested the designs from the Mem0 paper and an approximation of its 2026 approach, not the Mem0 product. An AI grader graded every run blind, a second AI grader from a different provider graded runs 1 and 2 independently, and I went through the grades.

Reworded detail questions are still the weak spot, at 43% to 54% at best across runs 3 to 5. Next I want a larger set of technical questions, so the smaller differences can be settled, and a run that combines the two strongest results: validity-labelled facts as the index into the raw text. I will also try query expansion and experiments from other papers.
