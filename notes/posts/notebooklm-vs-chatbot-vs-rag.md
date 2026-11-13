---
title: "What is Google's NotebookLM, and how is it different from a chatbot and from RAG?"
date: 2024-08-16
tags: [AI]
summary: NotebookLM, ChatGPT, and RAG get discussed as three competing things. They are not. One is a product, one is a pattern, and the difference that actually matters is who decides what the model is allowed to read.
related: [what-is-rag, chatgpt-interface, local-rag-agent]
---

Google's NotebookLM keeps coming up in conversations lately, and those conversations keep hitting the same confusion. Is it a chatbot? Is it RAG? Is it a new category? The short answer is that NotebookLM **is** retrieval-augmented generation, packaged as a product, with every engineering decision already made for you. Whether that counts as a feature or a limitation depends entirely on what you are trying to do with it.

## The problem all three are trying to solve

A language model trained on the public internet knows a great deal and knows nothing about you. It has never read your company's contracts, your lecture notes, or the forty PDFs sitting in your downloads folder. Worse, when you ask it about them anyway, it will often produce something confident and wrong rather than admit the gap.

[RAG solves this](notes.html?post=what-is-rag) by retrieving relevant passages from documents you supply and putting them in front of the model before it answers. Every approach below is some version of that idea. They differ in who does the retrieving.

## What NotebookLM actually does

You create a notebook and add sources: PDFs, Google Docs, Google Slides, web URLs, or pasted text. Up to fifty per notebook. Then you ask questions, and it answers from those sources alone, with inline citations pointing back to the exact passage it used.

That last part is the whole product. Click a citation and you land on the sentence the claim came from. It also generates a study guide, a briefing document, an FAQ, and a timeline from whatever you have uploaded, which is genuinely useful when you are trying to get oriented in unfamiliar material.

The behaviour worth noticing is what it refuses to do. Ask it something your sources do not cover and it tells you so instead of reaching into general knowledge. It runs on Gemini 1.5 Pro, it is free, and Google still labels it experimental.

## So how is it different from ChatGPT?

ChatGPT answers from what it absorbed during training. There is a knowledge cutoff, there are no citations, and when it does not know something the failure is silent — you get fluent text that happens to be fabricated.

NotebookLM answers from a closed set of documents you chose. It can show you its evidence. When it does not know, it says so.

The useful framing is that they fail in opposite directions. A chatbot's characteristic failure is inventing an answer. NotebookLM's characteristic failure is refusing to give you one, because the passage it needed did not surface during retrieval. In most serious work, the second failure is much cheaper than the first.

## And how is it different from RAG?

Architecturally, it mostly isn't. Your documents get chunked, embedded, stored, retrieved against your question, and passed to a model with an instruction to answer only from the supplied context. That is RAG. NotebookLM is a RAG system with a good interface on top.

The difference is control, and it runs down a specific list:

- **Chunking strategy.** Google picks it. You never see it.
- **Embedding model.** Google picks it. You cannot swap it for one that handles your jargon better.
- **How many passages get retrieved.** Google picks it.
- **Which model writes the answer.** Gemini, or nothing.
- **Where your documents live.** Google's servers.
- **Whether you can measure retrieval quality.** You cannot. There is no way to ask which chunks were considered and rejected.

When you build RAG yourself, every one of those becomes a decision you own, which is both the cost and the point.

## When each one is right

Reach for a **chatbot** when the question is general: drafting, explaining, reasoning about something that is not tied to your private documents.

Reach for **NotebookLM** when you personally need to understand a specific pile of material. Literature reviews, dense reports, a subject you are studying. Setup time is about ninety seconds and the citations make it easy to verify what it tells you. For a researcher reading unfamiliar papers, it is hard to beat.

**Build RAG** when the answer has to live inside a product, when the data cannot be uploaded to Google, when retrieval needs tuning for your domain's vocabulary, when you need to evaluate quality before shipping, or when the system has to serve people other than you.

## Where NotebookLM stops

Fifty sources is generous for a person and irrelevant for an organisation whose corpus runs to tens of thousands of documents. When retrieval misses, you have no lever to pull. There is no API, so you cannot put it behind your own interface or into a workflow. Your documents go to Google, which rules it out for anything confidential. And you cannot evaluate it, because you cannot instrument what you cannot see inside.

None of these are flaws exactly. They are what you trade away for something that works immediately and costs nothing.

## The way I would actually use it

NotebookLM is the cheapest possible test of whether RAG solves your problem at all.

Before committing engineering time, upload the real documents, ask the real questions, and look at the answers. If grounded responses are not good enough even with Google's implementation, the problem is probably your documents rather than your retrieval, and building your own stack will not rescue it. If they are good enough and this is for you alone, you are finished — stop there. And if they are good enough but you need it inside a product, you now have evidence worth building on.

That is a ninety-second experiment standing in for a two-week one, which is usually a trade worth making.
