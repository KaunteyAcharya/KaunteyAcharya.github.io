---
title: Building a fully local RAG agent with n8n, Ollama, and ChromaDB
date: 2026-09-22
updated: 2026-10-30
tags: [AI, projects]
summary: A document Q&A agent that runs entirely on my machine. How it splits, embeds, and retrieves text, the prompt that stops a small model from guessing, and what would change with a cloud model, different chunk sizes, or conversation memory.
related: [what-is-rag, ml-drift-alert-agent, automating-arxiv]
---

I wanted a simple way to ask questions about my own documents without sending them to a cloud API. No API keys, no usage bills, and no data leaving my machine. So I built a [local RAG document Q&A agent](https://github.com/KaunteyAcharya/RAG-doc-qa-agent). There is a short video demo in the [README](https://github.com/KaunteyAcharya/RAG-doc-qa-agent#readme).

In one line: you upload a document through a form, it gets split into small overlapping pieces that are turned into vectors and stored in ChromaDB, and when you ask a question, the 15 most relevant pieces are handed to a small local model that is only allowed to answer from them. Every part (n8n, Ollama, and ChromaDB) runs on the same laptop.

If you want the idea behind this before the build, I explain retrieval-augmented generation from first principles in [What is RAG](notes/what-is-rag/).

## Why fully local

Most RAG tutorials use a hosted embedding API, a hosted vector database, and a hosted LLM. That is three places your document goes. For documents that should stay private, I wanted the opposite: the document, its embeddings, and every answer stay on my machine. The cost of that choice is speed and model size, which shows up in the trade-offs below.

## Architecture

There are two flows, both in one n8n workflow:

```
Ingestion
  Upload form (PDF, TXT, DOCX, MD)
    -> Data loader (adds the file name as metadata)
    -> Text splitter (400 characters, 100 overlap)
    -> nomic-embed-text (Ollama)  -> ChromaDB collection "rag_documents"

Question answering
  Chat message
    -> Retriever (top 15 chunks from "rag_documents")
    -> Q&A chain with a strict system prompt
    -> llama3.2:1b (Ollama, temperature 0.3)  -> answer in the chat window
```

Docker Compose starts ChromaDB and n8n. Ollama runs on the host, and n8n reaches it through `host.docker.internal`.

## Ingestion: chunk size and overlap

The splitter cuts each document into chunks of 400 characters with 100 characters of overlap. 400 characters is roughly a short paragraph of English, small enough that one chunk usually holds one idea, which keeps its embedding focused. The 100-character overlap (a quarter of each chunk) means a sentence that falls on a boundary still appears whole in at least one chunk.

Each chunk is embedded with `nomic-embed-text`, a small embedding model that runs comfortably on a laptop through Ollama, and stored in ChromaDB with the file name attached.

## Retrieval: why top-k is 15

Small chunks have a cost: one chunk rarely holds a full answer. So the retriever pulls the 15 most similar chunks, which is up to about 6,000 characters of context (15 × 400) for the model to read. That is enough to cover an answer spread over a few paragraphs, while staying small enough for a 1B model to handle quickly.

Chunk size and top-k pull against each other. Smaller chunks give sharper matches but need a larger top-k to cover an answer; larger chunks need fewer results but each one carries more unrelated text. The right pair depends on the document: a contract with short numbered clauses behaves differently from a long essay.

## The prompt that stops guessing

This is the part that mattered most. A small model will happily fill gaps with confident guesses, so the Q&A chain uses this system prompt:

> You are a precise document Q&A assistant. Answer ONLY using the exact text found in the context below. Never paraphrase, guess, or invent names, titles, numbers, or facts that are not explicitly written in the context. If the answer is not clearly present in the context, respond exactly: "I could not find that information in the document." When quoting a title, name, or number, copy it character-for-character from the context.

Two details do most of the work. The fixed refusal sentence gives the model an easy, exact way out instead of improvising, and the instruction to copy names and numbers character for character stops it from "correcting" a title or rounding a figure. Together with a low temperature (0.3), it made the answers far more trustworthy. Hearing "I could not find that information in the document" is much more useful than a fluent wrong answer.

## Tech stack

- **n8n** (self-hosted in Docker) for orchestration: the upload form, the chat trigger, and the RAG chain
- **Ollama** running `llama3.2:1b` for answers and `nomic-embed-text` for embeddings
- **ChromaDB** (also in Docker) as the vector store
- One `docker compose up -d` to start ChromaDB and n8n

## Trade-offs and limits

- **Model size versus reasoning.** I chose `llama3.2:1b` deliberately for fast answers on a laptop. It shows its limits on multi-item reasoning, such as correctly pairing items in a list with their attributes. Swapping in `llama3.2:3b` or `qwen2.5:3b` fixes much of that, at the cost of speed.
- **One shared collection.** Every uploaded document goes into the same `rag_documents` collection, so a question searches across everything you have uploaded. That is convenient for a personal knowledge base, but it means two documents on similar topics can mix in one answer.
- **Answers do not show their sources.** The chain returns the answer text only, not which chunks it came from, so checking an answer means going back to the document.
- **Chunking is by characters, not structure.** A table or a numbered list can be split mid-row, which is one reason the right chunk size changes with the kind of document.

## What if it used Claude or OpenAI instead?

Swapping the local model for a hosted one is a small change in n8n: replace the Ollama chat model node with the Anthropic or OpenAI chat model node. The effects are bigger than the change.

- **Better answers.** Hosted frontier models are far larger than a 1B model. Multi-item reasoning (the list-pairing problem above), following the strict refusal rule, and combining facts from several chunks all get much more reliable.
- **Room for more context.** Hosted models accept very long prompts, so you could retrieve more chunks, or larger ones, without the model losing track.
- **Embeddings are a separate decision.** OpenAI offers embedding models. Anthropic does not offer its own embedding model and points to third-party providers such as Voyage AI. So "switch to Claude" usually means Claude for answers plus a separate embedding model, which could stay `nomic-embed-text` on your machine.
- **Privacy changes.** The question and the retrieved chunks are sent to the provider with every message. The document as a whole and the vector store can still stay local, because only the chunks needed for one answer travel. Whether that is acceptable depends on the document and the provider's data terms.
- **Cost and dependency.** Every question is billed per token, and the agent stops working without an internet connection or an API key.

A practical middle ground is a hybrid: local embeddings and ChromaDB, with a hosted model for answers. It keeps the full document on your machine while fixing most of the reasoning limits of a small model.

## When I would change the chunk size

400 characters with 100 of overlap is a reasonable default for mixed documents, not a universal answer. I would change it when the shape of the text changes:

- **Smaller chunks (around 200 to 300 characters)** for documents made of short, self-contained facts: FAQs, glossaries, specification sheets, or contracts with numbered clauses. A question usually targets one line, and small chunks keep that line from being diluted by its neighbours.
- **Larger chunks (around 800 to 1,500 characters)** for text where meaning builds over several paragraphs: research papers, reports, essays, and long explanations. Small chunks there cut an argument in half, so no single chunk contains the answer. With larger chunks, top-k can come down.
- **Structure-aware splitting instead of a fixed size** for documents with clear sections or tables: split on headings, and keep a table or a list in one piece, so a row is never separated from its header.
- **A bigger model allows bigger chunks.** With a hosted model and its longer context, larger chunks and a higher top-k become affordable.

The reliable way to choose is to write a handful of questions whose answers you know, try two or three settings, and count how many come back right.

## Why there is no conversation memory

Each question is answered on its own. That was a deliberate trade-off for this version:

- **Grounding.** With memory, the model sees two sources of text: the document and the earlier conversation, including its own earlier answers. If one of those answers was wrong, it can be repeated as if it were a fact. Without memory, every answer can only come from the document.
- **Context budget.** Ollama runs models with a fairly small context window unless you raise it, and a 1B model gets less reliable as the prompt grows. Fifteen chunks already take up to about 6,000 characters. Chat history on top of that crowds out the document.
- **Simplicity.** The retrieval chain answers one question at a time, which makes each answer easy to test and debug.

The cost is that follow-up questions do not work. "Who wrote the report?" followed by "What else did she write about?" fails, because the second question means nothing without the first.

Adding memory alone would not fully fix that. The retriever searches with the question as typed, so "What else did she write about?" still finds nothing useful in the vector store. A RAG chat with memory needs one more step: before retrieval, rewrite the follow-up into a standalone question using the history ("What else did the author of the report write about?"), then retrieve with that. It also needs a limit on how much history is kept, so the document still gets most of the context.

## What I learned

Retrieval quality depends heavily on chunk size and top-k, and no single setting works for every document type. A strict, explicit prompt does more for trustworthiness than a bigger model, at least for questions whose answers are written in the document. And building the whole pipeline locally is a nice, hands-on way to feel the trade-offs in a [RAG system](notes/what-is-rag/) rather than just read about them.

The code, the workflow file, and setup steps are in the [GitHub repository](https://github.com/KaunteyAcharya/RAG-doc-qa-agent).
