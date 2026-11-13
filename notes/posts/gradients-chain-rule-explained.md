---
title: "What Is a Gradient? Loss, Slopes, and the Chain Rule"
date: 2026-11-10
tags: [AI, maths]
summary: "A model learns by measuring how wrong it is and nudging every number towards less wrong. This note builds that from nothing: what a loss function is, what a slope really measures, why the gradient points uphill, and how the chain rule prices a weight buried ten layers deep."
related: [neural-network-layer-explained, word-embeddings-explained, gradient-descent-better-code]
series: token-by-token
---

<div class="fs-series">
<p><strong>AI from Scratch, Token by Token</strong><br>Article 3</p>
<p>Follows on from <a href="notes/neural-network-layer-explained/">Article 2</a>, but reads on its own. You need school algebra and the idea of a graph. No calculus is assumed: the derivative is built here from scratch. Boxes marked "Try it" are interactive.</p>
</div>

Training a model is three questions asked in order. How wrong is it, as a single number? That number is the **loss**. If one weight were nudged up slightly, would the loss get better or worse, and by how much? That is a **derivative**. Collect one such answer for every weight in the model and you have the **gradient**, a vector pointing in the direction that makes the loss rise fastest, so the direction to step is the opposite one. The hard part is the third question, because a weight in the first layer reaches the loss only through everything that comes after it, and the tool for exactly that is the **chain rule**. This note builds all four pieces from nothing and works every number by hand.

## About this series

My background is in physics. I wanted to understand what AI is at the level of theory, and how every piece of it is built from the ground up. I have been learning it from textbooks, arXiv papers, lectures, and open-source repositories, and I asked AI tools when I had small doubts along the way. I am writing it down because it might help someone else on the same path.

The series follows a long guide I wrote on AI engineering, built on 44 core ideas, from how a word becomes numbers to how real AI products are tested, deployed, and kept safe. Each note covers one fundamental idea. It is written for anyone at the level of a class 11 student or above. Nothing is skipped with "it can be shown that", and every number is worked out as much as I can.

[I am learning this too, and I could have made a mistake. If you spot an inaccuracy, or want a separate, more detailed note on any part of this one, please write to me at [kaunteyacharya2000@gmail.com](mailto:kaunteyacharya2000@gmail.com) or on [LinkedIn](https://www.linkedin.com/in/kauntey-acharya).]

<details>
<summary>The eight parts of the series</summary>

1. **The language of learning** (ideas 1 to 6): vectors, matrices, gradients, probability, loss, and information. The maths every model is made of.
2. **The nature of learning** (7 to 12): what it means for a machine to learn, why models overfit, and how they generalise.
3. **The machinery** (13 to 16): neural networks, backpropagation, and how training actually runs.
4. **Transformers and LLMs** (17 to 25): tokens, attention, and how ChatGPT-style models are built and trained.
5. **Building with models** (26 to 31): prompting, retrieval (RAG), tools, and agents.
6. **Knowing if it works** (32 to 35): evaluation and testing.
7. **Running in the real world** (36 to 40): cost, speed, monitoring, and safety.
8. **The engineer** (41 to 44): how to think and decide like an AI engineer.

</details>

## The question

[Article 1](notes/word-embeddings-explained/) turned things into vectors. [Article 2](notes/neural-network-layer-explained/) showed what a machine can do with a vector: multiply it by a matrix, add a bias, bend the result, repeat. Together they describe the whole forward machinery of a neural network.

Both notes left the same thing undone, and said so. Every matrix in Article 2 was written down by hand, by me, chosen so that the arithmetic would land on a tidy number and make a point. A real model is not like that. GPT-2 small holds 124 million numbers and nobody picked a single one of them. [Article 2's Step 9](notes/neural-network-layer-explained/#step-9) put it precisely: a person chooses the architecture, which is the shapes of the matrices and how many layers there are, and the training algorithm chooses every individual number inside them.

So the question for this note is:

> A model starts with random numbers and gives nonsense answers. **How does it find better numbers?**

There is an obvious answer that does not work, and it is worth seeing why before building the one that does.

Change one weight slightly. Run the whole model again. Did the answer improve? Keep the change if so, undo it if not. Move to the next weight. That procedure is correct and it is hopeless, because it needs one full run of the model per weight. For GPT-2 small that is 124 million runs to learn one thing from one example, and a real model learns from billions of examples.

What is needed is a way to find out how every weight should change at once, for roughly the price of running the model twice. That is what the rest of this note builds.

## Frog's-eye view: building it from the ground up

Thirteen steps at ground level, one small idea at a time, every number worked out by hand. After that, the bird's-eye view follows one complete training step of a real model.

## Step 1: the loss function, wrongness as a single number

Nothing gets improved until it is measured, and here the measurement has to collapse to a single number. Not a page of diagnostics. One number, so that two versions of a model can be compared by asking which is smaller.

Take the smallest model that can be wrong. It has one weight $w$, it takes an input $x$, and it predicts

$$
p = wx
$$

The correct answer, which somebody has given us, is $y$. The gap between them is the **error**:

$$
e = p - y
$$

There are two problems with using $e$ directly as a score. It can be negative, so a prediction too high by 3 and one too low by 3 would cancel to zero across a dataset, which would read as perfect. And it treats a small miss and a large one in proportion, when in most applications a large miss is far worse than twice a small one.

Squaring fixes both. The **squared error** is

$$
\boxed{\ L = (p - y)^2\ }
$$

Negatives disappear, because a square is never negative. Large errors are punished disproportionately, because doubling the error quadruples the score. And zero is reachable only by being exactly right.

A number, to make it concrete. Put $w = 2$, $x = 3$, and $y = 5$:

$$
p = 2 \times 3 = 6, \qquad e = 6 - 5 = 1, \qquad L = 1^2 = 1
$$

The model predicted 6 when the answer was 5, and its loss is 1. Change the weight to $w = 1$ and you get $p = 3$, $e = -2$, $L = 4$, which is worse. Change it to $w = 5/3$ and you get $p = 5$, $e = 0$, $L = 0$, which is exactly right for this one example.

> **Definition.** A **loss function** turns a prediction and a correct answer into one non-negative number, smaller being better. Training is the business of making that number small.

The name carries the sign convention with it, which is worth noticing because it catches people out. A loss is a thing you want to *reduce*, so every arrow in training points downhill. Accuracy and F1 scores point the other way and are not losses.

Squared error is the right loss for predicting a quantity: a price, a temperature, a rating. It is the wrong one for predicting *which* of several things something is, where the model outputs probabilities and the natural score is **cross-entropy**, which asks how surprised the model was by the correct answer. That needs probability built properly first, so it is the subject of Article 4 and gets worked out there in this same detail.

If you have ever watched a language model train, the loss is the number scrolling past in the log. It is cross-entropy rather than squared error, and it starts in a place you can work out yourself. A model that has learned nothing spreads its guess evenly over the whole vocabulary, and for GPT-2's 50,257 tokens that gives a loss of $\ln 50{,}257 \approx 10.8$. Watching it come down from 10.8 is watching the model stop guessing at random. Where it ends up is the whole game, and a long way below that.

None of which changes anything here. Everything below needs only a loss that is one number with a slope, and squared error is the simplest thing that qualifies.

## Step 2: the loss landscape, wrongness as a function of the weights

Here is the move that makes everything else possible. Stop thinking of $L$ as a score attached to a prediction, and start thinking of it as a function of the weights.

The input $x = 3$ and the target $y = 5$ are given to us. They are not ours to change. The only thing we control is $w$. So write the loss with $w$ as its variable and everything else filled in:

$$
L(w) = (3w - 5)^2
$$

That is a parabola. At $w = 2$ it sits at 1. At $w = 1$ it sits at 4. At $w = 5/3$ it touches zero, and it rises on both sides of that point. Training this model means finding the bottom of this curve.

Now scale the picture up and keep the idea. A model with two weights has a loss depending on both, $L(w_1, w_2)$, which is a surface in three dimensions: a landscape whose height above any point is how wrong the model is with those two weights. **A model with 124 million weights has a loss surface in 124-million-dimensional space. It cannot be drawn and it does not need to be. The name for the whole picture is the loss landscape, and training is a search for a low point on it.**

<figure class="fs-fig"><svg viewBox="0 0 620 300" role="img" aria-label="A bowl drawn as five contour rings seen from an angle, with a dashed path of steps running from high on the rim down to the lowest point."><ellipse cx="310" cy="112" rx="255" ry="72" class="fg-line"/><ellipse cx="310" cy="142" rx="205" ry="58" class="fg-line"/><ellipse cx="310" cy="170" rx="152" ry="43" class="fg-line"/><ellipse cx="310" cy="194" rx="98" ry="28" class="fg-line"/><ellipse cx="310" cy="212" rx="46" ry="13" class="fg-line"/><path d="M 55 112 Q 150 205 310 220" class="fg-ax"/><path d="M 565 112 Q 470 205 310 220" class="fg-ax"/><polyline points="118,133 172,163 226,187 268,205 303,217" class="fg-hi fg-dash"/><circle cx="118" cy="133" r="3.5" class="fg-hit"/><circle cx="172" cy="163" r="3.5" class="fg-hit"/><circle cx="226" cy="187" r="3.5" class="fg-hit"/><circle cx="268" cy="205" r="3.5" class="fg-hit"/><circle cx="303" cy="217" r="6" class="fg-hit"/><circle cx="310" cy="220" r="3" class="fg-m"/><text x="58" y="100" font-size="12" class="fg-m">high loss</text><text x="562" y="100" font-size="12" text-anchor="end" class="fg-m">high loss</text><text x="326" y="238" font-size="12" class="fg-m">lowest loss</text><line x1="310" y1="258" x2="438" y2="280" class="fg-ax"/><line x1="310" y1="258" x2="182" y2="280" class="fg-ax"/><text x="444" y="286" font-size="11" class="fg-m">weight 1</text><text x="176" y="286" font-size="11" text-anchor="end" class="fg-m">weight 2</text><line x1="104" y1="238" x2="116" y2="142" class="fg-hi fg-dash"/><text x="52" y="252" font-size="12" class="fg-hit">you are here</text></svg><figcaption>The loss landscape for a model with two weights. The floor is every possible setting of the two weights, the height above it is how wrong the model is, and each ring joins the settings that are equally wrong. Training is the dashed path: you cannot see the bowl, only the slope under your feet, and you take one step down it at a time. A real model has this picture in 124 million dimensions instead of two.</figcaption></figure>

<div class="fs-widget" data-widget="lossdial">
<p class="fs-fallback"><strong>Try it.</strong> For the model p = wx with x = 3 and y = 5, the loss L(w) = (3w &minus; 5)<sup>2</sup> is a parabola. At w = 2 the loss is 1, at w = 1 it is 4, at w = 3 it is 16, and it reaches zero only at w = 5/3 &approx; 1.667.</p>
</div>

With one dial you could find the bottom by trying values, and with two you could still manage. The reason that stops working is not subtlety, it is counting. Suppose you tried ten settings of each weight and checked every combination. Two weights would need 100 runs of the model. Ten weights would need ten billion. There are not enough seconds left in the universe to do this for 124 million weights, and the method has already failed long before a thousand.

Worth saying that this landscape is not a teaching metaphor that gets left behind. Labs publish pictures of it and lose weeks to its terrain. Google reported that while training PaLM the loss spiked upward about twenty times, and the fix each time was to rewind to a checkpoint from a few hundred steps earlier and skip the batches that had caused it ([Chowdhery and colleagues, 2022](https://arxiv.org/abs/2204.02311)). Meta kept a public logbook while training OPT-175B that reads like a diary of a difficult voyage, with the loss diverging, hardware dying, and the run restarted from earlier checkpoints dozens of times ([Zhang and colleagues, 2022](https://arxiv.org/abs/2205.01068)). Those are people navigating a surface they cannot see.

> **Key idea.** Searching the landscape is impossible. The only affordable question is a local one: standing where we are, which way is downhill?

This is where the fog comes in, and it is the image to hold for the whole note. You are standing on a hillside at night in thick fog. You cannot see the valley. You cannot see ten metres. What you *can* do is feel the ground under your feet and tell which way it slopes. That is enough to take one step downhill, and if you repeat it you will end up somewhere low without ever having seen the landscape.

The whole of training is that, repeated. The rest of this note is about how a machine feels the ground.

## Step 3: the derivative, what a slope actually is

You probably already know the name of the thing we need here. Build it anyway, because everything that follows in this note is this one idea applied over and over.

Take any function $f(x)$. Move the input by a small amount $h$, from $x$ to $x + h$. The output moves from $f(x)$ to $f(x + h)$. The rate at which the output moved, per unit of input, is

$$
\frac{f(x + h) - f(x)}{h}
$$

which is rise over run: the slope of the straight line joining two points on the graph. That line is called a secant, and its slope depends on how big $h$ is. Shrink $h$ and the two points slide together, the secant pivots, and it settles on the line that just grazes the curve at $x$. That limit is the **derivative**:

$$
\boxed{\ f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}\ }
$$

Read it as a sensitivity. It answers "if I nudge the input by one unit, how far does the output move?", with the caveat that the answer is exactly right only for nudges that are vanishingly small.

Watch the secant collapse onto the tangent in the figure, and notice how quickly the two agree.

<div class="fs-widget" data-widget="slope">
<p class="fs-fallback"><strong>Try it.</strong> For f(x) = x<sup>2</sup> at x = 3, the secant through (3, 9) and (3 + h, (3 + h)<sup>2</sup>) has slope 6 + h exactly. At h = 1 that is 7, at h = 0.1 it is 6.1, and at h = 0.001 it is 6.001. The limit as h shrinks to nothing is 6, which is the slope of the tangent at x = 3.</p>
</div>

Rearranging the definition gives the form that gets used constantly:

$$
\boxed{\ f(x + h) \approx f(x) + f'(x)\,h\ }
$$

In words: **near any point, a smooth curve is a straight line.** Zoom in far enough on any graph with no corner in it and what you see cannot be told apart from a straight line, and the derivative is that line's slope. This approximation is not a shortcut or a simplification. It is the entire content of the derivative.

Test it. Take $f(x) = x^2$, whose derivative is $f'(x) = 2x$, so $f'(3) = 6$. Predict the value at $x = 3.001$ using nothing but the straight line:

$$
f(3) + f'(3)(0.001) = 9 + 6(0.001) = 9.006
$$

The true value is $3.001^2 = 9.006001$. The straight line was wrong by one millionth. For a nudge ten times smaller it would be wrong by a hundredth of that, because the error in this approximation shrinks with the *square* of the step.

## Step 4: local derivatives, the slopes you actually need

The derivative was defined by a limit. Nobody computes limits in practice. A handful of rules covers everything in a neural network, and each deserves a line of justification rather than a proof.

| Operation | Derivative | Why, in one line |
|---|---|---|
| $z = c$ (a constant) | $0$ | Nothing moves when the input moves. |
| $z = x$ | $1$ | The output copies the input exactly. |
| $z = cx$ | $c$ | Scaling the input scales the change by the same factor. |
| $z = x^2$ | $2x$ | $(x+h)^2 = x^2 + 2xh + h^2$, and $h^2$ vanishes faster than $h$. |
| $z = x + y$ | $1$ for each | One unit added to either input adds exactly one unit to the sum. |
| $z = xy$ | $y$ and $x$ | Nudging $x$ moves the product by $y$ times as much. |
| $z = \operatorname{ReLU}(x)$ | $1$ if $x > 0$, else $0$ | A 45-degree line on the right, flat on the left. |
| $z = \sigma(x)$ | $\sigma(x)\,(1 - \sigma(x))$ | Worth memorising; Step 12 uses it. |

Three of those carry the weight later and deserve a closer look.

**The product rule, informally.** If $z = xy$ and $x$ moves by $h$, the product becomes $(x+h)y = xy + hy$, so it moved by $hy$ and the rate is $y$. The slope with respect to one factor is the other factor. This is the reason that the gradient on a weight always comes out multiplied by the input it was applied to. A weight's influence is proportional to the size of the thing it was multiplying, which is also why unnormalised inputs produce wildly uneven gradients.

**ReLU.** On the positive side it is the line $z = x$, slope exactly 1. On the negative side it is the constant 0, slope exactly 0. At the origin there is a corner and no single slope exists, which libraries settle by picking 0 by convention; it changes nothing in practice, because an input of exactly zero essentially never happens. The important part is the pair of values, 1 and 0. A ReLU either passes a change through untouched or stops it dead, depending which side it is on.

<figure class="fs-fig"><svg viewBox="0 0 620 234" role="img" aria-label="Two panels. On the left, ReLU is flat at zero for negative input and a 45-degree line for positive input. On the right, its slope is a flat zero on the left and a flat one on the right, with a jump at the origin."><text x="24" y="26" font-size="12">ReLU(z) = max(0, z)</text><line x1="40" y1="178" x2="292" y2="178" class="fg-ax"/><line x1="166" y1="44" x2="166" y2="196" class="fg-ax"/><polyline points="46,178 166,178 286,58" class="fg-curve"/><text x="84" y="170" font-size="11" class="fg-m">slope 0</text><text x="182" y="116" font-size="11" class="fg-m">slope 1</text><text x="160" y="196" font-size="11" class="fg-m">0</text><line x1="310" y1="20" x2="310" y2="214" class="fg-line"/><text x="334" y="26" font-size="12">its slope, at every z</text><line x1="350" y1="178" x2="602" y2="178" class="fg-ax"/><line x1="476" y1="44" x2="476" y2="196" class="fg-ax"/><line x1="356" y1="178" x2="474" y2="178" class="fg-hi"/><line x1="478" y1="98" x2="596" y2="98" class="fg-hi"/><line x1="476" y1="178" x2="476" y2="98" class="fg-hi fg-dash"/><circle cx="540" cy="98" r="4" class="fg-hit"/><circle cx="416" cy="178" r="4" class="fg-hit"/><text x="600" y="94" font-size="11" text-anchor="end" class="fg-m">1</text><text x="360" y="196" font-size="11" class="fg-m">0</text><text x="356" y="214" font-size="11" class="fg-m">blocked</text><text x="596" y="214" font-size="11" text-anchor="end" class="fg-m">passes through</text></svg><figcaption>The whole of ReLU as far as training is concerned is the right-hand panel: two values, nothing in between. For a unit whose input is positive, the slope is exactly 1, so whatever gradient arrives from above is handed on untouched. For a unit whose input is negative it is exactly 0, and the gradient stops there. Step 12 is about what each of those two numbers does once the chain rule starts multiplying them together.</figcaption></figure>

**The sum rule.** If $z = x + y$ then nudging $x$ by $h$ moves $z$ by $h$, so the derivative is 1, and the same holds for $y$. Addition passes sensitivity through unchanged to both inputs. A bias is an addition, which is why a bias's gradient turns out to be whatever gradient arrived from above, with nothing done to it.

That table is the whole toolkit. Every derivative in the rest of this note is one of those eight rules, or several of them combined by the method of Step 8.

## Step 5: gradient descent, one weight and one step downhill

Enough to train something. The model is $p = wx$, the loss is $L = (p - y)^2$, and with $x = 3$ and $y = 5$ fixed that is

$$
L(w) = (3w - 5)^2
$$

Multiply that out and it is $9w^2 - 30w + 25$, and the rules from Step 4 handle it one term at a time to give a slope of $18w - 30$. At $w = 2$ that is **6**.

The arithmetic is the boring part. What matters is learning to read a 6.

**The sign says which way.** It is positive, which means increasing $w$ increases the loss. To reduce the loss, decrease $w$. We happen to know the answer is $5/3 \approx 1.667$, which is indeed below 2, so the slope pointed the right way.

**The size says how much.** A gradient of 6 means that near $w = 2$, each unit of increase in $w$ costs about 6 units of loss. A gradient of 0.001 would mean this weight barely matters here and is not worth moving far. A gradient of 600 would mean the loss is extremely sensitive and a large step would be reckless.

So the update rule writes itself. Step against the slope, by an amount proportional to it:

$$
\boxed{\ w_{\text{new}} = w - \eta \, \frac{\mathrm{d}L}{\mathrm{d}w}\ }
$$

The number $\eta$ is the **learning rate**, and it is the one quantity here that a person chooses. It converts a slope into a distance. Take $\eta = 0.05$ and run three steps by hand:

| Step | $w$ | $\mathrm{d}L/\mathrm{d}w = 18w - 30$ | $L = (3w-5)^2$ |
|---|---|---|---|
| start | $2$ | $6$ | $1$ |
| 1 | $2 - 0.05(6) = 1.7$ | $0.6$ | $0.01$ |
| 2 | $1.7 - 0.05(0.6) = 1.67$ | $0.06$ | $0.0001$ |
| 3 | $1.67 - 0.05(0.06) = 1.667$ | $0.006$ | $0.000001$ |

The loss fell from 1 to one millionth in three steps, and the weight walked to $5/3$ without anyone telling it where $5/3$ was. That is learning, complete, on the smallest possible model.

Notice also that the steps got smaller on their own. As the weight nears the bottom the slope flattens, so the update shrinks. Nothing schedules that; it falls out of the rule.

### The learning rate is the one dangerous number

Change $\eta$ to 0.1 and the same three steps go $2 \to 1.4 \to 1.88 \to 1.496$. The weight now overshoots the bottom and lands on the far side each time, bouncing across the valley. It is still improving, since the loss goes $1 \to 0.64 \to 0.4096 \to 0.262$, but it is taking a zigzag path instead of walking straight in.

Change $\eta$ to 0.2 and it breaks. The first step gives $w = 2 - 0.2(6) = 0.8$, where the loss is $(2.4 - 5)^2 = 6.76$, nearly seven times worse than where it started. The next step is worse again, and the weight runs away to infinity.

The boundary for this particular parabola sits at $\eta = 1/9 \approx 0.111$, and the reason is visible in the gradient formula. Each step multiplies the distance from the bottom by $1 - 18\eta$, so the distance shrinks only while that factor is smaller than 1 in size, which needs $\eta < 2/18$. Below it, convergence. Above it, divergence. Exactly at it, the weight hops between two points forever.

This is the first appearance of something that recurs throughout training. The gradient tells you the direction with complete confidence and tells you nothing at all about how far to go, because it only describes the landscape at the point you are standing on. Choosing the step length is a separate problem, and it is the subject of Article 5 on optimisation.

The numbers 0.05, 0.1, and 0.2 are made up for a parabola. Real ones are far smaller, and the pattern across labs is consistent enough to be worth knowing. GPT-3's 175-billion-parameter model used a peak learning rate of 0.00006, while its smallest 125-million-parameter model used ten times that, 0.0006 ([Brown and colleagues, 2020](https://arxiv.org/abs/2005.14165)). Llama 2's 70-billion model used 0.00015 ([Touvron and colleagues, 2023](https://arxiv.org/abs/2307.09288)). Bigger model, smaller steps, every time.

Real runs also do not start at the peak. They ramp up over the first few thousand steps, which is called **warmup**, because a freshly initialised model is in a part of the landscape where the gradients are large and badly behaved, and the opening steps are exactly where a run is most likely to blow up in the way the $\eta = 0.2$ case does above. Nobody derives any of these numbers from theory. They come from small test runs and from each other's published tables, because finding out the hard way that a frontier run diverges costs millions of pounds of compute.

<div class="fs-widget" data-widget="descent">
<p class="fs-fallback"><strong>Try it.</strong> Gradient descent on L(w) = (3w &minus; 5)<sup>2</sup> from w = 2. With a learning rate of 0.05 the weight goes 2, 1.7, 1.67, 1.667 and the loss goes 1, 0.01, 0.0001, 0.000001. With 0.1 it overshoots each time and zigzags: 2, 1.4, 1.88, 1.496. With 0.2 it diverges: 2, 0.8, &minus;1.36, and away.</p>
</div>

## Step 6: the gradient, one partial derivative per weight

Real models have more than one dial, and the step up is smaller than it sounds.

Picture a mixing desk. A hundred faders, and one meter above them reading how bad the mix sounds. Nudge fader 7 by a millimetre, hold every other fader dead still, and watch the meter: the change in badness per millimetre of fader 7 is everything you can learn about fader 7 from where you are standing. That quantity has a name, the **partial derivative**, written $\partial L / \partial w_7$ with a curly $\partial$ to signal that the others were held fixed. It is the same slope from Step 3, measured in a world where only one thing is allowed to move.

Now do it for all hundred faders and write the hundred numbers on a card. The card is the point. One fader at a time is the useless method from the top of this note; a card telling you how to move all hundred at once is a different thing entirely.

$$
\boxed{\ \nabla L = \left[\frac{\partial L}{\partial w_1}, \frac{\partial L}{\partial w_2}, \ldots, \frac{\partial L}{\partial w_n}\right]\ }
$$

That vector is the **gradient**, written $\nabla L$ and read "grad L". It has exactly as many components as the model has weights: 124 million of them for GPT-2 small, 405 billion for the largest Llama 3. It is an object of the kind [Article 1](notes/word-embeddings-explained/) built, living in the same space as the weights themselves.

That shape has a bill attached, worth seeing now rather than being surprised by later. A gradient is the same size as the model. Holding one means holding a second complete copy of every weight in memory, and the optimiser of Article 5 keeps two more copies on top of that. It is why a model you can happily run on a given graphics card may be impossible to train on it: inference needs the weights once, training needs them several times over.

A worked one, small enough to see. For the bowl $f(x,y) = x^2 + 3y^2$, holding $y$ still leaves $x^2$, whose slope is $2x$, and holding $x$ still leaves $3y^2$, whose slope is $6y$. So $\nabla f = (2x, 6y)$, and at the point $(1,1)$ that is $(2, 6)$.

Read the pair rather than the formula. The point sits symmetrically between the two axes, yet the surface is three times more sensitive to $y$ than to $x$, because the 3 steepens the bowl in that direction. Real weights are like this and far more lopsided: a few of them change the output enormously and most of them hardly at all, and the gradient reports that whole spread in its own shape.

One trap the mixing-desk picture can set. A gradient like $(+5, -2, 0, +0.1)$ does not mean "turn everything down". It means the loss climbs steeply as the first weight rises, *falls* as the second rises, is indifferent to the third, and creeps up with the fourth. Stepping against it pulls the first weight down, pushes the second **up**, leaves the third alone, and barely touches the fourth. Every weight moves in its own direction by its own amount, in one coordinated move.

## Step 7: steepest descent, why the gradient points uphill

So far the gradient is a bucket of partial derivatives, one per weight. Nothing about a bucket says it should have a direction, let alone the single most useful direction on the landscape. Here is why it does, in three lines, using [the dot product from Article 1](notes/word-embeddings-explained/#step-9).

Say you are allowed one step of a fixed length, and you may point it wherever you like. Step 3 said that over a small distance the loss behaves like a straight line, and in several dimensions that reads as: the change in loss is the gradient dotted with your step. Article 1 showed that a dot product is the two lengths multiplied by the cosine of the angle between them, which leaves

$$
\boxed{\ \Delta L \approx \lVert\nabla L\rVert \; \varepsilon \; \cos\phi\ }
$$

where $\phi$ is the angle between your step and the gradient. Look at what you are allowed to vary. The gradient's length is whatever the landscape makes it. Your step's length is fixed because you fixed it. The angle is the only thing left, so the entire question of which way to go is the question of which angle makes that cosine biggest. It is biggest at $\phi = 0$: point along the gradient and the loss rises faster than any other step of that length can manage. Point the opposite way, $\phi = 180°$, and it falls fastest.

So the minus sign you see in every training loop is just that cosine being as negative as it can get. It was not chosen, and it is not a convention.

The same formula says something else that gets less attention. At $\phi = 90°$, $\cos\phi = 0$ and the loss does not change at all to first order. There are directions in weight space, an enormous number of them in a large model, along which you can move without the loss noticing. Those flat directions are why two training runs from different starting points can reach entirely different weights with almost identical loss.

Drag the step around the circle in the figure and watch the predicted change track the cosine.

<div class="fs-widget" data-widget="steepest">
<p class="fs-fallback"><strong>Try it.</strong> On the surface f(x, y) = x<sup>2</sup> + 3y<sup>2</sup> the gradient at (1, 1) is (2, 6), with length &radic;40 &approx; 6.32, so the steepest uphill direction is (0.316, 0.949) and the steepest downhill direction is (&minus;0.316, &minus;0.949). A step of fixed length changes the loss by that length times 6.32 times the cosine of the angle to the gradient, so a step at right angles to the gradient changes the loss by nothing at all.</p>
</div>

## Step 8: the chain rule, credit along a path

Everything so far assumed we could write the loss as a formula in the weight and differentiate it. In Step 5 that worked because the model was $p = wx$ and the whole thing collapsed to $9w^2 - 30w + 25$. For anything real it is impossible. A weight in the first layer of GPT-2 reaches the loss through twelve blocks of matrices, folds, and normalisations. The single algebraic expression exists in principle and is beyond writing down.

The chain rule is what removes the need to. And the chains are long: a weight in the first block of GPT-3's largest model has to reach the loss through the other 95 blocks stacked above it, every one of them a matrix, a fold, and a normalisation.

Suppose $y = g(x)$ and $z = f(y)$, so that $z$ depends on $x$ only through $y$. Nudge $x$ by $h$. By Step 3 the middle quantity moves by

$$
\Delta y \approx g'(x)\,h
$$

and that movement in $y$ is itself a nudge, which moves $z$ by

$$
\Delta z \approx f'(y)\,\Delta y = f'(y)\,g'(x)\,h
$$

Divide by $h$ and the rule appears:

$$
\boxed{\ \frac{\mathrm{d}z}{\mathrm{d}x} = \frac{\mathrm{d}z}{\mathrm{d}y}\cdot\frac{\mathrm{d}y}{\mathrm{d}x}\ }
$$

In Leibniz's notation it looks like the $\mathrm{d}y$ terms cancel, and he chose the notation so that it would. For a longer chain it extends the obvious way:

$$
x \rightarrow a \rightarrow b \rightarrow L \qquad\Longrightarrow\qquad \frac{\mathrm{d}L}{\mathrm{d}x} = \frac{\mathrm{d}L}{\mathrm{d}b}\cdot\frac{\mathrm{d}b}{\mathrm{d}a}\cdot\frac{\mathrm{d}a}{\mathrm{d}x}
$$

> **Key idea.** Overall sensitivity is the product of the local sensitivities along the path. No step of the chain needs to know anything about any other step.

**Gears make this concrete.** Three gears in a line. Turning the first makes the second turn 3 times as fast, and the second makes the third turn twice as fast again, so the third turns six times for every turn of the first. Nobody needs a theory of the whole gearbox to work that out. Each meshing pair is measured on its own and the numbers are multiplied. The chain rule is that, for rates of change rather than rates of turning.

<figure class="fs-fig"><svg viewBox="0 0 560 258" role="img" aria-label="Three meshed gears of decreasing size. Turning the first once turns the second three times and the third six times."><circle cx="118" cy="112" r="78" class="fg-line"/><line x1="196.0" y1="112.0" x2="203.0" y2="112.0" class="fg-ax"/><line x1="193.3" y1="132.2" x2="200.1" y2="134.0" class="fg-ax"/><line x1="185.5" y1="151.0" x2="191.6" y2="154.5" class="fg-ax"/><line x1="173.2" y1="167.2" x2="178.1" y2="172.1" class="fg-ax"/><line x1="157.0" y1="179.5" x2="160.5" y2="185.6" class="fg-ax"/><line x1="138.2" y1="187.3" x2="140.0" y2="194.1" class="fg-ax"/><line x1="118.0" y1="190.0" x2="118.0" y2="197.0" class="fg-ax"/><line x1="97.8" y1="187.3" x2="96.0" y2="194.1" class="fg-ax"/><line x1="79.0" y1="179.5" x2="75.5" y2="185.6" class="fg-ax"/><line x1="62.8" y1="167.2" x2="57.9" y2="172.1" class="fg-ax"/><line x1="50.5" y1="151.0" x2="44.4" y2="154.5" class="fg-ax"/><line x1="42.7" y1="132.2" x2="35.9" y2="134.0" class="fg-ax"/><line x1="40.0" y1="112.0" x2="33.0" y2="112.0" class="fg-ax"/><line x1="42.7" y1="91.8" x2="35.9" y2="90.0" class="fg-ax"/><line x1="50.5" y1="73.0" x2="44.4" y2="69.5" class="fg-ax"/><line x1="62.8" y1="56.8" x2="57.9" y2="51.9" class="fg-ax"/><line x1="79.0" y1="44.5" x2="75.5" y2="38.4" class="fg-ax"/><line x1="97.8" y1="36.7" x2="96.0" y2="29.9" class="fg-ax"/><line x1="118.0" y1="34.0" x2="118.0" y2="27.0" class="fg-ax"/><line x1="138.2" y1="36.7" x2="140.0" y2="29.9" class="fg-ax"/><line x1="157.0" y1="44.5" x2="160.5" y2="38.4" class="fg-ax"/><line x1="173.2" y1="56.8" x2="178.1" y2="51.9" class="fg-ax"/><line x1="185.5" y1="73.0" x2="191.6" y2="69.5" class="fg-ax"/><line x1="193.3" y1="91.8" x2="200.1" y2="90.0" class="fg-ax"/><circle cx="222" cy="112" r="26" class="fg-line"/><line x1="248.0" y1="112.0" x2="255.0" y2="112.0" class="fg-ax"/><line x1="240.4" y1="130.4" x2="245.3" y2="135.3" class="fg-ax"/><line x1="222.0" y1="138.0" x2="222.0" y2="145.0" class="fg-ax"/><line x1="203.6" y1="130.4" x2="198.7" y2="135.3" class="fg-ax"/><line x1="196.0" y1="112.0" x2="189.0" y2="112.0" class="fg-ax"/><line x1="203.6" y1="93.6" x2="198.7" y2="88.7" class="fg-ax"/><line x1="222.0" y1="86.0" x2="222.0" y2="79.0" class="fg-ax"/><line x1="240.4" y1="93.6" x2="245.3" y2="88.7" class="fg-ax"/><circle cx="261" cy="112" r="13" class="fg-line"/><line x1="274.0" y1="112.0" x2="281.0" y2="112.0" class="fg-ax"/><line x1="261.0" y1="125.0" x2="261.0" y2="132.0" class="fg-ax"/><line x1="248.0" y1="112.0" x2="241.0" y2="112.0" class="fg-ax"/><line x1="261.0" y1="99.0" x2="261.0" y2="92.0" class="fg-ax"/><circle cx="118" cy="112" r="3" class="fg-m"/><circle cx="222" cy="112" r="3" class="fg-m"/><circle cx="261" cy="112" r="3" class="fg-m"/><text x="118" y="216" font-size="12" text-anchor="middle">1 turn</text><text x="222" y="216" font-size="12" text-anchor="middle" class="fg-hit">3 turns</text><line x1="261" y1="130" x2="261" y2="230" class="fg-hi fg-dash"/><text x="261" y="246" font-size="12" text-anchor="middle" class="fg-hit">6 turns</text><line x1="300" y1="112" x2="348" y2="112" class="fg-ax"/><text x="360" y="100" font-size="13">3 &#215; 2 = 6</text><text x="360" y="124" font-size="11" class="fg-m">the ratios multiply</text><text x="360" y="146" font-size="11" class="fg-m">and no gear needs to know</text><text x="360" y="162" font-size="11" class="fg-m">about any other gear</text></svg><figcaption>Why the chain rule multiplies. Each meshing pair has its own ratio, measured on its own, and the overall ratio is the product. A weight ten layers deep in a network is the first gear in a train like this: it has no idea what the loss is, and it does not need one.</figcaption></figure>

**And responsibility is the other reading.** Picture a production line of four machines, raw material in at one end and a product out at the other. The product comes out defective. How much of the blame belongs to machine 2? Machine 2 only touches machine 3, which only touches machine 4, which makes the product. So the blame carried by machine 2 is the blame on the product, passed back through machine 4's sensitivity to its input, then through machine 3's, then through machine 2's. Blame flows backwards along the same path that material flowed forwards, and gets multiplied by a local factor at each station.

That reading is worth holding on to, because it is what the algorithm is literally doing. A neural network has no labels on anything. Nobody told row 1,742 of the second matrix what to look for. The chain rule is the mechanism that works out, from the single number at the end, how much each of 124 million anonymous participants contributed to the mistake, and it does it by passing one number backwards through the computation and multiplying it by something small and local at every stage.

The field has a name for that difficulty, and it predates working neural networks by decades. Marvin Minsky called it the **credit assignment problem** in 1961: when a complicated system succeeds or fails, which of its many parts deserves the credit or the blame? Stated like that it is not really a maths problem at all. It is the question a historian asks about a cause, or an economist about a supply chain, and in general it has no clean answer. What makes it answerable here is that each step of the computation is differentiable, which is a strong enough condition to turn a question about responsibility into a chain of multiplications. Where that condition fails, which Step 12 gets to, the difficulty comes straight back.

### When the path splits

Real networks are not simple chains. A quantity often reaches the loss by more than one route: residual connections add a copy of the input straight to the output, attention sends a token's vector down several heads at once, and a weight that is shared between two places is used twice.

The rule for that case is the other half of the chain rule, and it is the one people forget:

$$
\boxed{\ \frac{\mathrm{d}L}{\mathrm{d}x} = \underbrace{\frac{\partial L}{\partial a}\frac{\partial a}{\partial x}}_{\text{path 1}} + \underbrace{\frac{\partial L}{\partial b}\frac{\partial b}{\partial x}}_{\text{path 2}}\ }
$$

**Multiply along a path, add across paths.** The intuition is the same blame argument: if a machine contributed to the fault in two separate ways, its total responsibility is the sum of the two. This is also exactly why a bias with 3072 outputs accumulates gradient from all of them, and why residual connections help so much, a point Step 12 comes back to.

## Step 9: backpropagation, the backward pass by hand

Now run the machinery on the model from Step 5, but without expanding anything. Keep it as a chain of tiny steps, which is how a real system does it.

$$
w \;\longrightarrow\; p = wx \;\longrightarrow\; e = p - y \;\longrightarrow\; L = e^2
$$

With $w = 2$, $x = 3$, $y = 5$.

**Forward pass.** Compute left to right and write down every intermediate value, because the backward pass will need them.

$$
p = 2(3) = 6, \qquad e = 6 - 5 = 1, \qquad L = 1^2 = 1
$$

**Backward pass.** Compute right to left. At each stage, take the number arriving from the right and multiply it by the local derivative from the Step 4 table.

| Stage | Local derivative | Value here | Gradient so far |
|---|---|---|---|
| $L = e^2$ | $\partial L / \partial e = 2e$ | $2(1) = 2$ | $\partial L/\partial e = 2$ |
| $e = p - y$ | $\partial e / \partial p = 1$ | $1$ | $\partial L/\partial p = 2 \times 1 = 2$ |
| $p = wx$ | $\partial p / \partial w = x$ | $3$ | $\partial L/\partial w = 2 \times 3 = 6$ |

Multiplied out, $2 \times 1 \times 3 = 6$. The same 6 as Step 5, reached without ever forming the expression $9w^2 - 30w + 25$. That is the whole point. The algebraic route needed the complete formula. This route needed three local facts, each from one row of a small table, and a running total.

Notice what the backward pass actually consisted of: carrying a single running number, starting at 1, and multiplying it by one local derivative per stage. That running number has a name, the **adjoint**, and in code it is usually called `grad`. Its meaning at any stage is "how much the final loss would move if this intermediate value moved by one".

Step through it in the figure, forwards and then backwards.

<div class="fs-widget" data-widget="backprop">
<p class="fs-fallback"><strong>Try it.</strong> The chain w &rarr; p = wx &rarr; e = p &minus; y &rarr; L = e&sup2; with w = 2, x = 3, y = 5 gives a forward pass of p = 6, e = 1, L = 1. The backward pass carries a running number: 1 at the loss, then 2e = 2 at the error, then times 1 to give 2 at the prediction, then times x = 3 to give 6 at the weight. So the gradient on w is 6.</p>
</div>

### The same thing with a nonlinearity in the way

Put a sigmoid in the middle, so that the model is a one-weight classifier of the kind [Article 2](notes/neural-network-layer-explained/) described:

$$
w \;\longrightarrow\; z = wx \;\longrightarrow\; p = \sigma(z) \;\longrightarrow\; L = (p - y)^2
$$

Three local derivatives, all from the table: $\partial L/\partial p = 2(p-y)$, then $\partial p/\partial z = p(1-p)$, then $\partial z/\partial w = x$. Multiply:

$$
\frac{\partial L}{\partial w} = 2(p - y)\,p(1 - p)\,x
$$

Take $w = 0$, $x = 2$, $y = 1$. Forward: $z = 0$, and $\sigma(0) = 0.5$ because $e^0 = 1$ and $1/(1+1) = 0.5$, so $p = 0.5$ and $L = (0.5 - 1)^2 = 0.25$. Backward:

$$
\frac{\partial L}{\partial w} = 2(0.5 - 1)\,(0.5)(0.5)\,(2) = 2(-0.5)(0.25)(2) = -0.5
$$

Negative, which reads correctly: the target is 1 and the prediction is only 0.5, so the loss would fall if $w$ increased. Stepping against the gradient increases $w$, which raises $z$, which pushes $\sigma(z)$ up towards 1. Every sign in that sentence came out of the arithmetic rather than from reasoning about what ought to happen.

## Step 10: finite differences, checking it without calculus

A derivative is a limit, and you can approximate one by simply not taking it. Keep $h$ at some small value instead of shrinking it away, and the secant from Step 3 is your answer. That is a **finite difference**, and it is the clumsy nudge-and-see method from the top of this note, brought back as a referee rather than a player.

Try it on the Step 9 answer. The loss is $L(w) = (3w-5)^2$ and we claim its slope at $w = 2$ is 6. Nudge by $h = 0.001$: the loss at $w = 2.001$ works out to $1.006009$, so the rise over the run is $0.006009 / 0.001 = 6.009$. Right to three figures, and the stray 0.009 is the curve of the parabola showing through across a step of real size.

$$
\boxed{\ f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}\ }
$$

That version is better, and the reason is worth a sentence. Step the same distance in both directions rather than one, and the two errors lean opposite ways and cancel. Here the loss at $w = 1.999$ is $0.994009$, and the difference over the full span of $0.002$ is $6.000$. Exactly 6, from a method that knows no calculus at all. One-sided error shrinks like $h$; this shrinks like $h^2$, which at $h = 0.001$ is the difference between being wrong in the third decimal place and the sixth.

This is not a curiosity. It is the standard way to test a hand-written gradient, and the practice has a name, **gradient checking**. Write the derivative analytically, compute it numerically by central difference, and compare. If they disagree beyond the third digit or so, the analytic one has a bug. Every modern framework computes gradients for you, so the need arises only when you write a custom operation, but on the day you do, this is the test.

So why not use finite differences for training and skip the calculus? Because of the cost. Each weight would need its own pair of forward passes, which is the 124-million-runs problem from the start of this note, now twice over. Finite differences are a perfect tool for checking one number and a hopeless one for computing all of them.

## Step 11: reverse-mode differentiation, why it is cheap

The backward pass of Step 9 looked like a hand-rolled trick for a tiny model. It is in fact a general algorithm, and the striking thing about it is the price.

Walk back through what it did. The forward pass computed and stored every intermediate value. The backward pass then visited the same stages in reverse, carrying one running number and multiplying it by one local derivative per stage. The work in the backward pass was proportional to the number of stages, not to the number of weights.

That is the whole result, and it deserves stating plainly:

> **Key idea.** One forward pass and one backward pass yield the gradient with respect to **every** weight, at a total cost of roughly three times the forward pass alone.

Put the two methods side by side on GPT-2 small. The usual accounting for a transformer is that a forward pass costs about $2N$ arithmetic operations per token, where $N$ is the parameter count, and the backward pass about $4N$, giving $6N$ in total for a training step ([Kaplan and colleagues, 2020](https://arxiv.org/abs/2001.08361)).

- **Perturb each weight in turn:** about 124 million forward passes, one per weight, to get one gradient.
- **Forward and backward:** about three forward passes' worth of work, for the same gradient.

$$
\frac{124{,}000{,}000}{3} \approx 41{,}000{,}000
$$

Around forty million times less work, for the identical answer. This is not an optimisation or an approximation. It is the same quantity, computed by sharing intermediate results instead of recomputing them. Training large models is possible because of this ratio and would be impossible without it.

The $6N$ rule is also a good way to sanity-check what a lab tells you. Meta reports training Llama 3's 405-billion-parameter model on 15.6 trillion tokens at a cost of about $3.8 \times 10^{25}$ floating-point operations ([Llama Team, 2024](https://arxiv.org/abs/2407.21783)). Multiply it out yourself:

$$
6 \times (405 \times 10^9) \times (15.6 \times 10^{12}) = 3.79 \times 10^{25}
$$

which lands on their figure. Now price the alternative. Perturbing weights one at a time would cost $N/3$ times as much, and for 405 billion weights that factor is 135 billion. The run that took Meta a few months would take longer than the age of the universe. Backpropagation is not a way of training large models faster. It is the only reason there is anything to train.

### Where the algorithm came from

The method is called **reverse-mode automatic differentiation**, and inside a neural network it is called **backpropagation**. Its history is a good example of an idea arriving before anyone knew what it was for.

The general algorithm was published by Seppo Linnainmaa in his 1970 master's thesis in Helsinki, as a way of tracking rounding errors through a long computation, with no reference to neural networks at all ([documented by Schmidhuber, 2015](https://arxiv.org/abs/1404.7828)). Paul Werbos proposed applying it to neural networks in his 1974 Harvard thesis, and it attracted little attention. The result that made the field notice was [Rumelhart, Hinton, and Williams in 1986](https://doi.org/10.1038/323533a0), who showed that a network trained this way would discover useful internal representations by itself rather than having them designed in. That paper is where "back-propagating errors" enters the vocabulary.

The gradient step of Step 5 is older still. Augustin-Louis Cauchy described following the negative gradient to solve systems of equations in [an 1847 note](https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540) of two pages, which is a hundred and forty years before anyone used it to train a network and a hundred and twenty before anyone could.

## Step 12: vanishing and exploding gradients, where it goes wrong

The chain rule multiplies. Anything that multiplies many numbers together is fragile in a specific way, and the two failure modes that result are responsible for a large share of the trouble in training deep networks.

### A zero anywhere kills the whole path

If one local derivative in a chain is zero, the product is zero and every weight upstream of that point receives nothing. Not a small signal, exactly nothing. They do not move.

The cleanest example is rounding. Let $y = \operatorname{round}(x)$ and move $x$ from 1.21 to 1.22. The output stays at 1. It stays at 1 for every input between 0.5 and 1.5, so the derivative is 0 almost everywhere, with jumps where no derivative exists at all. Put that operation in the middle of a network and everything before it is cut off from the loss. The same applies to any hard threshold, any `argmax`, and any discrete choice. This is why models that need to make discrete decisions require a different mechanism to learn, such as a relaxation or a reward signal, and it is worth knowing as a general rule:

> **Key idea.** A component that blocks the gradient blocks learning everywhere upstream of itself.

A ReLU does this too, in a milder and deliberate form. Its derivative is 0 for negative inputs, so for any given example, the units that were off contribute nothing and get no gradient. That is fine and even useful when a unit is off for some inputs and on for others. It becomes the **dying ReLU** problem when a unit's input is negative for every example in the dataset, at which point it receives zero gradient forever and is permanently dead weight. This is one of the main things leaky ReLU exists to prevent.

### Many small numbers multiplied together vanish

Here, at last, is the promise [Article 2's Step 8](notes/neural-network-layer-explained/#step-8) made. That note claimed the sigmoid's flatness is what stopped deep networks training for decades but could only gesture at why. With the chain rule it becomes arithmetic.

The sigmoid's slope is $\sigma'(z) = \sigma(z)(1 - \sigma(z))$, which is two numbers that always add to 1, multiplied together. The best a product like that can do is $0.5 \times 0.5$, so **the sigmoid's slope never exceeds a quarter anywhere**, and away from the centre it falls off a cliff: by $z = 6$ it is down to about 0.0025.

Now stack ten sigmoid layers and let the chain rule do what it does. The gradient arriving at the first layer is the gradient at the loss with ten of those factors multiplied into it. Be as generous as possible and put every one of them at its absolute maximum:

$$
0.25^{10} = \frac{1}{1{,}048{,}576} \approx 0.00000095
$$

One millionth of the signal in the best case imaginable, and far less in any real one. The first layer of such a network learns about a million times more slowly than the last, which is not slow learning so much as no learning. That is the **vanishing gradient problem**, and it is the reason deep networks sat out the 1990s.

Look back at the right-hand panel of the ReLU figure in Step 4 and the fix is sitting there. Its slope on the positive side is exactly 1, and ten ones multiplied together are exactly 1, so for every unit that is switched on the signal crosses ten layers with nothing taken off it. That one fact, which takes a line of arithmetic once you have the chain rule, is most of why the activation function changed.

The problem has a mirror image. Local factors bigger than 1 make the product grow instead, and growth of that kind is violent: fifty factors of 2 is about $10^{15}$, an update large enough to destroy the weights in a single step. That is **exploding gradients**. The standard remedy is blunt and works: measure the length of the whole gradient vector, the ordinary Pythagoras length over all its millions of components, and if it exceeds some threshold, scale the entire vector down to that length. The direction is preserved and only the size is capped, which is **gradient clipping**. This is not housekeeping for textbook examples. GPT-3 clipped the global gradient norm at 1.0, Llama clipped at 1.0, and you will find the same line in essentially every published frontier recipe, because one bad batch without it can undo a week of work. That same number is the first thing to look at when a run misbehaves: a gradient norm drifting towards zero means learning has stalled, and one spiking means something is about to break.

Residual connections, the ones that add a copy of the input to the output, matter here for the reason Step 8 gave. They create a second path from the loss back to the early layers, and because contributions from separate paths add, that path carries gradient through with a local derivative of exactly 1 whatever the layer in between did to its share. [He and colleagues (2015)](https://arxiv.org/abs/1512.03385) introduced them to train a 152-layer image network at a time when about 20 layers was the practical limit, and every transformer built since has used them. When you see `x + attention(x)` rather than `attention(x)` in a model's code, that plus sign is a gradient highway.

The same question, "where is the gradient allowed to go?", gets asked deliberately when fine-tuning. Freeze most of a pretrained model and train a small adapter inside it, and you have decided which weights collect gradient and which merely pass it along. The frozen layers still have to transmit the signal, because the trainable pieces below them need it, but nothing is accumulated for them. Most of what people mean by a fine-tuning strategy is a decision about that map.

## Step 13: one complete training step, end to end

Put everything together on a model with two weights, worked end to end, so that nothing is left as "and then the framework does it".

The model takes two inputs and combines them with two weights:

$$
p = w_1 x_1 + w_2 x_2
$$

Take the example $x_1 = 2$, $x_2 = 1$, with target $y = 4$, and start from $w_1 = 1$, $w_2 = 1$.

**Forward.**

$$
p = 1(2) + 1(1) = 3, \qquad e = p - y = 3 - 4 = -1, \qquad L = (-1)^2 = 1
$$

**Backward.** Start the running number at the loss and walk back, exactly as in Step 9. The one new feature is the split: $p$ depends on both weights, so the number arriving at $p$ goes to each of them in turn, multiplied by that weight's own local derivative.

Through the square, $\partial L/\partial e = 2e = -2$. Through the subtraction, which passes it on untouched, $\partial L/\partial p = -2$. Then it divides: $w_1$ picks up its own input, $-2 \times 2 = -4$, and $w_2$ picks up its own, $-2 \times 1 = -2$.

$$
\nabla L = (-4,\ -2)
$$

Both negative, so both weights should rise. And $w_1$ gets twice the gradient of $w_2$ for one reason only: its input was twice as large. That is the product rule from Step 4 showing up in the answer. A weight's influence is proportional to what it was multiplying, which is why nobody trains on unnormalised data if they can help it.

**Update.** With $\eta = 0.1$:

$$
w_1 \leftarrow 1 - 0.1(-4) = 1.4, \qquad w_2 \leftarrow 1 - 0.1(-2) = 1.2
$$

**Check.** Run the model again with the new weights:

$$
p = 1.4(2) + 1.2(1) = 2.8 + 1.2 = 4.0, \qquad e = 0, \qquad L = 0
$$

The loss went from 1 to 0 in one step. Hitting the target exactly is a coincidence of this example rather than the normal case, but the direction of travel is not a coincidence at all. Every quantity in that calculation came from the eight rules in the Step 4 table and the two rules of Step 8, and no part of it required knowing what the model was for.

That is the answer to the question this note opened with. The numbers in $W$ and $\mathbf{b}$ come from here. Start them off random, run this loop over example after example, and the weights walk downhill into a configuration nobody designed.

If you would rather watch that than take my word for it, two open projects are worth knowing about. Andrej Karpathy's [nanoGPT](https://github.com/karpathy/nanoGPT) trains a small GPT in a few hundred readable lines, with the forward pass, the loss, the backward pass, and the update all visible as ordinary code rather than hidden behind a framework. And EleutherAI's [Pythia](https://arxiv.org/abs/2304.01373) models ship 154 saved checkpoints each, taken from across training and released precisely so that people can study what the weights were doing at step 1,000 against step 100,000. Frontier labs publish the destination. Open projects publish the walk.

## Bird's-eye view: one training step of a real model

Here is the same loop at the scale of GPT-2 small, where it is 124 million weights rather than two, but with no step that was not in Step 13.

1. **Batch.** Take a few hundred thousand tokens of text. Not one example, because the gradient from a single example is noisy; averaging over a batch gives a steadier estimate of the slope of the true loss.
2. **Forward.** Push the batch through: embedding lookup, then twelve blocks of attention and feed-forward, each one the matrix, bias, and fold of [Article 2](notes/neural-network-layer-explained/). Store every intermediate value along the way, because the backward pass will need all of them. This storage is why training needs so much more memory than inference.
3. **Loss.** The model outputs a probability for every one of 50,257 tokens at every position. Compare those with the tokens that actually came next and reduce the whole batch to one number. That comparison is cross-entropy rather than squared error, which is Article 4, and it changes nothing about what follows.
4. **Backward.** Start with the running number 1 at the loss and walk the computation in reverse, multiplying by a local derivative at every operation and adding contributions wherever a path split. At the end, each of the 124 million weights has one number attached to it, which together are $\nabla L$.
5. **Update.** Move every weight a little way against its own gradient. In practice this is a refinement of $w - \eta\,\partial L/\partial w$ with momentum and per-weight scaling, which is Article 5, and the direction being followed is still the one computed in Step 7.
6. **Repeat.** A few hundred thousand times.

The arithmetic cost of one such step is about $6N$ operations per token. Everything else in training, the data pipeline, the hardware, the schedules, exists to run that loop as many times as the budget allows.

## The whole idea in one line

You have now built the entire learning mechanism:

<div class="fs-flow">
<span>a prediction</span>
<span>a loss</span>
<span>local derivatives</span>
<span>multiply backwards</span>
<span>a gradient for every weight</span>
<span>step against it</span>
</div>

And the idea of this note, Idea 3 of the 44:

> **Idea 3.** The gradient is the vector of every weight's sensitivity to the loss, it points uphill so training steps the other way, and the chain rule computes all of it in one backward sweep by multiplying local derivatives.

Article 1's idea was that meaning becomes geometry. Article 2's was that a model reshapes that geometry. Article 3's is that the reshaping can be *corrected*, automatically, by a mechanism that assigns a share of the blame for one number to every weight in the model.

## Where this road leads

Three notes in, the picture closes on itself. A thing becomes a vector, a stack of matrices and folds reshapes it into an answer, a single number says how wrong that answer was, and that number flows backwards to tell all of the weights how to be less wrong next time. That loop is the whole of supervised learning. Everything after this is a refinement of it, a way of running it faster, or a question about whether what came out of it can be trusted.

Two questions raised in passing here get notes of their own, because neither fits in a paragraph: how backpropagation is actually implemented, with the computational graph and the memory it costs, and what goes wrong in very deep networks along with the normalisation and initialisation tricks that fix it.

## What this idea does not claim

It does not claim the gradient knows where the minimum is. It is a local, first-order fact about the point you are standing on, which is exactly why Step 5's learning rate exists and why too large a step can make things worse. It does not claim that following the gradient reaches the best possible weights, only a point where the slope is flat. It does not claim that every useful model is trained this way: decision trees, nearest-neighbour methods, and evolutionary search are not. It does not claim that squared error is the right loss for anything beyond predicting a quantity. And the chain rule itself assumes the operations in the chain have derivatives, which Step 12 showed is a real restriction rather than a technicality.

## The note in six lines

- A loss function reduces "how wrong is this model" to one number that is smaller when the model is better, and squared error $L = (p-y)^2$ is the simplest one.
- A derivative is the slope of the local straight-line approximation to a curve, $f(x+h) \approx f(x) + f'(x)h$, and it answers how much the output moves per unit of input.
- The gradient $\nabla L$ collects one partial derivative per weight. By the dot product, it points in the direction of steepest increase, so training steps against it: $w \leftarrow w - \eta \nabla L$.
- The chain rule gives the sensitivity of a long computation as the product of local sensitivities along the path, and the sum over paths where a quantity reaches the loss more than once.
- One forward pass and one backward pass therefore produce the gradient for every weight at about three times the cost of the forward pass, roughly forty million times cheaper than perturbing GPT-2 small's weights one at a time.
- Because the chain rule multiplies, a single zero factor cuts off everything upstream, and ten sigmoid layers shrink the signal by at best $0.25^{10} \approx 10^{-6}$, which is why ReLU, with a slope of exactly 1, replaced it.

## Next in the series

This note assumed a loss and built everything on top of it. Article 4 goes back and asks what a loss *is* when the model's output is a probability rather than a number, which turns out to need a different foundation entirely.

A language model does not predict a token. It predicts a distribution over all 50,257 of them, and the question "how wrong was that?" has no obvious answer when the prediction was a spread of possibilities and the truth was one token. **Probability** supplies the answer, and it brings with it the ideas of likelihood, surprise, and information. Out of them comes cross-entropy, the loss that essentially every modern model is actually trained on, and it turns out to be the only sensible choice rather than one option among many.

After that comes optimisation: having found the downhill direction, how far should you step, and what do momentum and adaptive learning rates do that plain gradient descent does not. Step 5's learning-rate experiment is the whole of that subject in miniature.

## Sources and further reading

**Papers and books cited in this note**

- A.-L. Cauchy (1847), [Méthode générale pour la résolution des systèmes d'équations simultanées](https://gallica.bnf.fr/ark:/12148/bpt6k2982c/f540), *Comptes Rendus de l'Académie des Sciences* 25: two pages proposing that one follow the negative gradient downhill.
- S. Linnainmaa (1970), *The representation of the cumulative rounding error of an algorithm as a Taylor expansion of the local rounding errors*, master's thesis, University of Helsinki: the first publication of reverse-mode automatic differentiation, written about rounding error rather than learning.
- P. Werbos (1974), *Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences*, PhD thesis, Harvard University: the proposal to apply it to neural networks.
- D. E. Rumelhart, G. E. Hinton, and R. J. Williams (1986), [Learning representations by back-propagating errors](https://doi.org/10.1038/323533a0), *Nature* 323: the paper that made backpropagation known, and the source of the name.
- J. Schmidhuber (2015), [Deep Learning in Neural Networks: An Overview](https://arxiv.org/abs/1404.7828): a careful history of who published what, and the standard reference for Linnainmaa's priority.
- J. Kaplan and colleagues (2020), [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361): the source of the $6N$ operations per token accounting used in Step 11.
- A. Radford and colleagues (2019), [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf): GPT-2, the source of the 124 million and 50,257 figures.
- K. He, X. Zhang, S. Ren, and J. Sun (2015), [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385): residual connections, and the 152-layer network they made trainable.
- T. Brown and colleagues (2020), [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165): GPT-3, the source of the learning rates in Step 5 and the gradient clipping threshold in Step 12.
- S. Zhang and colleagues (2022), [OPT: Open Pre-trained Transformer Language Models](https://arxiv.org/abs/2205.01068): released with a public training logbook, which is the most honest published account of what a loss landscape does to a schedule.
- A. Chowdhery and colleagues (2022), [PaLM: Scaling Language Modeling with Pathways](https://arxiv.org/abs/2204.02311): the loss spikes of Step 2 and the rewind-and-skip remedy.
- H. Touvron and colleagues (2023), [Llama 2: Open Foundation and Fine-Tuned Chat Models](https://arxiv.org/abs/2307.09288): the 70-billion model's learning rate.
- S. Biderman and colleagues (2023), [Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling](https://arxiv.org/abs/2304.01373): 154 checkpoints per model, released for studying training itself.
- Llama Team, AI @ Meta (2024), [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783): the 405-billion-parameter run, 15.6 trillion tokens, and $3.8 \times 10^{25}$ operations.

**To learn more**

- 3Blue1Brown, [The essence of calculus](https://www.3blue1brown.com/topics/calculus) and [What is backpropagation really doing?](https://www.youtube.com/watch?v=Ilg3gGewQ5U): the best visual treatment of Steps 3 and 9.
- A. Karpathy, [The spelled-out intro to neural networks and backpropagation](https://www.youtube.com/watch?v=VMj-3S1tku0), which builds a working autograd engine from nothing in Python, and [Yes you should understand backprop](https://karpathy.medium.com/yes-you-should-understand-backprop-e2f06eab496b) on why the leaky abstractions of Step 12 matter in practice.
- I. Goodfellow, Y. Bengio, and A. Courville, [Deep Learning](https://www.deeplearningbook.org/) (free online), chapters 4 and 6.3 to 6.5: numerical computation, and backpropagation stated properly for general computational graphs.
- G. Strang, [Calculus](https://ocw.mit.edu/courses/res-18-001-calculus-fall-2023/) (free from MIT): the proper treatment of everything in Steps 3, 4, and 8.
- My earlier notes on [word embeddings and why AI needs vectors](notes/word-embeddings-explained/) (Article 1) and [what a neural network layer is](notes/neural-network-layer-explained/) (Article 2), and a practical one on [gradient descent in code](notes/gradient-descent-better-code/).
