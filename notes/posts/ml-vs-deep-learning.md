---
title: How machine learning and deep learning are different
date: 2025-03-05
tags: [AI]
summary: Not "deep learning is ML with neural networks," but why. A first-principles look at what each one is really doing, and why the difference comes down to who builds the representation.
related: [gradient-descent-better-code, maths-physics-inside-llms, what-is-rag]
---

The usual answer to this question is a diagram of circles: deep learning sits inside machine learning, which sits inside AI. That's true, but it never helped me understand anything. It tells you *where* deep learning sits, not *why* it behaves so differently.

So I tried to work it out from first principles, the way I'd approach a physics problem: strip it down to what learning actually is, and see where the two approaches split.

## What does "learning" mean, mathematically?

Every supervised learning problem has the same shape. You have inputs $x$ (an image, a row of customer data, a sound clip) and outputs $y$ (a label, a price, a yes/no). You believe there's some function connecting them:

$$y \approx f(x)$$

You don't know $f$. You only have examples. Learning means finding a function that matches the examples and, more importantly, works on new ones.

To do that, every learning method makes three choices:

1. **A family of possible functions** to search through (straight lines, decision trees, neural networks...).
2. **A way to measure error** (how wrong is a given function on the examples?).
3. **A way to search** for the function with the lowest error.

Machine learning and deep learning differ mostly in the first choice, and that one difference ripples through everything else.

## The key idea: representation

Here's a small example that, for me, explains the whole topic.

Imagine points scattered on a flat sheet. Points inside a circle are red; points outside are blue. You want a model that separates them.

If you describe each point by its coordinates $(x_1, x_2)$, a simple model that draws straight lines can't do it. No straight line separates the inside of a circle from the outside.

But change how you describe the points. Add one new quantity:

$$r^2 = x_1^2 + x_2^2$$

Now the problem is trivial: red if $r^2$ is less than some number, blue otherwise. The model didn't get smarter. The **description of the data** got better.

Physicists do this all the time. Choose the right coordinates and a nasty problem becomes simple. Planetary orbits are a mess in Cartesian coordinates and clean in polar ones.

In machine learning, this description is called the **representation**, or the **features**. And this is the real dividing line:

- **In classic machine learning, a human usually designs the representation.** The model learns a fairly simple function on top of it.
- **In deep learning, the model learns the representation itself,** along with the function on top.

## Classic machine learning: you build the features

Say you're predicting whether a customer will repay a loan. A data scientist would think about what actually matters and build features: debt divided by income, number of late payments in the past year, length of credit history, change in balance over six months.

Then a model like logistic regression, a decision tree, or gradient-boosted trees learns how to combine those features into a prediction.

Why this works well:

- **The search is easy.** For logistic regression, the error landscape is a single smooth bowl (it's convex), so there's exactly one best answer and you're guaranteed to find it.
- **It needs less data.** The human has already done much of the thinking through the features, so the model has less to figure out.
- **It's explainable.** You can see which features mattered and by how much.

The weakness: the model can only be as good as the features someone thought of. If the important pattern is something no one thought to compute, the model will never see it.

## Deep learning: the model builds the features

A neural network is a chain of simple steps. Each layer takes numbers in, multiplies them by weights, adds them up, and passes them through a simple bend (a non-linear function). Stack many layers and the output of each becomes the input of the next:

$$f(x) = f_L\big(\cdots f_2(f_1(x))\big)$$

Each layer re-describes the data a little. Train the whole chain together, and the early layers learn to build whatever representation makes the final step easy.

In the circle example, a small network would essentially discover something like $r^2$ by itself. Nobody tells it to.

In images, this is very visible. Inspect a trained network and you find:

- early layers responding to edges and colour changes,
- middle layers responding to textures and simple shapes,
- deeper layers responding to eyes, wheels, or letters.

Nobody programmed edges or eyes. They emerged because they were useful for reducing the error.

## Why depth, specifically?

Why many layers instead of one very wide one? Two reasons.

**The world is built from parts.** A face is made of eyes and a mouth, which are made of curves, which are made of edges. A sentence is made of phrases, which are made of words. Stacking layers matches this structure: each layer builds on the pieces found by the one before. A single layer would have to learn every combination directly, which needs vastly more units.

**Composition is powerful.** Each layer can bend and fold the data space. Folding a sheet of paper a few times creates many creases; folding it many times creates exponentially more. In the same way, a deep network can represent very complicated functions with far fewer parameters than a shallow one.

## The price: data, compute, and a harder search

Learning the representation yourself isn't free.

**It needs more data.** A model searching through a much bigger family of functions needs more examples to pin down the right one. With little data, a flexible model memorises the examples instead of learning the pattern (overfitting).

**It needs more compute.** Millions or billions of weights, adjusted again and again by gradient descent. This is why deep learning only took off once GPUs made it practical, around 2012, when the AlexNet network won the ImageNet image competition by a huge margin.

**The search is harder.** The error landscape is no longer a single smooth bowl. It's full of hills and valleys, and gradient descent gives no guarantee of finding the best point. In practice it works surprisingly well, and why it works so well is still an active research question.

**It's harder to explain.** The learned features are spread across thousands of numbers rather than named columns like "debt-to-income."

## So when does each one win?

Once you see the difference as "who builds the representation," the practical rules follow naturally.

**Raw, high-dimensional, structured data like images, sound, and text: deep learning wins.** A small photo has hundreds of thousands of pixel values, and no human can hand-design features for "is there a dog in this photo" that hold up across angles, lighting, and breeds. The representation is the hard part, so you want the model to learn it.

**Tables with meaningful columns: classic ML often wins.** In a spreadsheet, each column already means something (age, income, balance), so much of the representation work is already done. Here, gradient-boosted trees still often match or beat neural networks. A 2022 study by Grinsztajn and colleagues looked into why, and found a few reasons: tables often contain irrelevant columns that trees simply ignore, and the patterns in tabular data are often irregular and step-like, which trees capture naturally while neural networks tend to prefer smooth functions.

Credit scoring, which I worked on in one of my projects, is a good example of the second case: tree-based models with sensible features are the natural starting point, and they're easier to explain to the people who have to act on the decisions.

## Side by side

| | Classic machine learning | Deep learning |
|---|---|---|
| Who builds the representation | Mostly the human | The model learns it |
| Function family | Simpler (lines, trees, ensembles) | Very flexible (deep layered networks) |
| Search | Often easy, sometimes guaranteed | Harder, no guarantees, works well in practice |
| Data needed | Can work with hundreds to thousands of rows | Usually much more |
| Compute | A laptop CPU is often enough | Often needs GPUs |
| Best on | Tables with meaningful columns | Images, audio, text, raw signals |
| Explaining decisions | Usually easier | Usually harder |

## The one-line version

Classic machine learning is mostly about **learning a decision on top of a description that humans designed**. Deep learning is about **learning the description too**.

Everything else, more data, more compute, harder training, less transparency, and better results on raw signals, follows from that single difference. Once I saw it that way, choosing between the two stopped feeling like following a rule and started feeling obvious.
