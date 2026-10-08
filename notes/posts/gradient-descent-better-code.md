---
title: Gradient descent can write better code than you
date: 2025-01-08
tags: [AI]
summary: In 2017, Andrej Karpathy joked that gradient descent writes better code than us. Seven years later, it doesn't feel like much of a joke.
---

In August 2017, Andrej Karpathy, then director of AI at Tesla, tweeted: *"Gradient descent can write code better than you. I'm sorry."*

At the time it read like a joke from someone deep in the neural network world. Going into 2025, after watching what coding models did last year, I keep coming back to it. Here's what he meant, and how true it has turned out to be.

## First, what is gradient descent?

Gradient descent is how neural networks learn. Picture standing somewhere on a hilly landscape in thick fog. You want to reach the lowest point, but you can only feel the slope under your feet. So you take a small step downhill, feel the slope again, take another step, and repeat thousands of times.

In a neural network, the "landscape" is how wrong the model is (its error), and your position is the setting of all its parameters, often millions or billions of numbers. Every step nudges all of them slightly in the direction that reduces the error. Nobody tells the network *how* to solve the problem. It finds its own way downhill.

## Software 2.0

A few months after the tweet, Karpathy expanded the idea in an essay called **Software 2.0**. His argument went like this:

- **Software 1.0** is the code we all know. A human writes explicit instructions: if this, do that; loop over these; call this function.
- **Software 2.0** is a neural network's weights. You don't write them. You collect a dataset, define what "good" looks like, and let gradient descent search for a program that does it.

For many problems, Software 2.0 wins easily. Try writing rules by hand for recognising a cat in a photo: pointy ears, whiskers, fur... and then a cat sits in a strange pose, or the lighting is odd, and your rules fall apart. A trained network handles this far better than any handwritten code ever did.

He gave real examples: speech recognition, image recognition, and machine translation all moved from handwritten rules and features to trained networks, and got much better. Google Translate's switch to a neural system in 2016 is a famous case.

## What I loved about this idea

It flips what programming means. Instead of writing the solution, you write down what a good solution looks like (the data, the goal, and how you'll measure success) and let the optimiser find the solution.

As someone who has spent years tuning parameters in physics code by hand, that framing really landed for me. The skill shifts from "can you write the algorithm?" to "can you define the problem and evaluate the answer well?"

## Now it writes the 1.0 code too

The twist Karpathy may not have fully expected is that Software 2.0 now writes Software 1.0. Models trained with gradient descent generate ordinary Python, JavaScript, and SQL that humans can read and run.

Here's roughly how that happened:

**2021: GitHub Copilot.** Built on OpenAI's Codex, a GPT model trained on public code. It sits in your editor and suggests the next line or a whole function as you type. GitHub's own experiment found developers completed a task about 55% faster with it.

**2022 to 2023: chat models.** ChatGPT, then GPT-4 and Claude, could write, explain, and debug code from a plain-language description. DeepMind's AlphaCode showed models could compete in programming contests at roughly the level of an average human competitor.

**2024: whole projects.** Models started editing entire codebases: reading many files, making changes across them, running tests, and fixing their own mistakes. On SWE-bench, which tests models on real GitHub issues, the best scores went from low single digits at the start of the year to solving around half the problems by the end.

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

Karpathy was early. Looking back, "I'm sorry" might have been the most accurate part of the tweet.
