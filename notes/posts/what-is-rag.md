---
title: What is RAG, and why does it matter so much?
date: 2026-08-24
tags: [AI]
summary: Retrieval-augmented generation lets an AI answer from your own documents instead of its memory. Here is how it works, why it has become so important, and where it goes wrong.
related: [local-rag-agent, how-labs-train-ai-models, ml-vs-deep-learning]
---

If you've looked at AI job posts or company AI plans in the last two years, you've seen the word **RAG** come up again and again. Almost every organisation wants AI that can answer from its own documents, and RAG is how most of them build it.

I've been reading about and experimenting with RAG a lot lately, so I wanted to write a clear explanation of what it is, why it has become so important, and the parts that are harder than they look.

## The problem RAG solves

A language model like GPT or Claude learns from a huge amount of text during training. But that knowledge has three big limits:

1. **It's frozen in time.** The model doesn't know anything that happened after its training data was collected.
2. **It doesn't know your private data.** Your company's policies, your contracts, your internal wiki, your research notes. None of that was in its training.
3. **It can make things up.** When a model doesn't know something, it may still produce a confident, plausible-sounding answer. This is called **hallucination**.

You could retrain or fine-tune the model on your data, but that's expensive, slow, and has to be redone every time your documents change. And fine-tuning is better at teaching style and behaviour than at reliably storing facts.

## The idea: look it up first

**RAG** stands for **retrieval-augmented generation**. The name comes from a 2020 paper by researchers at Facebook AI (now Meta), and the idea is simple:

> Before the model answers, find the most relevant pieces of your documents and give them to the model along with the question.

It's the difference between a closed-book exam and an open-book exam. Without RAG, the model answers from memory. With RAG, it answers with the right pages open in front of it.

## How it works, step by step

A RAG system has two phases.

### Phase 1: preparing your documents (done once, updated as needed)

1. **Load** your documents: PDFs, web pages, emails, notes, whatever you have.
2. **Chunk** them: split each document into smaller pieces, often a few paragraphs each. Models can only take in so much text, and smaller pieces make retrieval more precise.
3. **Embed** each chunk: an **embedding model** turns each piece of text into a vector, a long list of numbers that captures its meaning. Texts with similar meanings get vectors that point in similar directions, even if they use different words. "How do I reset my password?" and "I forgot my login" end up close together.
4. **Store** the vectors in a **vector database** (like Chroma, Pinecone, or pgvector), which is built to quickly find the closest vectors to a new one.

### Phase 2: answering a question (every time someone asks)

1. **Embed the question** with the same embedding model.
2. **Retrieve** the chunks whose vectors are closest to the question's vector, usually the top 3 to 10.
3. **Augment** the prompt: put those chunks into the prompt with an instruction like "Answer using only the context below. If the answer isn't there, say so."
4. **Generate** the answer with the language model, ideally with citations pointing back to the source chunks.

That's it. The model doesn't learn anything new permanently. It just gets the right information at the right moment.

## Why it matters so much

**1. It works with data that changes.** Update a document, re-embed it, and the system knows the new version immediately. No retraining.

**2. It's cheap.** You use an existing model as is. The main costs are embedding your documents (cheap) and the model calls.

**3. It reduces hallucination.** Grounding answers in real documents makes them far more reliable. Not perfect, but much better.

**4. It can cite sources.** Users can click through to the exact paragraph the answer came from. For businesses, legal teams, and researchers, this trust matters more than almost anything else.

**5. It respects access control.** You can filter retrieval by who's asking, so people only get answers from documents they're allowed to see.

**6. It fits almost every business.** Customer support, internal knowledge bases, legal and compliance search, research assistants, onboarding guides. Any company with lots of documents has a use for it.

This is why RAG has become one of the most important building blocks for companies adopting AI. It's practical, relatively easy to start, and the value is easy to explain.

## The parts that are harder than they look

The basic version takes an afternoon. Making it actually good takes much longer. What I found most interesting while experimenting with it is that the language model is rarely the problem. Retrieval is.

- **Chunking matters a lot.** Chunks too small lose context; chunks too large bury the relevant sentence in noise. Splitting in the middle of a table or a list can break the meaning entirely.
- **Similar isn't always relevant.** Vector search finds text that *sounds* similar, but it can miss exact terms like product codes, names, or error numbers. That's why many systems use **hybrid search**, combining vector search with classic keyword search (like BM25).
- **Reranking helps.** Retrieve a broader set of chunks first, then use a second, more careful model to reorder them by true relevance before passing the best few to the language model.
- **Messy documents.** Scanned PDFs, tables, charts, and headers repeated on every page all need cleaning before they're useful.
- **Questions that need many documents.** "Summarise all complaints from last quarter" can't be answered from five chunks. Approaches like **GraphRAG** (from Microsoft) build a map of entities and relationships across documents to handle these broader questions.
- **Evaluation.** How do you know it's good? You need a set of test questions with known answers and to measure both parts separately: did retrieval find the right chunks, and did the model use them faithfully?

## Isn't long context going to kill RAG?

Models can now read hundreds of thousands, even millions of tokens in a single prompt. So why not just paste in all your documents?

For small collections, that can work well. But for anything large, RAG still wins on cost (you pay for every token you send), speed, and focus (models can still miss details buried in very long inputs). And most companies have far more documents than any context window can hold. In practice, the two work together: retrieve the right material, then use long context to read it properly.

## Where it's going: agentic RAG

The newer versions are less of a fixed pipeline and more of an **agent**. Instead of always retrieving once and answering, the model decides for itself: should I search? What should I search for? Was that result good enough, or should I try a different query? Should I check another source?

That's much closer to how a person researches something, and it's where a lot of current work is heading. Tools like MCP (Model Context Protocol) make it easier to connect models to many data sources this way.

## Why I like it

I love RAG as an idea because it makes the strengths and weaknesses of language models very visible. The model is great at reading and explaining. It's bad at remembering specific facts reliably. RAG plays to the strength and covers the weakness.

If you're starting with AI engineering, it's probably the single most useful thing to build first. Next, I'm planning to build a fully local version that runs entirely on my own machine, and I'll write about it once it's done.
