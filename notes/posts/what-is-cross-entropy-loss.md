---
title: "What is cross-entropy loss in AI? Probability, likelihood, and surprise"
date: 2026-11-25
tags: [AI, maths]
summary: "Almost every model is trained on cross-entropy, and almost nobody is told why. This note builds it from nothing: what a probability distribution is, how softmax makes one, why the right score for a prediction is how surprised the model was by the truth, and why that score is forced rather than chosen."
related: [how-gradient-descent-works, neural-network-layer-explained, word-embeddings-explained]
series: token-by-token
---

<div class="fs-series">
<p><strong>AI from Scratch, Token by Token</strong><br>Article 4</p>
<p>Follows on from <a href="notes/how-gradient-descent-works/">Article 3</a>, but reads on its own. You need percentages and the idea of a graph. Logarithms are built here from what they do, not assumed. Boxes marked "Try it" are interactive.</p>
</div>

A model that predicts "dog" tells you less than a model that predicts "dog, 60 percent sure". The second one is making a **probability distribution**: a number for every possible answer, all of them adding to 1. That changes the scoring problem, because "how wrong was that?" has no obvious answer when the prediction was a spread of possibilities and the truth was one outcome. The answer the field settled on is to score the model by how **surprised** it was by the thing that actually happened, where surprise is $-\log p$, and to average that over the data. That average is **cross-entropy**, it is the loss behind essentially every classifier and every language model, and it is not one option among many. This note builds it from nothing and works every number by hand.

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

[Article 3](notes/how-gradient-descent-works/) built the entire learning mechanism: a loss says how wrong the model is, the gradient says which way each weight should move, and the chain rule computes all of it in one backward sweep. It did that with the simplest loss there is, the squared error $(p - y)^2$, and said plainly that it was borrowing one until a better one could be built.

That borrowing has run out. Squared error compares two numbers, and a real model does not output a number.

Ask a language model what comes after "The capital of France is" and it does not answer "Paris". It produces a number for every single token in its vocabulary, 50,257 of them for GPT-2, and those numbers add up to 1. Perhaps 0.97 goes to " Paris", 0.01 to " London", a sliver each to " Rome" and " Berlin", and vanishingly little to the other fifty thousand. The output is not an answer. It is a statement of belief about every possible answer at once.

So the question for this note is:

> A model's prediction is a spread of possibilities, and reality turns out to be one of them. **How wrong was the model?**

Squared error cannot help, because there is nothing to subtract. There is a 50,257-number distribution on one side and a single token on the other.

The useful answer is less obvious than it looks, and it is worth noticing what is wrong with the obvious ones. "Did it put the most probability on the right answer?" throws away everything except the winner, so a model that was 51 percent sure scores the same as one that was 99 percent sure. "How far was the right answer's probability from 1?" sounds reasonable and quietly destroys the model, for reasons Step 11 makes exact. The score that works is stranger and better, and the rest of this note builds it.

## Frog's-eye view: building it from the ground up

Thirteen steps at ground level, one small idea at a time, every number worked out by hand. After that, the bird's-eye view follows one real training step from a language model.

## Step 1: the probability distribution, a prediction that keeps its doubt

Start with what the model is actually handing you.

A **probability distribution** over a set of possible outcomes is one number per outcome, obeying two rules and nothing else:

$$
p(x) \ge 0 \quad \text{for every } x, \qquad \sum_x p(x) = 1
$$

Non-negative, because a negative degree of belief means nothing. Adding to 1, because the outcomes cover everything that can happen, so all of your belief has to land somewhere.

That is the whole definition. Every distribution in this note, in every model you will ever use, is a list of non-negative numbers that add to 1.

<figure class="fs-fig"><svg viewBox="0 0 620 240" role="img" aria-label="A bar chart of a language model's probabilities for the next token: Paris at 0.97, then London, Rome, Berlin and the rest as slivers."><text x="24" y="26" font-size="12">p(next token | "The capital of France is")</text><line x1="150" y1="52" x2="150" y2="206" class="fg-ax"/><line x1="150" y1="206" x2="596" y2="206" class="fg-ax"/><rect x="151" y="58" width="420" height="26" class="fg-hit"/><text x="144" y="76" font-size="12" text-anchor="end">Paris</text><text x="580" y="76" font-size="11" class="fg-m">0.97</text><rect x="151" y="96" width="5" height="26" class="fg-m"/><text x="144" y="114" font-size="12" text-anchor="end">London</text><text x="176" y="114" font-size="11" class="fg-m">0.01</text><rect x="151" y="134" width="3" height="26" class="fg-m"/><text x="144" y="152" font-size="12" text-anchor="end">Rome</text><text x="176" y="152" font-size="11" class="fg-m">0.005</text><rect x="151" y="172" width="3" height="26" class="fg-m"/><text x="144" y="190" font-size="12" text-anchor="end">Berlin</text><text x="176" y="190" font-size="11" class="fg-m">0.005</text><text x="150" y="228" font-size="11" class="fg-m">and 50,253 more tokens, sharing what is left</text></svg><figcaption>What a language model actually outputs. Not a token, but a number for every token it knows, all of them adding to 1. The model is not choosing Paris; it is reporting that almost all of its belief sits there, which is a different and more useful thing to say.</figcaption></figure>

Two things follow immediately, and both matter later.

**A distribution carries its own confidence.** $(0.97, 0.01, 0.005, 0.005)$ and $(0.4, 0.3, 0.2, 0.1)$ both name the same winner. They are completely different predictions, and any honest score has to tell them apart.

**The spread is often the point.** Ask a model "what is 2 + 2" and a sharp distribution is correct. Ask it to continue "I went to the" and a sharp distribution would be a *failure*, because "shop", "beach", "doctor" and a hundred others are all genuinely plausible. A good model is not one that is always confident. It is one whose confidence matches how predictable the situation actually is.

## Step 2: softmax, turning scores into a distribution

A neural network does not naturally produce numbers that behave like that. [Article 2](notes/neural-network-layer-explained/) built the layer that ends a model, and its output is a vector of whatever real numbers the arithmetic happened to produce. They can be negative, they can be larger than 1, and they will not add up to anything in particular. These raw outputs have a name, **logits**.

Suppose a three-class classifier, cat against dog against car, produces

$$
\mathbf{z} = (2.0,\ 1.0,\ 0.1)
$$

Those are not probabilities. The job is to convert them into some, and the conversion has to satisfy two requirements: everything must come out positive, and everything must add to 1. There is an obvious pair of moves for exactly those two requirements.

Exponentiate, which makes everything positive whatever went in. Then divide by the total, which forces the sum to 1. That is **softmax**:

$$
\boxed{\ p_i = \operatorname{softmax}(\mathbf{z})_i = \frac{e^{z_i}}{\sum_j e^{z_j}}\ }
$$

Work it through. The exponentials are $e^{2.0} = 7.389$, $e^{1.0} = 2.718$, and $e^{0.1} = 1.105$. They total $11.213$. Divide each by the total:

$$
p = \left(\frac{7.389}{11.213},\ \frac{2.718}{11.213},\ \frac{1.105}{11.213}\right) = (0.659,\ 0.242,\ 0.099)
$$

Three positive numbers adding to 1. A distribution.

Notice what softmax preserved and what it changed. The *order* survived, so the biggest logit is still the biggest probability. The *gaps* did not. A logit gap of 1.0 between cat and dog became a probability ratio of $e^1 \approx 2.7$, because exponentiating turns differences into ratios. This is the one property of softmax worth remembering: **only the differences between logits matter, and they matter multiplicatively.** Add 5 to every logit and nothing changes at all, because the extra $e^5$ cancels between the top and the bottom.

<div class="fs-widget" data-widget="softmax">
<p class="fs-fallback"><strong>Try it.</strong> Softmax turns the logits (2.0, 1.0, 0.1) into the probabilities (0.659, 0.242, 0.099), which add to 1. Adding the same number to every logit changes nothing. Raising the gap between the first two logits from 1.0 to 2.0 raises the first probability to about 0.79.</p>
</div>

### The subtraction that stops it exploding

One engineering detail, because it is a small case of a large lesson.

$e^x$ grows ferociously. A logit of 1000 would ask a computer for $e^{1000}$, which is roughly $10^{434}$, and the largest number a standard 64-bit float can hold is about $1.8 \times 10^{308}$. The calculation overflows to infinity and the whole distribution becomes nonsense.

The fix uses the shift-invariance from the paragraph above. Subtract the largest logit from all of them before exponentiating:

$$
\boxed{\ p_i = \frac{e^{z_i - \max(\mathbf{z})}}{\sum_j e^{z_j - \max(\mathbf{z})}}\ }
$$

Now the biggest exponent is $e^0 = 1$ and nothing can overflow. And because subtracting a constant from every logit leaves the answer untouched, this costs nothing. The result is identical, it simply arrives intact.

Every softmax in every library does this. It is worth knowing because of what it illustrates: **two expressions can be equal as mathematics and completely different as code.** That sentence will come back in Step 9, where the same problem appears in a form that is much harder to see.

## Step 3: temperature, the dial that sharpens or flattens belief

Softmax has a knob, and it is exposed in every model API you have used.

Divide the logits by a number $T$ before exponentiating:

$$
p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

$T$ is the **temperature**, and the name comes from statistical physics, where exactly this expression describes how energy spreads among states at a given temperature.

Take the same logits $(2.0, 1.0, 0.1)$ and turn the dial:

| Temperature | Probabilities | What it does |
|---|---|---|
| $T = 0.25$ | $(0.982,\ 0.018,\ 0.001)$ | nearly all belief on the winner |
| $T = 0.5$ | $(0.864,\ 0.117,\ 0.019)$ | sharper than the raw scores |
| $T = 1$ | $(0.659,\ 0.242,\ 0.099)$ | the scores as they are |
| $T = 2$ | $(0.502,\ 0.304,\ 0.194)$ | flatter, more of the field in play |

Small $T$ divides by less than one, which stretches the gaps apart and concentrates belief. Push it towards zero and softmax becomes a plain "pick the winner". Large $T$ squashes the gaps together, and pushed high enough every option becomes equally likely, which is a model saying nothing at all.

This is the `temperature` parameter you set when calling a model. Turning it down gives repeatable, conventional, sometimes mechanical output. Turning it up gives variety and eventually incoherence. Worth being precise about what it is *not* doing: the model's beliefs are unchanged, because the logits are unchanged. Temperature only alters how sharply those beliefs get converted into a distribution to sample from. A model made more "creative" by temperature has not had a new idea. It has been told to take its own less-favoured options more seriously.

Temperature returns in Step 12 wearing a different hat, as the standard repair for a model that is overconfident.

## Step 4: conditional probability, what a model actually computes

Everything so far described one distribution floating free. A model's distribution is never free. It always depends on an input.

Written down, that is **conditional probability**:

$$
p(y \mid x)
$$

read as "the probability of $y$ given $x$". The bar means the world has already been narrowed to those cases where $x$ happened, and we are asking about $y$ inside that narrower world.

This single expression is what essentially every model in the field computes:

- a classifier: $p(\text{class} \mid \text{image})$
- a language model: $p(\text{next token} \mid \text{everything so far})$
- a recommender: $p(\text{click} \mid \text{user, item})$
- a weather model: $p(\text{tomorrow} \mid \text{today})$

Which is a genuinely useful thing to notice. Systems that look nothing alike from the outside are doing the same thing: taking some $x$, and returning a distribution over possible $y$.

There is one trap in the notation, and it is responsible for a surprising amount of bad reasoning in production systems. **$p(y \mid x)$ and $p(x \mid y)$ are different numbers.** The probability that someone is carrying an umbrella given that it is raining is high. The probability that it is raining given that someone is carrying an umbrella is a lot lower. Same two facts, two different questions. Step 6 is about what happens when those get confused with money on the line.

## Step 5: the chain rule of probability, how a sentence gets a probability

A language model assigns a probability to one token at a time. Yet people talk about the probability a model assigns to a whole sentence, or a whole document. Those are connected by an identity that is exact, not an approximation, and it is the bridge from probability theory to how language models actually work.

For any sequence $x_1, x_2, \ldots, x_T$:

$$
\boxed{\ p(x_1, x_2, \ldots, x_T) = \prod_{t=1}^{T} p(x_t \mid x_1, \ldots, x_{t-1})\ }
$$

In words: the probability of a whole sequence is the probability of the first thing, times the probability of the second given the first, times the probability of the third given the first two, and onwards to the end.

Take "The cat sleeps":

$$
p(\text{The cat sleeps}) = p(\text{The}) \times p(\text{cat} \mid \text{The}) \times p(\text{sleeps} \mid \text{The cat})
$$

Suppose, purely to have numbers to multiply, those three came out as $0.04$, $0.008$, and $0.3$. Then the sentence has probability $0.04 \times 0.008 \times 0.3 = 0.000096$.

This is why a model that only ever predicts one next token can score an entire document, and it is also why generation works the way it does. Sample a token, append it, ask again. Each step is a small local question, and the chain rule guarantees that the local answers multiply into a coherent global one.

It also plants a problem that Step 9 has to solve. Look at that product. Three tokens gave $0.000096$. A thousand tokens, each around $0.1$, would give $10^{-1000}$, and a 64-bit float gives up somewhere around $10^{-308}$. The number does not become small. It becomes **zero**, and every distinction between a good model and a terrible one is lost in the rounding. Hold that thought.

## Step 6: Bayes' rule, turning the conditional around

Step 4 warned that $p(y \mid x)$ and $p(x \mid y)$ are different. **Bayes' rule** is the exact relationship between them:

$$
\boxed{\ p(y \mid x) = \frac{p(x \mid y)\, p(y)}{p(x)}\ }
$$

Each piece has a job. $p(y)$ is the **prior**, what you believed before the evidence arrived. $p(x \mid y)$ is the **likelihood**, how well the evidence fits that belief. $p(y \mid x)$ is the **posterior**, what you believe afterwards. And $p(x)$ on the bottom just normalises, so the posterior adds to 1.

The rule is named for Thomas Bayes, whose essay on it was published in 1763, two years after he died, by his friend Richard Price. Pierre-Simon Laplace arrived at the same result independently and did far more with it. For two centuries afterwards it was the subject of a genuine philosophical argument about whether a probability may describe a degree of belief at all, rather than only the long-run frequency of a repeatable event. Machine learning settled that argument by ignoring it: a model that outputs 0.97 for Paris is plainly not describing a repeatable experiment.

### What it looks like when it bites

The classic demonstration, because it catches almost everyone.

A disease affects 1 percent of the population. A test detects it 90 percent of the time in people who have it. In people who do not have it, the test still comes back positive 5 percent of the time. You test positive. What is the chance you have the disease?

The intuitive answer is 90 percent. The intuitive answer is confusing $p(\text{positive} \mid \text{disease})$, which is indeed 0.90, with $p(\text{disease} \mid \text{positive})$, which is what you actually want to know.

Rather than reaching for the formula, count people. Take 1,000 of them.

- 10 have the disease, and the test catches 90 percent of them: **9 true positives**.
- 990 do not, and the test wrongly flags 5 percent of them: **49.5 false positives**.
- So 58.5 people test positive in total, and only 9 of them are ill.

$$
p(\text{disease} \mid \text{positive}) = \frac{9}{58.5} = 0.154
$$

<figure class="fs-fig"><svg viewBox="0 0 620 196" role="img" aria-label="A bar showing the 58.5 people out of 1000 who test positive, of whom only 9 are actually ill and 49.5 are false alarms."><text x="24" y="26" font-size="12">of 1,000 people tested, 58.5 come back positive</text><rect x="24" y="48" width="92" height="44" class="fg-hit"/><rect x="116" y="48" width="480" height="44" class="fg-line" fill="none"/><text x="70" y="76" font-size="13" text-anchor="middle" fill="#fff">9</text><text x="356" y="76" font-size="13" text-anchor="middle">49.5</text><text x="24" y="116" font-size="11" class="fg-hit">truly ill</text><text x="596" y="116" font-size="11" text-anchor="end" class="fg-m">false alarms</text><line x1="24" y1="136" x2="116" y2="136" class="fg-hi"/><text x="24" y="160" font-size="12" class="fg-hit">15.4% of positives</text><text x="24" y="182" font-size="11" class="fg-m">90% accurate on the ill, and still only 15% right on a positive.</text></svg><figcaption>The base-rate trap, drawn. Nothing is wrong with the test: it really does catch 90 percent of cases. But 5 percent of a very large healthy group outnumbers 90 percent of a very small ill group, five to one. A model's score never means anything on its own, only against the background rate of the thing it is looking for.</figcaption></figure>

Nothing about the test is faulty. The arithmetic is simply dominated by how rare the disease is.

<div class="fs-widget" data-widget="bayes">
<p class="fs-fallback"><strong>Try it.</strong> With a disease affecting 1% of people, a test that catches 90% of cases, and a 5% false-positive rate, a positive result means a 15.4% chance of disease. Raising the prevalence to 10% raises that to 66.7%. Cutting the false-positive rate to 1% raises it to 47.6%, which shows that the false-positive rate matters far more than the detection rate for rare conditions.</p>
</div>

This is not a puzzle about doctors. Any system hunting for something rare lives here. A content moderation classifier at 99 percent accuracy, hunting for abuse that occurs in 1 in 1,000 posts, will hand its human reviewers a queue that is mostly false alarms, and no amount of improving its accuracy on the harmful posts will fix that. The lever that works is the false-positive rate, because that is the one being multiplied by the enormous number.

> **Key idea.** Always ask what the base rate is. A score has no meaning until you know how common the thing it is looking for actually is.

## Step 7: expectation, collapsing a distribution to one number

One more tool before the loss can be built, and it is the simplest in this note.

A distribution is a list. Often you need one number out of it. The **expectation** is the probability-weighted average:

$$
\boxed{\ \mathbb{E}[X] = \sum_x x \, p(x)\ }
$$

Each possible value, multiplied by how likely it is, added up.

Suppose a payout is 10 with probability 0.8 and 0 with probability 0.2. Then $\mathbb{E}[X] = 10(0.8) + 0(0.2) = 8$.

Note that 8 never happens. The payout is always 10 or 0. Expectation is an average over the distribution, not a prediction of an outcome, and treating it as a prediction is how people end up designing for a customer with 1.8 children.

The reason it matters here is that it defines what a loss actually is. A model's loss on one example is a single number. The thing you want small is the loss **averaged over all the data the model will ever see**, weighted by how likely each case is:

$$
\text{true loss} = \mathbb{E}_{(x,y)}\big[\ \text{loss}(f(x),\, y)\ \big]
$$

Nobody can compute that, because it is an average over data that does not exist yet. What training computes is the average over the data you have, which is an estimate of it. The gap between those two things is the whole subject of generalisation and overfitting, and it gets its own note later in the series. For now the point is narrower: every loss in machine learning is an expectation, so building a loss means deciding what to average.

## Step 8: likelihood, scoring a model by the probability it gave the truth

Now the loss can be built, and the route to it is a question of principle rather than convenience.

You have a model with parameters $\theta$ that produces probabilities, and some data that actually happened. Something has to say which $\theta$ is the right one.

**Maximum likelihood** gives an answer that is hard to argue with: pick the parameters that make the data you actually saw as probable as possible. A model that assigned high probability to what happened was a good description of the world. A model that assigned low probability to what happened was a bad one. That is the entire principle.

If the observations are independent, the probability of the whole dataset is the product of the individual probabilities:

$$
\boxed{\ \theta^* = \arg\max_\theta \ \prod_{i=1}^{N} p_\theta(x_i)\ }
$$

That product is called the **likelihood**. Note carefully what is varying and what is fixed, because the word trips people up: the data is fixed, it already happened, and it is $\theta$ that moves. The likelihood is not the probability of $\theta$. It is the probability of the data, read as a function of $\theta$.

The idea is Ronald Fisher's, set out properly in [a 1922 paper](https://doi.org/10.1098/rsta.1922.0009) that also gave statistics the words "parameter", "statistic", "likelihood", and "sufficiency" in roughly their modern senses. It is the reason training works the way it does rather than some other way.

### Worked on a coin

Flip a coin ten times. Seven heads, three tails. Estimate $\theta = p(\text{heads})$.

The probability of that exact tally, for a given $\theta$, is

$$
L(\theta) = \theta^7 (1-\theta)^3
$$

Try some values. At $\theta = 0.5$ the likelihood is $0.5^{10} = 0.00098$. At $\theta = 0.7$ it is $0.7^7 \times 0.3^3 = 0.00222$, which is 2.3 times larger. The data is more than twice as probable under a biased coin than a fair one, which is exactly the sense in which the data is evidence of bias.

Finding the best $\theta$ is a job for [Article 3](notes/how-gradient-descent-works/): differentiate and find where the slope is zero. Step 10 does it, once the next step has made the differentiating easy.

<div class="fs-widget" data-widget="likelihood">
<p class="fs-fallback"><strong>Try it.</strong> For 7 heads in 10 flips, the likelihood L(&theta;) = &theta;<sup>7</sup>(1 &minus; &theta;)<sup>3</sup> peaks at &theta; = 0.7, where it equals 0.00222. At &theta; = 0.5 it is 0.00098 and at &theta; = 0.9 it is 0.00043, so both a fair coin and a heavily biased one explain the data worse than 0.7 does.</p>
</div>

## Step 9: log-likelihood, why the logarithm is not optional

The likelihood is a product, and Step 5 already showed what products of probabilities do. For a dataset of any real size, that product underflows to zero and takes all the information with it.

The logarithm fixes it, and fixes a second thing at the same time.

**It cannot change the answer.** $\log$ is monotonically increasing: if $a > b$ then $\log a > \log b$, always. So whichever $\theta$ maximises the likelihood also maximises its logarithm. Nothing is approximated and nothing is lost.

**It turns the product into a sum**, because $\log(ab) = \log a + \log b$:

$$
\log \prod_{i=1}^{N} p_\theta(x_i) = \sum_{i=1}^{N} \log p_\theta(x_i)
$$

Those two facts together are the whole reason the logarithm is everywhere in machine learning. A sum of a million modest negative numbers is a perfectly ordinary number. A product of a million probabilities is zero.

Make it concrete with the sentence from Step 5. The three probabilities multiplied to $0.000096$. Their logarithms are $-3.219$, $-4.828$, and $-1.204$, which add to $-9.251$. Only three tokens, so both forms survive. At a thousand tokens the product is gone and the sum is around $-3000$, which a computer handles without blinking.

Finally, flip the sign, because optimisers minimise rather than maximise, and divide by $N$ so that the number does not grow with the size of the dataset:

$$
\boxed{\ \mathcal{L}(\theta) = -\frac{1}{N}\sum_{i=1}^{N} \log p_\theta(x_i)\ }
$$

This is the **negative log-likelihood**, and it is the most important formula in this note. Everything from here is a matter of reading it properly.

> **Key idea.** Maximising the probability of the data is the same thing as minimising the average negative log-probability of the data. The second version is the one a computer can actually optimise.

Worth adding that working in logarithms is not only a training trick. It is how probabilities are handled throughout a real system. When an API hands you `logprobs` rather than probabilities, that is why: the log-space numbers are the ones that survive the arithmetic.

## Step 10: maximum likelihood on a coin, worked to the end

With the logarithm in hand, finish the coin.

$$
\log L(\theta) = 7 \log \theta + 3 \log(1-\theta)
$$

Differentiate, using the one new fact that the slope of $\log x$ is $1/x$, and the chain rule from [Article 3's Step 8](notes/how-gradient-descent-works/#step-8) for the $(1-\theta)$ part, which contributes a minus sign:

$$
\frac{\mathrm{d}}{\mathrm{d}\theta} \log L = \frac{7}{\theta} - \frac{3}{1-\theta}
$$

A maximum is where the slope is zero, so set it to zero and solve. $7(1-\theta) = 3\theta$, so $7 = 10\theta$, so

$$
\boxed{\ \hat{\theta} = \frac{7}{10} = 0.7\ }
$$

The maximum-likelihood estimate is exactly the observed frequency. Which is reassuring rather than surprising: the principle, applied to a coin, recovers the answer any sensible person would have given. That is the point of checking a principle on a case where you already know the answer.

The general result is the same shape. Maximum likelihood on counts gives you the proportions you counted. A language model trained this way is, in the limit, being asked to reproduce the frequencies of real text, which is why "it is just predicting the next word" is both completely true and much less deflationary than it sounds.

## Step 11: surprise, the right unit for being wrong

Step 9 produced $-\log p$ and called it a trick for avoiding underflow. It is much more than that, and this step is the heart of the note.

Ask what a measure of "how surprising is an event?" would have to satisfy, before knowing any formula.

1. **Something certain is not surprising.** If $p = 1$, surprise should be 0.
2. **Rarer is more surprising.** As $p$ falls, surprise rises.
3. **Surprises from independent events add.** Learning two unrelated things should surprise you by the sum of their separate surprises.

That third requirement is the demanding one, and it almost completely determines the answer. Independent probabilities *multiply*, and we want their surprises to *add*. The function that turns multiplication into addition is the logarithm, and there is no other. Pin the first requirement down as well, and only one form survives:

$$
\boxed{\ \text{surprise}(x) = -\log p(x)\ }
$$

Check it. At $p = 1$, $\log 1 = 0$, so there is no surprise. As $p$ drops, $-\log p$ climbs. At $p = 0.5$ it is $0.693$ nats; at $0.1$ it is $2.303$; at $0.01$ it is $4.605$; and as $p$ approaches zero it goes to infinity, which is the mathematics saying that being certain about something that then happens anyway is infinitely bad.

<figure class="fs-fig"><svg viewBox="0 0 620 262" role="img" aria-label="A curve of minus log p against p. It is zero at p equals 1 and rises steeply towards infinity as p approaches zero."><text x="24" y="26" font-size="12">surprise = &#8722;log p, in nats</text><line x1="70" y1="26" x2="70" y2="206" class="fg-ax"/><line x1="70" y1="206" x2="590" y2="206" class="fg-ax"/><line x1="66" y1="172.0" x2="70" y2="172.0" class="fg-ax"/><text x="62" y="176.0" text-anchor="end" font-size="10" class="fg-m">1</text><line x1="66" y1="138.0" x2="70" y2="138.0" class="fg-ax"/><text x="62" y="142.0" text-anchor="end" font-size="10" class="fg-m">2</text><line x1="66" y1="104.0" x2="70" y2="104.0" class="fg-ax"/><text x="62" y="108.0" text-anchor="end" font-size="10" class="fg-m">3</text><line x1="66" y1="70.0" x2="70" y2="70.0" class="fg-ax"/><text x="62" y="74.0" text-anchor="end" font-size="10" class="fg-m">4</text><polyline points="73.6,37.3 74.1,41.8 74.6,45.8 75.1,49.4 75.6,52.7 76.1,55.6 76.6,58.3 77.1,60.9 77.7,63.2 78.2,65.4 78.7,67.5 79.2,69.4 79.7,71.2 80.2,73.0 80.7,74.7 81.2,76.2 81.7,77.7 82.2,79.2 82.8,80.6 83.3,81.9 83.8,83.2 84.3,84.4 84.8,85.6 85.3,86.8 85.8,87.9 86.3,89.0 86.8,90.0 87.3,91.0 87.8,92.0 88.4,93.0 88.9,93.9 89.4,94.8 89.9,95.7 90.4,96.6 90.9,97.4 91.4,98.2 91.9,99.0 92.4,99.8 93.0,100.6 93.5,101.3 94.0,102.0 94.5,102.8 95.0,103.5 95.5,104.1 96.0,104.8 96.5,105.5 97.0,106.1 97.5,106.8 98.0,107.4 98.6,108.0 99.1,108.6 99.6,109.2 100.1,109.8 100.6,110.3 101.1,110.9 101.6,111.5 102.1,112.0 102.6,112.5 103.2,113.1 103.7,113.6 104.2,114.1 104.7,114.6 105.2,115.1 105.7,115.6 106.2,116.1 106.7,116.5 107.2,117.0 107.7,117.5 108.2,117.9 108.8,118.4 109.3,118.8 109.8,119.3 110.3,119.7 110.8,120.1 111.3,120.5 111.8,121.0 112.3,121.4 112.8,121.8 113.3,122.2 113.9,122.6 114.4,123.0 114.9,123.4 115.4,123.7 115.9,124.1 116.4,124.5 116.9,124.9 117.4,125.2 117.9,125.6 118.5,126.0 119.0,126.3 119.5,126.7 120.0,127.0 120.5,127.4 121.0,127.7 121.5,128.1 122.0,128.4 122.5,128.7 123.0,129.0 123.5,129.4 124.1,129.7 124.6,130.0 125.1,130.3 125.6,130.6 126.1,131.0 126.6,131.3 127.1,131.6 127.6,131.9 128.1,132.2 128.7,132.5 129.2,132.8 129.7,133.1 130.2,133.3 130.7,133.6 131.2,133.9 131.7,134.2 132.2,134.5 132.7,134.8 133.2,135.0 133.8,135.3 134.3,135.6 134.8,135.8 135.3,136.1 135.8,136.4 136.3,136.6 136.8,136.9 137.3,137.2 137.8,137.4 138.3,137.7 138.9,137.9 139.4,138.2 139.9,138.4 140.4,138.7 140.9,138.9 141.4,139.2 141.9,139.4 142.4,139.6 142.9,139.9 143.4,140.1 143.9,140.3 144.5,140.6 145.0,140.8 145.5,141.0 146.0,141.3 146.5,141.5 147.0,141.7 147.5,141.9 148.0,142.2 148.5,142.4 149.1,142.6 149.6,142.8 150.1,143.0 150.6,143.3 151.1,143.5 151.6,143.7 152.1,143.9 152.6,144.1 153.1,144.3 153.6,144.5 154.2,144.7 154.7,144.9 155.2,145.1 155.7,145.4 156.2,145.6 156.7,145.8 157.2,146.0 157.7,146.2 158.2,146.3 158.7,146.5 159.2,146.7 159.8,146.9 160.3,147.1 160.8,147.3 161.3,147.5 161.8,147.7 162.3,147.9 162.8,148.1 163.3,148.3 163.8,148.4 164.3,148.6 164.9,148.8 165.4,149.0 165.9,149.2 166.4,149.4 166.9,149.5 167.4,149.7 167.9,149.9 168.4,150.1 168.9,150.2 169.4,150.4 170.0,150.6 170.5,150.8 171.0,150.9 171.5,151.1 172.0,151.3 172.5,151.4 173.0,151.6 173.5,151.8 174.0,152.0 174.6,152.1 175.1,152.3 175.6,152.4 176.1,152.6 176.6,152.8 177.1,152.9 177.6,153.1 178.1,153.3 178.6,153.4 179.1,153.6 179.6,153.7 180.2,153.9 180.7,154.1 181.2,154.2 181.7,154.4 182.2,154.5 182.7,154.7 183.2,154.8 183.7,155.0 184.2,155.1 184.8,155.3 185.3,155.4 185.8,155.6 186.3,155.7 186.8,155.9 187.3,156.0 187.8,156.2 188.3,156.3 188.8,156.5 189.3,156.6 189.8,156.8 190.4,156.9 190.9,157.1 191.4,157.2 191.9,157.3 192.4,157.5 192.9,157.6 193.4,157.8 193.9,157.9 194.4,158.0 194.9,158.2 195.5,158.3 196.0,158.5 196.5,158.6 197.0,158.7 197.5,158.9 198.0,159.0 198.5,159.1 199.0,159.3 199.5,159.4 200.1,159.5 200.6,159.7 201.1,159.8 201.6,159.9 202.1,160.1 202.6,160.2 203.1,160.3 203.6,160.5 204.1,160.6 204.6,160.7 205.2,160.8 205.7,161.0 206.2,161.1 206.7,161.2 207.2,161.4 207.7,161.5 208.2,161.6 208.7,161.7 209.2,161.9 209.7,162.0 210.2,162.1 210.8,162.2 211.3,162.4 211.8,162.5 212.3,162.6 212.8,162.7 213.3,162.8 213.8,163.0 214.3,163.1 214.8,163.2 215.3,163.3 215.9,163.4 216.4,163.6 216.9,163.7 217.4,163.8 217.9,163.9 218.4,164.0 218.9,164.1 219.4,164.3 219.9,164.4 220.4,164.5 221.0,164.6 221.5,164.7 222.0,164.8 222.5,165.0 223.0,165.1 223.5,165.2 224.0,165.3 224.5,165.4 225.0,165.5 225.5,165.6 226.1,165.7 226.6,165.8 227.1,166.0 227.6,166.1 228.1,166.2 228.6,166.3 229.1,166.4 229.6,166.5 230.1,166.6 230.7,166.7 231.2,166.8 231.7,166.9 232.2,167.0 232.7,167.2 233.2,167.3 233.7,167.4 234.2,167.5 234.7,167.6 235.2,167.7 235.8,167.8 236.3,167.9 236.8,168.0 237.3,168.1 237.8,168.2 238.3,168.3 238.8,168.4 239.3,168.5 239.8,168.6 240.3,168.7 240.9,168.8 241.4,168.9 241.9,169.0 242.4,169.1 242.9,169.2 243.4,169.3 243.9,169.4 244.4,169.5 244.9,169.6 245.4,169.7 245.9,169.8 246.5,169.9 247.0,170.0 247.5,170.1 248.0,170.2 248.5,170.3 249.0,170.4 249.5,170.5 250.0,170.6 250.5,170.7 251.0,170.8 251.6,170.9 252.1,171.0 252.6,171.1 253.1,171.2 253.6,171.3 254.1,171.4 254.6,171.5 255.1,171.5 255.6,171.6 256.1,171.7 256.7,171.8 257.2,171.9 257.7,172.0 258.2,172.1 258.7,172.2 259.2,172.3 259.7,172.4 260.2,172.5 260.7,172.6 261.2,172.7 261.8,172.7 262.3,172.8 262.8,172.9 263.3,173.0 263.8,173.1 264.3,173.2 264.8,173.3 265.3,173.4 265.8,173.5 266.4,173.5 266.9,173.6 267.4,173.7 267.9,173.8 268.4,173.9 268.9,174.0 269.4,174.1 269.9,174.2 270.4,174.2 270.9,174.3 271.5,174.4 272.0,174.5 272.5,174.6 273.0,174.7 273.5,174.8 274.0,174.8 274.5,174.9 275.0,175.0 275.5,175.1 276.0,175.2 276.6,175.3 277.1,175.4 277.6,175.4 278.1,175.5 278.6,175.6 279.1,175.7 279.6,175.8 280.1,175.9 280.6,175.9 281.1,176.0 281.6,176.1 282.2,176.2 282.7,176.3 283.2,176.3 283.7,176.4 284.2,176.5 284.7,176.6 285.2,176.7 285.7,176.7 286.2,176.8 286.8,176.9 287.3,177.0 287.8,177.1 288.3,177.1 288.8,177.2 289.3,177.3 289.8,177.4 290.3,177.5 290.8,177.5 291.3,177.6 291.9,177.7 292.4,177.8 292.9,177.9 293.4,177.9 293.9,178.0 294.4,178.1 294.9,178.2 295.4,178.2 295.9,178.3 296.4,178.4 297.0,178.5 297.5,178.5 298.0,178.6 298.5,178.7 299.0,178.8 299.5,178.9 300.0,178.9 300.5,179.0 301.0,179.1 301.5,179.2 302.1,179.2 302.6,179.3 303.1,179.4 303.6,179.4 304.1,179.5 304.6,179.6 305.1,179.7 305.6,179.7 306.1,179.8 306.6,179.9 307.1,180.0 307.7,180.0 308.2,180.1 308.7,180.2 309.2,180.3 309.7,180.3 310.2,180.4 310.7,180.5 311.2,180.5 311.7,180.6 312.2,180.7 312.8,180.8 313.3,180.8 313.8,180.9 314.3,181.0 314.8,181.0 315.3,181.1 315.8,181.2 316.3,181.3 316.8,181.3 317.4,181.4 317.9,181.5 318.4,181.5 318.9,181.6 319.4,181.7 319.9,181.7 320.4,181.8 320.9,181.9 321.4,182.0 321.9,182.0 322.4,182.1 323.0,182.2 323.5,182.2 324.0,182.3 324.5,182.4 325.0,182.4 325.5,182.5 326.0,182.6 326.5,182.6 327.0,182.7 327.6,182.8 328.1,182.8 328.6,182.9 329.1,183.0 329.6,183.0 330.1,183.1 330.6,183.2 331.1,183.2 331.6,183.3 332.1,183.4 332.7,183.4 333.2,183.5 333.7,183.6 334.2,183.6 334.7,183.7 335.2,183.8 335.7,183.8 336.2,183.9 336.7,184.0 337.2,184.0 337.8,184.1 338.3,184.2 338.8,184.2 339.3,184.3 339.8,184.3 340.3,184.4 340.8,184.5 341.3,184.5 341.8,184.6 342.3,184.7 342.9,184.7 343.4,184.8 343.9,184.9 344.4,184.9 344.9,185.0 345.4,185.0 345.9,185.1 346.4,185.2 346.9,185.2 347.4,185.3 348.0,185.4 348.5,185.4 349.0,185.5 349.5,185.5 350.0,185.6 350.5,185.7 351.0,185.7 351.5,185.8 352.0,185.9 352.5,185.9 353.1,186.0 353.6,186.0 354.1,186.1 354.6,186.2 355.1,186.2 355.6,186.3 356.1,186.3 356.6,186.4 357.1,186.5 357.6,186.5 358.1,186.6 358.7,186.6 359.2,186.7 359.7,186.8 360.2,186.8 360.7,186.9 361.2,186.9 361.7,187.0 362.2,187.1 362.7,187.1 363.2,187.2 363.8,187.2 364.3,187.3 364.8,187.4 365.3,187.4 365.8,187.5 366.3,187.5 366.8,187.6 367.3,187.7 367.8,187.7 368.3,187.8 368.9,187.8 369.4,187.9 369.9,187.9 370.4,188.0 370.9,188.1 371.4,188.1 371.9,188.2 372.4,188.2 372.9,188.3 373.4,188.3 374.0,188.4 374.5,188.5 375.0,188.5 375.5,188.6 376.0,188.6 376.5,188.7 377.0,188.7 377.5,188.8 378.0,188.9 378.6,188.9 379.1,189.0 379.6,189.0 380.1,189.1 380.6,189.1 381.1,189.2 381.6,189.2 382.1,189.3 382.6,189.4 383.1,189.4 383.6,189.5 384.2,189.5 384.7,189.6 385.2,189.6 385.7,189.7 386.2,189.7 386.7,189.8 387.2,189.9 387.7,189.9 388.2,190.0 388.8,190.0 389.3,190.1 389.8,190.1 390.3,190.2 390.8,190.2 391.3,190.3 391.8,190.3 392.3,190.4 392.8,190.5 393.3,190.5 393.9,190.6 394.4,190.6 394.9,190.7 395.4,190.7 395.9,190.8 396.4,190.8 396.9,190.9 397.4,190.9 397.9,191.0 398.4,191.0 398.9,191.1 399.5,191.1 400.0,191.2 400.5,191.2 401.0,191.3 401.5,191.4 402.0,191.4 402.5,191.5 403.0,191.5 403.5,191.6 404.1,191.6 404.6,191.7 405.1,191.7 405.6,191.8 406.1,191.8 406.6,191.9 407.1,191.9 407.6,192.0 408.1,192.0 408.6,192.1 409.2,192.1 409.7,192.2 410.2,192.2 410.7,192.3 411.2,192.3 411.7,192.4 412.2,192.4 412.7,192.5 413.2,192.5 413.7,192.6 414.2,192.6 414.8,192.7 415.3,192.7 415.8,192.8 416.3,192.8 416.8,192.9 417.3,192.9 417.8,193.0 418.3,193.0 418.8,193.1 419.4,193.1 419.9,193.2 420.4,193.2 420.9,193.3 421.4,193.3 421.9,193.4 422.4,193.4 422.9,193.5 423.4,193.5 423.9,193.6 424.4,193.6 425.0,193.7 425.5,193.7 426.0,193.8 426.5,193.8 427.0,193.9 427.5,193.9 428.0,194.0 428.5,194.0 429.0,194.1 429.5,194.1 430.1,194.2 430.6,194.2 431.1,194.3 431.6,194.3 432.1,194.4 432.6,194.4 433.1,194.5 433.6,194.5 434.1,194.5 434.6,194.6 435.2,194.6 435.7,194.7 436.2,194.7 436.7,194.8 437.2,194.8 437.7,194.9 438.2,194.9 438.7,195.0 439.2,195.0 439.8,195.1 440.3,195.1 440.8,195.2 441.3,195.2 441.8,195.3 442.3,195.3 442.8,195.3 443.3,195.4 443.8,195.4 444.3,195.5 444.8,195.5 445.4,195.6 445.9,195.6 446.4,195.7 446.9,195.7 447.4,195.8 447.9,195.8 448.4,195.9 448.9,195.9 449.4,195.9 449.9,196.0 450.5,196.0 451.0,196.1 451.5,196.1 452.0,196.2 452.5,196.2 453.0,196.3 453.5,196.3 454.0,196.4 454.5,196.4 455.1,196.4 455.6,196.5 456.1,196.5 456.6,196.6 457.1,196.6 457.6,196.7 458.1,196.7 458.6,196.8 459.1,196.8 459.6,196.8 460.2,196.9 460.7,196.9 461.2,197.0 461.7,197.0 462.2,197.1 462.7,197.1 463.2,197.2 463.7,197.2 464.2,197.2 464.7,197.3 465.2,197.3 465.8,197.4 466.3,197.4 466.8,197.5 467.3,197.5 467.8,197.6 468.3,197.6 468.8,197.6 469.3,197.7 469.8,197.7 470.4,197.8 470.9,197.8 471.4,197.9 471.9,197.9 472.4,197.9 472.9,198.0 473.4,198.0 473.9,198.1 474.4,198.1 474.9,198.2 475.5,198.2 476.0,198.2 476.5,198.3 477.0,198.3 477.5,198.4 478.0,198.4 478.5,198.5 479.0,198.5 479.5,198.5 480.0,198.6 480.6,198.6 481.1,198.7 481.6,198.7 482.1,198.8 482.6,198.8 483.1,198.8 483.6,198.9 484.1,198.9 484.6,199.0 485.1,199.0 485.6,199.0 486.2,199.1 486.7,199.1 487.2,199.2 487.7,199.2 488.2,199.3 488.7,199.3 489.2,199.3 489.7,199.4 490.2,199.4 490.8,199.5 491.3,199.5 491.8,199.5 492.3,199.6 492.8,199.6 493.3,199.7 493.8,199.7 494.3,199.7 494.8,199.8 495.3,199.8 495.8,199.9 496.4,199.9 496.9,200.0 497.4,200.0 497.9,200.0 498.4,200.1 498.9,200.1 499.4,200.2 499.9,200.2 500.4,200.2 500.9,200.3 501.5,200.3 502.0,200.4 502.5,200.4 503.0,200.4 503.5,200.5 504.0,200.5 504.5,200.6 505.0,200.6 505.5,200.6 506.1,200.7 506.6,200.7 507.1,200.8 507.6,200.8 508.1,200.8 508.6,200.9 509.1,200.9 509.6,201.0 510.1,201.0 510.6,201.0 511.1,201.1 511.7,201.1 512.2,201.1 512.7,201.2 513.2,201.2 513.7,201.3 514.2,201.3 514.7,201.3 515.2,201.4 515.7,201.4 516.2,201.5 516.8,201.5 517.3,201.5 517.8,201.6 518.3,201.6 518.8,201.7 519.3,201.7 519.8,201.7 520.3,201.8 520.8,201.8 521.4,201.8 521.9,201.9 522.4,201.9 522.9,202.0 523.4,202.0 523.9,202.0 524.4,202.1 524.9,202.1 525.4,202.2 525.9,202.2 526.5,202.2 527.0,202.3 527.5,202.3 528.0,202.3 528.5,202.4 529.0,202.4 529.5,202.5 530.0,202.5 530.5,202.5 531.0,202.6 531.5,202.6 532.1,202.6 532.6,202.7 533.1,202.7 533.6,202.8 534.1,202.8 534.6,202.8 535.1,202.9 535.6,202.9 536.1,202.9 536.7,203.0 537.2,203.0 537.7,203.1 538.2,203.1 538.7,203.1 539.2,203.2 539.7,203.2 540.2,203.2 540.7,203.3 541.2,203.3 541.8,203.3 542.3,203.4 542.8,203.4 543.3,203.5 543.8,203.5 544.3,203.5 544.8,203.6 545.3,203.6 545.8,203.6 546.3,203.7 546.9,203.7 547.4,203.8 547.9,203.8 548.4,203.8 548.9,203.9 549.4,203.9 549.9,203.9 550.4,204.0 550.9,204.0 551.4,204.0 552.0,204.1 552.5,204.1 553.0,204.1 553.5,204.2 554.0,204.2 554.5,204.3 555.0,204.3 555.5,204.3 556.0,204.4 556.5,204.4 557.0,204.4 557.6,204.5 558.1,204.5 558.6,204.5 559.1,204.6 559.6,204.6 560.1,204.6 560.6,204.7 561.1,204.7 561.6,204.8 562.1,204.8 562.7,204.8 563.2,204.9 563.7,204.9 564.2,204.9 564.7,205.0 565.2,205.0 565.7,205.0 566.2,205.1 566.7,205.1 567.2,205.1 567.8,205.2 568.3,205.2 568.8,205.2 569.3,205.3 569.8,205.3 570.3,205.3 570.8,205.4 571.3,205.4 571.8,205.5 572.3,205.5 572.9,205.5 573.4,205.6 573.9,205.6 574.4,205.6 574.9,205.7 575.4,205.7 575.9,205.7 576.4,205.8 576.9,205.8 577.5,205.8 578.0,205.9 578.5,205.9 579.0,205.9 579.5,206.0 580.0,206.0" class="fg-curve"/><text x="62" y="210" text-anchor="end" font-size="11" class="fg-m">0</text><text x="70" y="226" font-size="11" class="fg-m">p = 0</text><text x="590" y="226" text-anchor="end" font-size="11" class="fg-m">p = 1</text><line x1="325.0" y1="206.0" x2="325.0" y2="182.4" class="fg-hi fg-dash"/><circle cx="325.0" cy="182.4" r="5" class="fg-hit"/><text x="335.0" y="176.4" font-size="11" class="fg-hit">p = 0.5, costs 0.69</text><line x1="95.5" y1="206.0" x2="95.5" y2="104.1" class="fg-hi fg-dash"/><circle cx="95.5" cy="104.1" r="5" class="fg-hit"/><text x="105.5" y="98.1" font-size="11" class="fg-hit">p = 0.05, costs 3.0</text><text x="70" y="250" font-size="11" class="fg-m">Being a bit wrong is cheap. Being confidently wrong is not, and the curve has no ceiling.</text></svg><figcaption>Why this is the right shape for a loss and a difference of 0.1 is not. The penalty for giving the truth a probability of 0.5 rather than 0.6 is small. The penalty for giving it 0.01 rather than 0.1 is large. A loss built on this cannot be satisfied by a model that is roughly right; it keeps pushing until the model stops being confidently wrong.</figcaption></figure>

**Nats and bits.** The base of the logarithm is only a choice of unit. Natural logarithms give **nats**, and that is what training code uses because the calculus is tidier. Base 2 gives **bits**, which is the unit to think in, because one bit is exactly the surprise of a fair coin landing heads. The conversion is a constant: 1 nat is about 1.44 bits.

This is Claude Shannon's, from [1948](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x), and it was not built for machine learning. Shannon was working out the capacity of a communication channel, and he needed to know how many bits it takes to send a message. The answer is the surprise: **the number of bits needed to encode an event is its surprise in bits.** Common things get short codes, rare things get long ones, and $-\log p$ is the length. A few years later he [turned the same tools on English itself](https://doi.org/10.1002/j.1538-7305.1951.tb01366.x) and estimated that each letter of printed English carries around one bit, given the letters before it. That is a language model, in 1951, measured by exactly the quantity used today.

## Step 12: cross-entropy, the loss itself

Everything is now in place, and the last step is almost a formality.

Take the negative log-likelihood from Step 9 and read it as an average surprise: the model's expected surprise at reality. That average is the **cross-entropy** between what is true and what the model believes. Writing $p$ for the truth and $q$ for the model:

$$
\boxed{\ H(p, q) = -\sum_x p(x) \log q(x)\ }
$$

The outer $p$ is the Step 7 expectation, "average this over what actually happens". The inner $-\log q$ is the Step 11 surprise, "how shocked was the model". Cross-entropy is literally the model's average surprise at the world.

### Why it collapses to one term

In supervised training there is no distribution of truth. There is one correct answer. So $p$ is a **one-hot** distribution, 1 on the right answer and 0 everywhere else. Every term in that sum is multiplied by zero except one:

$$
\boxed{\ L = -\log q(\text{correct answer})\ }
$$

That is cross-entropy loss, in full. The only number that enters the loss is the probability the model gave to the thing that actually happened. Everything it believed about the other options matters only through the softmax, which already forced them to compete for the same total of 1.

Work it. The classifier from Step 2 produced $(0.659, 0.242, 0.099)$ for cat, dog, car, and the picture was a dog. The loss is

$$
L = -\log(0.242) = 1.419 \ \text{nats}
$$

Change nothing except the answer. If the picture had been a cat, the loss would be $-\log(0.659) = 0.417$. Same prediction, different truth, and the loss reports the difference honestly.

### Why confident mistakes cost so much

The shape of the curve in Step 11 is the whole character of this loss. Two models, both wrong, both asked about a dog:

| Model | $q(\text{dog})$ | Loss |
|---|---|---|
| A, unsure | $0.6$ | $0.511$ |
| B, confidently wrong | $0.01$ | $4.605$ |

Model B is penalised nine times more heavily. Under a loss that just measured the distance from 1, the gap would be a factor of about 2.5. Cross-entropy punishes confident errors disproportionately, and that is the behaviour you want: a model that says 99 percent should be right 99 percent of the time, and this loss is what teaches it to stop claiming otherwise.

<div class="fs-widget" data-widget="surprise">
<p class="fs-fallback"><strong>Try it.</strong> Cross-entropy loss is &minus;log of the probability the model gave to the correct answer. At p = 0.9 the loss is 0.105 nats, at p = 0.5 it is 0.693, at p = 0.1 it is 2.303, and at p = 0.01 it is 4.605. Halving the probability always adds the same 0.693 nats, which is one bit.</p>
</div>

### The number in the training log

This also explains the numbers you see while a model trains, and lets you sanity-check them.

A model that has learned nothing spreads its belief evenly across the vocabulary. For GPT-2's 50,257 tokens that is $1/50{,}257$ each, so the loss starts at $\log 50{,}257 = 10.82$ nats. Every point it falls from there is real knowledge.

And the number labs usually quote is not the loss itself but **perplexity**, which is just $e^{\text{loss}}$. A loss of 3.0 nats is a perplexity of 20.1, and the reading is a good one: the model is as uncertain as if it were choosing uniformly among 20 equally plausible tokens. A perplexity of 1 would be perfect prediction. A perplexity of 50,257 is a model that knows nothing at all.

> **Key idea.** Cross-entropy is not a design choice. It is maximum likelihood, written as a minimisation, read as an average surprise. The three things are the same thing.

## Step 13: one complete step, from logits to gradient

Everything in this note and [Article 3](notes/how-gradient-descent-works/) now joins up, and the join is unexpectedly beautiful.

The classifier produces logits $\mathbf{z} = (2.0, 1.0, 0.1)$, the softmax turns them into $(0.659, 0.242, 0.099)$, the true answer is dog, and the loss is $-\log(0.242) = 1.419$.

Article 3 says the next move is to find $\partial L / \partial z_i$, the gradient of the loss with respect to each logit, and walk it backwards. Softmax and logarithm both look unpleasant to differentiate, and in fact when you push the chain rule through the pair of them almost everything cancels. What survives is this:

$$
\boxed{\ \frac{\partial L}{\partial z_i} = p_i - y_i\ }
$$

The gradient on each logit is the probability the model gave, minus 1 for the correct class and minus 0 for the rest. Nothing else. For the example:

$$
\nabla_{\mathbf{z}} L = (0.659 - 0,\ 0.242 - 1,\ 0.099 - 0) = (0.659,\ -0.758,\ 0.099)
$$

Read it as instruction. The dog logit has a negative gradient, so stepping against it pushes dog **up**. Cat and car have positive gradients, so they get pushed **down**, and cat gets pushed down nearly seven times harder than car because the model was far more wrong about cat. The size of each correction is exactly how much probability was misplaced.

That simplicity is not a coincidence or a lucky cancellation. It is what happens when the loss is matched to the output layer: the log in cross-entropy undoes the exponential in softmax, and the error falls out directly. Every classifier and every language model you will ever train sends this vector backwards. The 124 million numbers of [Article 3's backward pass](notes/how-gradient-descent-works/#step-11) all begin life as "predicted minus actual".

## Bird's-eye view: one step of a real language model

The same loop at scale, with no step that was not above.

1. **In.** A batch of text, a few hundred thousand tokens. Each token becomes a vector by [Article 1](notes/word-embeddings-explained/), and passes through the blocks of [Article 2](notes/neural-network-layer-explained/).
2. **Logits.** The last layer produces 50,257 raw scores at **every position**, not just the last one, because every position has a known next token and so every position is a training example. A batch of 500,000 tokens therefore carries 500,000 separate predictions.
3. **Softmax.** Each of those 50,257-long score vectors becomes a distribution, with the maximum subtracted first so nothing overflows.
4. **Loss.** At each position, take the probability given to the token that actually came next and take its negative logarithm. Average over the batch. One number, which is the average surprise, in nats, of the model at real text.
5. **Backward.** Start the gradient at each position as predicted minus actual, and run [Article 3's backward pass](notes/how-gradient-descent-works/#step-9) to spread it over every weight.
6. **Update.** Step every weight against its gradient. Repeat a few hundred thousand times.

In practice, steps 3 and 4 are fused into a single operation rather than done separately, because computing the softmax and then its logarithm wastes precision for no reason, and because the combined gradient is the clean expression from Step 13. When you see `cross_entropy` applied to raw logits in a framework, that is what it is doing, and the fact that it takes logits rather than probabilities is a deliberate design choice, not an oddity.

## The whole idea in one line

You have now built the loss that nearly every model is trained on:

<div class="fs-flow">
<span>logits</span>
<span>softmax</span>
<span>a distribution</span>
<span>the probability it gave the truth</span>
<span>minus its logarithm</span>
<span>average over the data</span>
</div>

And the idea of this note, Idea 4 of the 44:

> **Idea 4.** A model's output is a distribution, the right way to score one is the surprise it assigns to what actually happened, and averaging that surprise gives cross-entropy, which is maximum likelihood wearing different clothes.

Article 1's idea was that meaning becomes geometry. Article 2's was that a model reshapes that geometry. Article 3's was that the reshaping can be corrected automatically. Article 4's is that the thing being corrected towards is not accuracy but honesty: a model is trained to hold beliefs whose confidence matches how the world actually turns out.

## Where this road leads

Four notes in, a complete learning system exists. Things become vectors, matrices and folds reshape them into a distribution, cross-entropy scores that distribution against what happened, and the gradient carries the correction back to every weight. There is nothing else in the core loop. Everything after this is about doing it well, doing it fast, or knowing whether to believe the result.

Two questions raised here get notes of their own. Cross-entropy came out of maximum likelihood in this note, but it can be derived a second way, from information and compression, and that route explains why "a good model" and "a good compressor" turn out to be the same claim. And calibration, the question of whether a model that says 70 percent is right 70 percent of the time, is its own subject with its own measurements and its own repairs.

## What this idea does not claim

It does not claim that a confident model is a correct one. Cross-entropy rewards confidence that is *earned*, and a model trained on wrong or skewed data will learn to be confidently wrong with no contradiction anywhere in the maths.

It does not claim that trained models are well calibrated in practice. [Guo and colleagues (2017)](https://arxiv.org/abs/1706.04599) showed that modern networks are systematically overconfident, and that the repair is often as simple as the temperature dial from Step 3, fitted after training. OpenAI's GPT-4 report shows the same thing from the other side: the pre-trained model's confidence tracks its accuracy closely, and the same model after reinforcement learning from human feedback is noticeably worse at it. Training on cross-entropy encourages calibration; later stages can undo it.

It does not claim probabilities are the same as decisions. "70 percent chance of harm" is a belief; whether to act on it depends on the cost of each kind of mistake, and that is a separate calculation using Step 7's expectation.

It does not claim that maximum likelihood is the only principle available. Bayesian methods keep a distribution over parameters instead of picking one, and for small data they are often better. And it does not claim that softmax is the only way to produce a distribution, only that it is the one whose gradient falls out as cleanly as Step 13 showed.

## The note in six lines

- A probability distribution is a list of non-negative numbers that adds to 1, and a model's output is one of those rather than a single answer.
- Softmax turns raw logits into a distribution by exponentiating and normalising, so only the *gaps* between logits matter, and dividing those gaps by a temperature sharpens or flattens the result.
- Bayes' rule converts $p(x \mid y)$ into $p(y \mid x)$, and the base-rate trap is what happens when they are confused: a 90 percent accurate test for a 1 percent disease gives a positive result that is right only 15 percent of the time.
- Maximum likelihood says to choose the parameters that make the observed data most probable; taking the logarithm turns that product into a sum, which is the only reason it survives contact with a computer.
- Surprise, $-\log p$, is forced rather than chosen: it is the only function that is zero at certainty and adds across independent events. Cross-entropy is that surprise averaged over the data, and for a single known answer it collapses to $-\log q(\text{correct})$.
- Because the logarithm undoes the exponential, the gradient of cross-entropy with respect to the logits is exactly $p_i - y_i$, predicted minus actual, which is where every backward pass in every classifier begins.

## Next in the series

Cross-entropy arrived here by one route, maximum likelihood. Article 5 takes the other one, and it is stranger.

Shannon built $-\log p$ to count the bits needed to send a message. That means a model's loss is not only a score; it is a **file size**. A model that predicts text well is a model that can compress text well, and the two statements are mathematically identical rather than merely analogous. Entropy is the floor nobody can compress past, cross-entropy is what your model actually pays, and the gap between them is precisely how much the model still does not know. Out of that comes a genuinely surprising claim about what these systems are doing at all: that prediction and understanding and compression may be three names for one thing.

After that comes optimisation. Having found the downhill direction in Article 3 and the thing to measure in this one, the remaining question is how far to step, and what momentum and adaptive learning rates do that plain gradient descent does not.

## Sources and further reading

**Papers and books cited in this note**

- T. Bayes (1763), [An Essay towards solving a Problem in the Doctrine of Chances](https://doi.org/10.1098/rstl.1763.0053), *Philosophical Transactions of the Royal Society*: published two years after his death by Richard Price.
- R. A. Fisher (1922), [On the mathematical foundations of theoretical statistics](https://doi.org/10.1098/rsta.1922.0009), *Philosophical Transactions of the Royal Society A* 222: maximum likelihood, and the paper that named "likelihood" and "parameter".
- C. E. Shannon (1948), [A Mathematical Theory of Communication](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x), *Bell System Technical Journal* 27: surprise, entropy, bits, and the origin of everything in Step 11.
- C. E. Shannon (1951), [Prediction and Entropy of Printed English](https://doi.org/10.1002/j.1538-7305.1951.tb01366.x), *Bell System Technical Journal* 30: an estimate of about one bit per letter of English, obtained by asking people to guess the next one.
- C. Guo, G. Pleiss, Y. Sun, and K. Q. Weinberger (2017), [On Calibration of Modern Neural Networks](https://arxiv.org/abs/1706.04599): modern networks are overconfident, and temperature scaling after training fixes much of it.
- A. Radford and colleagues (2019), [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf): GPT-2, the source of the 50,257 figure used throughout.
- OpenAI (2023), [GPT-4 Technical Report](https://arxiv.org/abs/2303.08774): includes the calibration comparison between the pre-trained model and the same model after reinforcement learning from human feedback.

**To learn more**

- 3Blue1Brown, [Bayes theorem, the geometry of changing beliefs](https://www.youtube.com/watch?v=HZGCoVF3YvM): the clearest visual account of Step 6.
- A. Karpathy, [The spelled-out intro to language modeling](https://www.youtube.com/watch?v=PaCmpygFfXo): builds a character-level model and derives the negative log-likelihood loss from counting, which is Steps 8 to 10 in code.
- D. MacKay, [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/) (free online), chapters 1 to 4: probability and information treated as one subject, which is what they are.
- I. Goodfellow, Y. Bengio, and A. Courville, [Deep Learning](https://www.deeplearningbook.org/) (free online), chapter 3 and section 5.5: probability, information, and maximum likelihood.
- My earlier notes on [word embeddings](notes/word-embeddings-explained/) (Article 1), [what a neural network layer is](notes/neural-network-layer-explained/) (Article 2), and [how gradient descent works](notes/how-gradient-descent-works/) (Article 3).
