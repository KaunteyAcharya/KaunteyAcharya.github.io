---
title: Building a fully local RAG agent
date: 2026-09-04
tags: [AI, automation, projects]
summary: Asking questions about my own documents with n8n, Ollama, and ChromaDB, with nothing leaving my machine.
---

I wanted a simple way to ask questions about my own documents without sending them to a cloud API. No API keys, no usage bills, and no data leaving my machine. So I built a [local RAG document Q&A agent](https://github.com/KaunteyAcharya/RAG-doc-qa-agent). There is a short video demo in the [README](https://github.com/KaunteyAcharya/RAG-doc-qa-agent#readme).

## How it works

There are two flows, both running in n8n:

1. **Ingestion.** I upload a PDF, TXT, DOCX, or MD file through a form. It is split into chunks of 400 characters with 100 characters of overlap, each chunk is embedded, and the vectors are stored in ChromaDB.
2. **Question answering.** I ask a question in a chat window. The agent retrieves the 15 most relevant chunks and passes them to a local LLM with a strict system prompt: answer only from this context, and say so plainly when the answer isn't there.

That last rule mattered more than I expected. A small model will happily fill gaps with confident guesses, and forcing it to admit "I can't find this in the document" made the answers far more trustworthy.

## Tech stack

- **n8n** (self-hosted in Docker) for orchestration
- **Ollama** running `llama3.2:1b` for answers and `nomic-embed-text` for embeddings
- **ChromaDB** (also in Docker) as the vector store
- One `docker compose up` to start everything

## What I learned

Retrieval quality depends heavily on chunk size and top-k, and the right values change with the kind of document. I also chose a deliberately small model for speed, and it shows its limits on multi-item reasoning, such as correctly pairing items in a list with their attributes. Swapping in a larger model like `llama3.2:3b` or `qwen2.5:3b` fixes much of that, at the cost of speed. It is a nice, hands-on way to feel the trade-offs in a RAG system rather than just read about them.
