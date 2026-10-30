---
title: "GPT: the model that started it all"
date: 2023-03-29
tags: [AI]
summary: With GPT-4 out, I went back to where the GPT series began. The surprising part is how simple the core idea is, and how far scaling it went.
related: [chatgpt-interface, how-labs-train-ai-models, claude-overtook-gpt]
---

GPT-4 came out on 14 March, and after a few weeks of using it I got curious about how we got here. ChatGPT made the world notice, but the story starts years earlier. So I went back and read through the GPT papers one by one. Here is the history as I understand it, in plain terms.

## First, what does "GPT" mean?

**Generative Pre-trained Transformer.** Each word tells you something:

- **Generative:** it produces text, one piece at a time.
- **Pre-trained:** it first learns from a huge amount of general text before being used for anything specific.
- **Transformer:** the type of neural network underneath.

The transformer came from a 2017 Google paper called *Attention Is All You Need*. Its key idea, **attention**, lets every word in a sentence look at every other word and decide which ones matter for understanding it. In "The cat sat on the mat because it was tired," attention is what helps the model link "it" to "the cat." Older models read text strictly left to right and struggled with long-range connections like this. Transformers handle them well and can be trained in parallel on GPUs, which turns out to matter a lot.

## GPT-1 (June 2018): pretrain, then adapt

OpenAI's first GPT paper was titled *Improving Language Understanding by Generative Pre-Training*. Back then, the usual approach was to build a separate model for each task (one for sentiment, one for question answering) trained on labelled data, which is expensive to collect.

GPT-1 proposed a two-step recipe:

1. **Pretrain** a transformer on lots of unlabelled text with one job: predict the next word. They used a dataset of around 7,000 unpublished books.
2. **Fine-tune** it on a small labelled dataset for each specific task.

The model had about **117 million parameters** (the adjustable numbers it learns). Tiny by today's standards. But the lesson was big: a model that learns general language first needs much less task-specific data later. That "pretrain first, adapt later" idea became the template for almost everything that followed.

## GPT-2 (February 2019): "too dangerous to release"

GPT-2 kept the same idea and scaled it up: **1.5 billion parameters**, trained on about 40 GB of web text (pages linked from Reddit posts with some upvotes, a clever way to filter for quality).

Two things stood out:

- **It wrote coherent text.** Give it a fake news opening, and it would continue with paragraphs that sounded plausible.
- **It could do tasks without fine-tuning.** Ask it to translate or summarise with the right prompt, and it would try, even though nobody trained it for that specifically.

OpenAI initially released only smaller versions, worried about misuse like spam and fake news, and released the full model in stages through the year. Some people called it hype. Looking back, it was the first time a language model became a public debate, not just a research result.

## GPT-3 (2020): learning from the prompt

GPT-3 jumped to **175 billion parameters**, trained on hundreds of billions of words from the web, books, and Wikipedia. The paper's title says it all: *Language Models are Few-Shot Learners.*

What I found most interesting here is **in-context learning**. You could write a few examples directly in the prompt:

```
sea otter => loutre de mer
cheese => fromage
peppermint =>
```

and GPT-3 would continue with "menthe poivrée." No retraining, no new data. It figured out the task from the pattern in the prompt. Nobody explicitly designed this ability. It appeared as the model got bigger, and it was weak or absent in the smaller versions.

GPT-3 was offered through an API, and a lot of early AI startups were built on it. A version fine-tuned on code, called Codex, became the engine behind GitHub Copilot.

## The missing step: making it helpful (2022)

Raw GPT-3 was powerful but awkward. It would continue your text rather than follow your instructions. In early 2022, OpenAI published **InstructGPT**, trained with human feedback to follow instructions. A striking result from that paper: people preferred answers from a 1.3 billion parameter InstructGPT model over the original 175 billion parameter GPT-3. Size isn't everything; alignment with what people actually want matters a lot.

That same recipe, applied to a GPT-3.5 model with a chat interface, became ChatGPT in November 2022.

## GPT-4 (March 2023): more reliable, and it can see

GPT-4 brings two big changes:

- **Much stronger reasoning.** OpenAI reports it scores around the top 10% of test takers on a simulated bar exam, where GPT-3.5 was around the bottom 10%.
- **Image input.** It can take a picture along with text, such as a chart, a photo, or a hand-drawn sketch, and reason about it. This isn't widely available yet, but the demos are impressive.

It is also better at following instructions and less likely to make things up, though it still does. It can handle much longer inputs too, up to around 32,000 tokens in one version.

Something new this time: OpenAI's technical report doesn't reveal the model's size, data, or training methods, citing competition and safety. That alone tells you how much the field has changed since 2018, when the whole recipe was in the paper.

## The real story is scaling

The training objective barely changed from GPT-1 to GPT-4: predict the next token. What changed was the amount of data, the number of parameters, and the compute behind it.

| Model | Year | Parameters |
|---|---|---|
| GPT-1 | 2018 | 117 million |
| GPT-2 | 2019 | 1.5 billion |
| GPT-3 | 2020 | 175 billion |
| GPT-4 | 2023 | not disclosed |

In 2020, OpenAI researchers also published **scaling laws**: the model's error drops smoothly and predictably as you increase model size, data, and compute. That gave labs the confidence to spend huge amounts on training bigger models.

As a physicist, I find this surprising. You'd expect such a simple objective to hit a wall. Instead, new abilities keep showing up as the scale grows. I loved going back through these papers because each one looks modest on its own, and only together do you see the curve.

It makes me want to understand *why* it works, not just that it does.
