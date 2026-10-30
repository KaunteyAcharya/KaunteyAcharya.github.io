---
title: Gradient descent can write better code than you: Karpathy's Software 2.0, explained
date: 2025-01-08
updated: 2026-10-29
tags: [AI]
summary: In 2017 Andrej Karpathy tweeted that gradient descent can write code better than you, then made the case in his Software 2.0 essay. What he meant, what the essay says, and how true it looks now.
related: [ml-vs-deep-learning, how-labs-train-ai-models, ai-benchmarks]
---

On 4 August 2017, Andrej Karpathy, then director of AI at Tesla, [tweeted](https://x.com/karpathy/status/893576281375219712): *"Gradient descent can write code better than you. I'm sorry."*

What he meant, in short: for problems like recognising images or speech, you get a better program by collecting examples and letting an optimisation algorithm (gradient descent) tune the numbers inside a neural network than by writing the rules yourself. Three months later he made the full argument in an essay called [Software 2.0](https://karpathy.medium.com/software-2-0-a64152b37c35).

At the time the tweet read like a joke from someone deep in the neural network world. Going into 2025, after watching what coding models did last year, I keep coming back to it. Here's what he meant, what the essay actually says, and how true it has turned out to be.

## First, what is gradient descent?

Gradient descent is how neural networks learn. Picture standing somewhere on a hilly landscape in thick fog. You want to reach the lowest point, but you can only feel the slope under your feet. So you take a small step downhill, feel the slope again, take another step, and repeat thousands of times.

In a neural network, the "landscape" is how wrong the model is (its error), and your position is the setting of all its parameters, often millions or billions of numbers. Every step nudges all of them slightly in the direction that reduces the error. Nobody tells the network *how* to solve the problem. It finds its own way downhill.

## What the Software 2.0 essay says

Karpathy published [Software 2.0](https://karpathy.medium.com/software-2-0-a64152b37c35) on Medium on 11 November 2017. The core idea fits in two of his own lines:

- **Software 1.0:** "Software 1.0 is code we write." A human writes explicit instructions: if this, do that; loop over these; call this function.
- **Software 2.0:** "Software 2.0 is code written by the optimization based on an evaluation criterion". In practice, that code is a neural network's weights. You don't write them. You collect a dataset, define what "good" looks like, and let gradient descent search for a program that does it.

For many problems, Software 2.0 wins easily. Try writing rules by hand for recognising a cat in a photo: pointy ears, whiskers, fur... and then a cat sits in a strange pose, or the lighting is odd, and your rules fall apart. A trained network handles this far better than any handwritten code ever did.

He listed the areas where this switch was already happening: visual recognition, speech recognition, speech synthesis, machine translation, games, and databases. In each one, handwritten rules and features were giving way to trained networks. Google Translate's move to a neural system in 2016 is a well-known example from machine translation.

He also listed reasons to prefer the 2.0 way. Neural networks are computationally homogeneous (built from a small set of operations, mostly matrix multiplications), simple to bake into silicon, and have constant running time and constant memory use. They are highly portable and very agile, and separately trained modules can meld into an optimal whole. The last item on his list is the tweet again: "It is better than you." His reasoning: "the optimization can find much better code than what a human can write."

## Where Software 2.0 falls short

The essay is just as clear about the costs. When a trained network works, "it's very hard to tell how". These systems "can fail in unintuitive and embarrassing ways", and the existence of adversarial examples (inputs crafted to fool a model) "highlights the unintuitive nature of this stack."

It also changes what programming work looks like. In the 2.0 stack, Karpathy wrote, most of the active "software development" consists of "curating, growing, massaging and cleaning labeled datasets." The data becomes the source code.

## What I loved about this idea

It flips what programming means. Instead of writing the solution, you write down what a good solution looks like (the data, the goal, and how you'll measure success) and let the optimiser find the solution.

As someone who has spent years tuning parameters in physics code by hand, that framing really landed for me. The skill shifts from "can you write the algorithm?" to "can you define the problem and evaluate the answer well?"

## Now it writes the 1.0 code too

Here is the twist: Software 2.0 now writes Software 1.0. Models trained with gradient descent generate ordinary Python, JavaScript, and SQL that humans can read and run.

Here's roughly how that happened:

**2021: GitHub Copilot.** Built on OpenAI's Codex, a GPT model trained on public code. It sits in your editor and suggests the next line or a whole function as you type. GitHub's own experiment found developers completed a task about 55% faster with it.

**2022 to 2023: chat models.** ChatGPT, then GPT-4 and Claude, could write, explain, and debug code from a plain-language description. DeepMind's AlphaCode showed models could compete in programming contests at roughly the level of an average human competitor.

**2024: whole projects.** Models started editing entire codebases: reading many files, making changes across them, running tests, and fixing their own mistakes. On SWE-bench, which tests models on real GitHub issues, the best scores went from low single digits at the start of the year to solving around half the problems by the end. (I explain how benchmarks like this are built, and where they mislead, in [How AI benchmarks are actually designed](notes/ai-benchmarks/).)

**December 2024: o3.** On 20 December, OpenAI announced o3, a model trained to reason step by step before answering. They reported:

- A **Codeforces rating around 2727.** Codeforces is a competitive programming site, and this rating would put it among the top couple of hundred human competitors in the world.
- **71.7% on SWE-bench Verified.**

It isn't publicly available yet, so these are OpenAI's own numbers. But even with some caution, the trend is hard to ignore.

## So is the tweet true?

For contest problems and well-defined tasks with clear right answers: increasingly, yes.

For real software, it's more complicated. Most of the work in a real project isn't typing code. It's figuring out *what* to build, understanding messy and changing requirements, making trade-offs, knowing the context nobody wrote down, and being responsible when something breaks. Models are very fast and know a huge amount. People still bring judgement and ownership.

There are also real risks: code that looks right but has subtle bugs, security holes, or depends on libraries that don't exist. Reviewing AI code carefully is now a core skill.

## How I actually use it

I let the model write the first draft, especially boilerplate, data cleaning scripts, and plotting code. Then I spend my time on the parts that matter: the design, the edge cases, testing, and checking whether it actually solves the problem.

My code has got better, not because I write more of it, but because I review more of it and think more about structure. In a way, I've become a bit of a Software 2.0 programmer myself: my job is defining the goal clearly and judging the result.
