---
title: How AI labs actually train their models
date: 2025-01-26
tags: [AI, research]
summary: From raw web text to a helpful assistant: the stages every big lab goes through, and how OpenAI, Anthropic, Google, Meta, and DeepSeek each do it differently.
---

I use these models every day, and since part of my role involves training models, I wanted to go deeper than the usual "they read the internet" explanation. How do the big labs actually go from a pile of text to something like ChatGPT or Claude? Where do they spend their money, and where do they differ?

With DeepSeek-R1 out this week and everyone talking about it, it felt like the right time to write it down. The broad recipe is shared across labs. The interesting part is where each one puts its own spin on it.

## The big picture

Training a modern assistant happens in roughly four stages:

1. **Data:** collect and clean an enormous amount of text.
2. **Pretraining:** teach a model to predict the next token on all of it.
3. **Post-training:** turn that raw model into a helpful, safe assistant.
4. **Evaluation and safety testing:** check what it can do and what could go wrong before release.

Pretraining builds the **knowledge**. Post-training shapes the **behaviour**. Most people only see the last stage, but the first two are where most of the compute and cost go.

## Stage 1: data

Everything starts with data, and it's less glamorous than it sounds.

- **Sources:** public web pages (often from Common Crawl, a giant open archive of the web), books, Wikipedia, scientific papers, code from public repositories, and licensed datasets.
- **Cleaning:** removing spam, duplicate pages, broken text, and low-quality content. Labs also filter out personal information and harmful material.
- **Mixing:** deciding how much of each kind of data to include. More code tends to make models better at reasoning; more maths helps with maths.
- **Tokenising:** splitting text into tokens, small chunks of words that the model actually reads.

The scale is hard to picture. Meta's Llama 3 was trained on over 15 trillion tokens. What I found most interesting is how much labs say data quality matters. Removing junk and duplicates often helps as much as making the model bigger. From my own work I can relate: a clean dataset beats a clever model on bad data almost every time.

## Stage 2: pretraining

This is the expensive part. The model starts with random numbers as its parameters and reads through the data, predicting the next token over and over. Each wrong guess nudges billions of parameters slightly in the right direction using gradient descent.

- **Hardware:** thousands to tens of thousands of GPUs (or Google's TPUs) running in parallel for weeks or months. Llama 3's largest model used up to 16,000 Nvidia H100 GPUs.
- **Engineering:** at this scale, hardware fails regularly, so a lot of work goes into checkpoints, recovery, and splitting the model across many chips efficiently.
- **Planning:** labs use **scaling laws** to predict how good a model will be before training it, by running smaller experiments first. Nobody wants to discover a mistake after spending tens of millions of dollars.

The result is a **base model**. It knows an enormous amount, but it's not an assistant. Ask it a question, and it may continue with more questions, because that's what text on the internet often looks like. It's a brilliant autocomplete, not yet a helper.

## Stage 3: post-training

This is where the model gets its personality, its helpfulness, and its safety behaviour. It's also where labs differ the most.

### Supervised fine-tuning (SFT)

First, the model is trained on curated examples of good conversations: a prompt and an ideal response, written by people or carefully generated and filtered. This teaches the format of being an assistant, like answering the question, following instructions, and saying "I don't know."

### Preference tuning

Examples only go so far, because it's hard to write the perfect answer but much easier to say which of two answers is better. So:

1. The model writes several answers to the same prompt.
2. People (or another model) rank them.
3. The model is trained to produce more answers like the preferred ones.

The classic version is **RLHF** (reinforcement learning from human feedback): train a separate reward model to predict human preferences, then use reinforcement learning to push the language model towards high-reward answers. A simpler method from 2023, **DPO** (direct preference optimisation), skips the separate reward model and learns from the preference pairs directly. Many labs now use some mix of both.

### Reinforcement learning for reasoning

This is the newest and most exciting piece. Instead of only learning what humans *prefer*, models are trained with reinforcement learning on problems where the answer can be **checked automatically**: does the maths answer match? Does the code pass the tests?

The model tries, gets rewarded for correct answers, and gradually learns to work through problems step by step, check itself, and backtrack when stuck. This is what's behind OpenAI's o1 and o3, and DeepSeek's R1. I go into it more below.

## Stage 4: evaluation and safety

Before release, labs test models on benchmarks (maths, coding, knowledge, reasoning), but also on risks:

- **Red-teaming:** people deliberately try to make the model misbehave or give dangerous information.
- **Dangerous capability tests:** for example, could it meaningfully help with cyberattacks or biological weapons?
- **Model cards and system cards:** documents describing what was tested and what was found.

Anthropic, for example, has a Responsible Scaling Policy that ties how carefully a model must be handled to how capable it is. OpenAI publishes system cards with each major release.

## How the labs differ

**OpenAI** popularised RLHF with InstructGPT in 2022, which became the basis for ChatGPT. With **o1** (September 2024), they added large-scale reinforcement learning on reasoning. The model learns to "think" in a long hidden chain of thought before answering, and a key finding was that performance keeps improving the longer it's allowed to think. That's a new way of scaling: spend more compute when *answering*, not only when training.

**Anthropic** developed **Constitutional AI**. Instead of relying only on human ratings, the model is given a written set of principles (the "constitution"). It critiques and revises its own answers against them, and AI feedback based on those principles is used in preference training. I loved this idea because the values are written in plain language, so you can actually read what the model is being steered towards rather than guessing from thousands of individual ratings.

**Google DeepMind** trains Gemini to be **natively multimodal**: text, images, audio, and video are part of training from the start, rather than added later. They train on their own TPU chips, which gives them a big hardware advantage.

**Meta** releases the weights of its **Llama** models openly. Anyone can download them, fine-tune them, and run them on their own machines. A large share of the open-source AI world is built on Llama, and their technical papers are some of the most detailed public descriptions of how a frontier model is trained.

**DeepSeek** is the story of the month, and for good reason.

- **DeepSeek-V3** (December 2024) uses a **mixture-of-experts** design: the model has 671 billion parameters in total, but only about 37 billion are active for each token. Think of a team of specialists where only the relevant few work on each question. They reported the final training run took about 2.8 million GPU hours, roughly $5.6 million in compute. That doesn't include all the research and experiments before it, but it's still remarkably cheap for a model this strong.
- **DeepSeek-R1** (20 January 2025) is a reasoning model like o1, and they published how they built it. Their **R1-Zero** model was trained with pure reinforcement learning from the base model, without any supervised examples first. It learned to reason step by step, double-check, and even reconsider its approach mid-answer, just from being rewarded for correct answers. That surprised a lot of people, me included.
- They used an algorithm called **GRPO** (group relative policy optimisation). The model answers the same question several times, and each answer is scored relative to the group average. This avoids training a separate "critic" model, saving memory and compute.
- R1-Zero's answers were sometimes hard to read or mixed languages, so the final R1 added a small amount of supervised data first, then more rounds of RL and fine-tuning.
- They also **distilled** R1's reasoning into much smaller open models, which then reason far better than their size suggests.

## Ingredients everyone uses

- **Synthetic data:** strong models generate training examples for other models, which are then filtered for quality. This is now a huge part of post-training.
- **Distillation:** a large "teacher" model trains a smaller, cheaper "student" model to mimic it.
- **Evaluation-driven development:** labs build internal tests for every capability they care about and train against them, which is probably the least visible but most important habit.

## A caveat

Most of the details are secret, especially at OpenAI, Anthropic, and Google. Papers and model cards describe the outline, not the full recipe. DeepSeek and Meta share much more. So treat this as the shape of the process, not a blueprint.

## What I took away

Underneath all the different techniques is one idea in different forms: **define what "better" means, measure it, and optimise towards it**. Next-token prediction, human preferences, written principles, and verifiable rewards are all just different ways of defining "better."

For my own work, the lesson is that the hard part is rarely the training loop itself. It's the data, the definition of success, and the evaluation. That's true whether you're training a 600 billion parameter model or a small one on a laptop.
