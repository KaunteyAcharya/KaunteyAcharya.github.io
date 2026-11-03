---
title: "What Are Word Embeddings? Why AI Engineering Needs Vectors"
date: 2026-11-02
tags: [AI, maths]
summary: "A computer has no notion of meaning or context. This note builds word embeddings from nothing: why one number per word fails, why vectors work, and why the angle between two vectors tells you a cat is closer to a dog than to a car."
related: [what-is-rag, ml-vs-deep-learning, maths-physics-inside-llms]
---

<div class="fs-series">
<p><strong>AI from Scratch, Token by Token</strong> Â· Part 1</p>
<p>Starts from absolute zero. You need school coordinates (x, y), Pythagoras, and what cos Î¸ means. No coding. Boxes marked "Try it" are interactive.</p>
</div>

This note answers one question, from first principles: how can a computer, which can only add, multiply, and compare numbers, work with words and pictures at all? Answering it also explains how a machine can tell that a cat is more like a dog than like a car, and why the answer has to use vectors (lists of numbers) instead of single numbers. In short, each thing is described by a list of numbers, arranged so that similar things get similar lists, and similarity is then measured by the angle between those lists. Everything below builds that answer one step at a time, and each step uses only what came before it.

## About this series

My background is in physics. I wanted to understand what AI is at the level of theory, and how every piece of it is built from the ground up. I have been learningg it from textbooks, arXiv papers, lectures, and open-source repositories, and I asked AI tools when I had small doubts along the way. I am writing it down because it might help someone else on the same path.

The series follows a long guide I wrote on AI engineering, built on 44 core ideas, from how a word becomes numbers to how real AI products are tested, deployed, and kept safe. Each note covers one fundamental idea. It is written for anyone at the level of a class 11 student or above. Nothing is skipped with "it can be shown that", and every number is worked out as much as I can.

[I am learning this too, and I could have made a mistake. If you spot an inaccuracy, or want a separate, more detailed note on any part of this one, please write to me at [kaunteyacharya2000@gmail.com](mailto:kaunteyacharya2000@gmail.com) or on [LinkedIn](https://www.linkedin.com/in/kauntey-acharya).]

<details>
<summary>The eight parts of the series</summary>

1. **The language of learning** (ideas 1 to 6): vectors, matrices, gradients, probability, loss, and information. The mathss every model is made of.
2. **The nature of learning** (7 to 12): what it means for a machine to learn, why models overfit, and how they generalise.
3. **The machinery** (13 to 16): neural networks, backpropagation, and how training actually runs.
4. **Transformers and LLMs** (17 to 25): tokens, attention, and how ChatGPT-style models are built and trained.
5. **Building with models** (26 to 31): prompting, retrieval (RAG), tools, and agents.
6. **Knowing if it works** (32 to 35): evaluation and testing.
7. **Running in the real world** (36 to 40): cost, speed, monitoring, and safety.
8. **The engineer** (41 to 44): how to think and decide like an AI engineer.

</details>

## The question

Ask anyone whether a cat is more like a dog or more like a car, and they answer instantly. You know cats and dogs are both animals, both pets, both furry, both alive. A car shares none of that.

A computer does not understand natural language. Not English, not Hindi, not any human language. It does not know what a word is, and it has no idea what meanings are. When you type "cat", it does not picture an animal. It receives a pattern of electrical signals and stores it. Whatever "understanding" an AI system shows later in this series has to be built, layer by layer, on top of a machine that only handles numbers.

So to make a machine answer the cat question, we have to solve two problems, in order:

1. Turn "cat", "dog", and "car" into something a computer can work with.
2. Find a calculation on that something whose answer says "cat and dog are close, cat and car are not".

Let us start with what a computer actually is.

## Frog's-eye view: building it from the ground up

The next 15 steps stay at ground level: one small idea at a time, every number worked out by hand. After that, the bird's-eye view puts all the pieces together in one real search.

## Step 1: a computer only works with numbers

Inside a processorf there are billions of tiny switches called transistors. Each one is either off or on, which we write as 0 or 1. One such 0-or-1 value is a **bit**.

One bit can tell two things apart. Two bits give four patterns (00, 01, 10, 11). Every extra bit doubles the count, so 8 bits give $2^8 = 256$ patterns. A group of 8 bits is a **byte**, and one byte can store any whole number from 0 to 255.

To read a byte as a number, give each position a value, doubling from right to left:

$$
\begin{aligned}
01100011_2 &= 0\cdot128 + 1\cdot64 + 1\cdot32 + 0\cdot16 \\
&\quad + 0\cdot8 + 0\cdot4 + 1\cdot2 + 1\cdot1 \\
&= 99
\end{aligned}
$$

That is all the hardware has: numbers made of bits, and very fast circuits that add, multiply, and compare them. The processor (CPU) and graphics chip (GPU) do billions of these operations per second. They cannot "think about a cat".

So problem 1 has a fixed shape. Whatever we want an AI to handle, a word, a photo, a whole document, must first become numbers. And problem 2 has a fixed shape too: "similar" must become a calculation done with additions, multiplications, and comparisons.

## Step 2: the numbers a computer already stores

Text and pictures are already inside your computer as numbers. Before inventing anything, let us check whether those numbers are good enough.

### Text

Every character gets a number from one agreed worldwide table called **Unicode**. It covers more than 150,000 characters across the world's writing systems: the Latin script (English, German), Cyrillic (Russian), Devanagari (Hindi, Marathi), Arabic, Chinese characters, and many more, plus emoji. In it, `c` is 99, `a` is 97, and `t` is 116. These numbers are then stored as bytes by a rule called **UTF-8**: common English letters take 1 byte each, a Hindi letter takes 3, and an emoji takes 4. So "cat" is stored as the bytes 99, 97, 116, and 99 is exactly the `01100011` you decoded in Step 1.

<div class="fs-widget" data-widget="encode">
<p class="fs-fallback"><strong>Example:</strong> "cat" is stored as the numbers 99, 97, 116, which are the bytes 01100011 01100001 01110100 (24 bits). "Cat" with a capital C starts with 67 instead of 99. The Hindi word à¤¨à¤®à¤¸à¥à¤¤à¥‡ is 6 Unicode characters and 18 bytes.</p>
</div>

Type a few words and you will notice two things. "cat" and "Cat" are different numbers, though they mean the same animal. And "cat" and "kitten" share almost no numbers, though their meanings are close. These numbers record **which characters you typed**. They know nothing about what the word means.

(Modern language models do not read one letter at a time. They cut text into chunks called **tokens**, such as a common word or a piece like "un", and give each token an ID number. Tokens get their own note later. The point here stays the same: an ID records which piece of text it is, nothing more.)

### Pictures

A digital picture is a grid of tiny squares called **pixels**. In a grayscale picture each pixel stores one brightness number, say 0 for white and 1 for black. Read the grid row by row and you get one long list of numbers. A colour picture stores three numbers per pixel (red, green, and blue), so a 224 Ã— 224 colour picture, a size many vision models use, is

$$
224 \times 224 \times 3 = 150{,}528 \text{ numbers.}
$$

So a photo is already a list of numbers. Does that solve the problem? Try this before you decide.

<div class="fs-widget" data-widget="pixels">
<p class="fs-fallback"><strong>Experiment.</strong> Draw a "plus" sign on a 5 Ã— 5 grid: 9 black pixels, read row by row into a list of 25 numbers. Now move the same plus one pixel to the right. Only 4 of the 9 black squares are still in the same place, even though to your eye it is the same shape.</p>
</div>

The stored numbers say **where the ink is**, not **what the picture shows**. Move a cat one pixel, dim the light, or photograph a different cat, and the numbers change a lot.

So for both text and pictures, the numbers a computer already has are faithfuml records of the surface: these characters, this ink. They are not organised by meaning. We need new numbers, made for the job.

## Step 3: first attempt, one number per word

The simplest new scheme: give every word its own number.

$$
\begin{gathered}
\text{cat} = 17, \qquad \text{dog} = 9402, \\
\text{car} = 61, \qquad \text{banana} = 18
\end{gathered}
$$

The natural way to compare two numbers is their difference. So ask the numbers which words are close:

$$
\begin{gathered}
|17 - 18| = 1 \quad (\text{cat and banana}) \\
|17 - 9402| = 9385 \quad (\text{cat and dog})
\end{gathered}
$$

By these numbers a cat is almost a banana and nothing like a dog. Arithmetic gives nonsense too: cat + banana = 35. The closeness comes only from the order in which someone typed up the list. Numbers like these are fine as **labels** (they tell you *which* word), but a model that treats them as amounts will learn patterns that do not exist.

> A numerical representation is not automatically a meaningful one. The first is necessary. The second is what makes machine learning work.

Can we fix this by choosing the numbers carefully, so that similar words get nearby numbers? Try it with four fruits: apple, banana, orange, and lime.

Give each fruit one number for how sour it is, out of 10: banana 1, apple 3, orange 6, lime 9. On this line, orange sits near lime. Good: both are sour citrus fruits. But orange is now far from banana and apple, even though all three are fruits you would happily eat on their own as a snack, and lime is not.

So try a different number instead, "how often it is eaten on its own as a snack": apple 9, banana 9, orange 8, lime 1. Now orange sits with apple and banana. Good again. But orange and lime, both sour citrus, are now at opposite ends.

Whichever single number you choose, it sorts the fruits by one property and scrambles the others. That is the deeper reason one number is not enough, even a well-chosen one. Things are alike in many different ways at once: taste, use, colour, size, where they grow. **Each number can carry only one way of being alike.**

## Step 4: second attempt, one slot per word

If one number per word creates fake closeness, give each word its own separate position instead. With a vocabulary of 6 words, each word becomes a list of six numbers with a single 1:

$$
\begin{aligned}
\text{cat} &= (1, 0, 0, 0, 0, 0) \\
\text{kitten} &= (0, 1, 0, 0, 0, 0) \\
\text{dog} &= (0, 0, 1, 0, 0, 0), \ \dots
\end{aligned}
$$

This is called **one-hot encoding**. The fake closeness is gone: any two different words differ in exactly two places, so every pair is equally different. That is fair, but it is also empty. Cat is exactly as different from kitten as from banana. Nothing has been learned about anything.

It is also wasteful. Real vocabularies have 50,000 or more tokens, so each word would be a list of 50,000 numbers with one 1 and 49,999 zeros.

Still, this attempt taught us something useful: a word does not have to be *one* number. It can be a *list* of numbers. What we want is a short list in which every number carries information.

## Step 5: the fix, describe each thing with several numbers

In Step 3 (one number per word), a single number could sort the fruits by only one property at a time. So use two numbers, one for each property, and keep both:

$$
\begin{aligned}
\text{banana} &= (1,\ 9) & \text{apple} &= (3,\ 9) \\
\text{orange} &= (6,\ 8) & \text{lime} &= (9,\ 1)
\end{aligned}
$$

The first number is sourness and the second is "eaten on its own as a snack". Plot these as points on graph paper, with sourness across and snack along the vertical. Banana and apple sit together at the top left. Lime sits alone at the bottom right. Orange sits at the top, with the snack fruits, but further right than banana and apple, towards lime. Both of its relationships are now visible at once, which no single number could manage. Adding a second number added a second way of being alike.

> **Definition.** A **vector** in $\mathbb{R}^d$ is an ordered list of $d$ real numbers, $\mathbf{x} = (x_1, x_2, \dots, x_d)$. Each $x_i$ is a **component** (or coordinate) of the vector, and $d$ is its **dimension**. The symbol $\mathbb{R}$ stands for the real numbers.

A vector with 2 components lives in 2-dimensional space, one with 3 components in 3-dimensional space, and so on. The same vector can be seen in three ways, and you will use all three:

1. **A list:** (0.8, 0.2, 0.9). This is how the computer stores it.
2. **A point:** go 0.8 along the first axis, 0.2 along the second, 0.9 along the third. This is where it sits.
3. **An arrow:** from the origin (0, 0, 0) to that point. An arrow has a **length** and a **direction**, and both will matter.

With a third number, say crunchiness, apple would move away from banana while orange and lime stayed close. Every new number is another property the points can be arranged by.

So vectors solve problem 1 in principle. But a new question appears at once. Here *I* chose what each number means: sourness, snack, crunchiness. To describe 50,000 words this way, someone would need to invent hundreds of features and score every word on every one by hand. Nobody can do that. Who picks the numbers?

## Step 6: letting language draw the map

The answer comes from an old observation. In 1957 the linguist J. R. Firth wrote, "You shall know a word by the company it keeps." Look at these sentences:

> The cat chased the mouse. The dog chased the ball. The kitten chased the bird.

"Cat", "dog", and "kitten" turn up in the same kinds of places, next to the same kinds of words. "Car" and "truck" keep different company: "drove", "parked", "road".

Firth was not alone. A few years earlier, the linguist Zellig Harris argued that words which occur in similar contexts tend to have similar meanings, an idea now called the **distributional hypothesis** ([Harris, 1954](https://doi.org/10.1080/00437956.1954.11659520)). In philosophy, Ludwig Wittgenstein had argued that the meaning of a word lies largely in how it is used. Machines would turn this old idea into arithmetic.

We can turn that observation into numbers with nothing but counting. Take a large pile of text. For each word, count how often it appears near a few context words. Here are toy counts:

| word | chased | fed | purred | barked | drove | parked |
|---|---|---|---|---|---|---|
| cat | 12 | 9 | 6 | 0 | 0 | 0 |
| kitten | 4 | 3 | 2 | 0 | 0 | 0 |
| dog | 10 | 8 | 0 | 7 | 0 | 0 |
| car | 0 | 0 | 0 | 0 | 11 | 9 |
| truck | 1 | 0 | 0 | 0 | 7 | 9 |
| scooter | 0 | 0 | 0 | 0 | 2 | 1 |

Each row is a list of numbers, so each row is a vector. Look at what happened:

- The rows for cat and dog look alike: big numbers on the left, zeros on the right. Car and truck look alike the other way round.
- **Nobody labelled anything.** No one wrote "cat is an animal". The pattern came from the text alone.
- Kitten's row is exactly one third of cat's row. Kitten is a rarer word, so all its counts are smaller, but the *pattern* is identical.

Keep that last point in mind; it becomes important in Step 8.

> **Key idea.** This is how language creates geometry: words used in similar ways get similar vectors.

Some well-known methods, such as [GloVe](https://aclanthology.org/D14-1162/) (2014), start from co-occurrence counts like these. Others, such as [word2vec](https://arxiv.org/abs/1301.3781) (2013), train a small network to predict a word's neighbours and adjust the vectors until the predictions are good. Either way, the real table would have tens of thousands of columns, so these methods squeeze each word down to a few hundred numbers that keep the same pattern of who is alike. Word2vec used 300 numbers per word; BERT-base (2018) uses 768.

> **Definition.** A learned vector like this is called an **embedding**. It is short (typically 256 to 4,096 numbers), every number carries information, and things used in similar ways get similar vectors.

*How* the squeezing and training actually work needs probability, loss functions, and gradients, which come later in this series. Word2vec's training will get its own note, from first principles, once those pieces are in place. For now, take it that training produces vectors like these. If you want to read ahead, the chapter on embeddings in Jurafsky and Martin's free textbook [Speech and Language Processing](https://web.stanford.edu/~jurafsky/slp3/) and the first lecture of Stanford's [CS224N course](https://www.youtube.com/watch?v=rmVRLeJRkl4) both cover word vectors carefully.

The same idea works for pictures. An image model is trained on millions of pictures and learns to output a vector for each one, arranged so that two photos of a cat land near each other even when every raw pixel differs. That is exactly what the pixel experiment in Step 2 was missing.

## Step 7: from words to sentences

A search box receives sentences, not single words. How does a whole sentence become one vector?

The simplest method uses only what you already know: add up the word vectors and divide by how many there are. That is the **average**, the same as the average of marks in a class, done one coordinate at a time. If "cat" is (2.9, 2.1) and "dog" is (3.4, 1.7), their average is

$$
\left( \frac{2.9 + 3.4}{2},\ \frac{2.1 + 1.7}{2} \right) = (3.15,\ 1.9)
$$

which sits between them, in the "animal" area. Try it with whole sentences.

<div class="fs-widget" data-widget="sentence">
<p class="fs-fallback"><strong>Averaging a sentence.</strong> On a toy 2D map, "the cat chased the dog" has word vectors the = (0.1, 0.1), cat = (2.9, 2.1), chased = (1.6, 0.8), the = (0.1, 0.1), and dog = (3.4, 1.7). Their average, about (1.65, 0.96), points into the animal area. "the dog chased the cat" contains the same words, so it gets exactly the same average.</p>
</div>

Averaging works surprisingly well for simple search, and it shows the idea: a sentence can be one point in the same space as the words. But the widget also shows its flaw. "The dog chased the cat" and "the cat chased the dog" get the identical vector, because adding numbers does not care about order. Who did the chasing is lost.

Words also change meaning with their neighbours. "Bank" in "I deposited money in the bank" and in "we sat on the river bank" are different things, but a fixed vector per word gives both the same point.

Modern language models fix both problems. They read the whole sentence at once and give each word a vector that depends on its neighbours (a **contextual** vector), so the two "bank"s get different vectors and word order matters.

[Before transformers, the usual tool was a **recurrent neural network**, such as an LSTM. It reads a sentence one word at a time and carries a running summary forward, a bit like reading with your finger under the line. [ELMo](https://arxiv.org/abs/1802.05365) (2018) used this to give each word a vector that depends on its sentence. It worked, but the summary tends to fade over long passages, and reading strictly one word after another is slow to train.]

[A **transformer** works differently. Every word looks at every other word in the sentence at the same time and decides how much each one matters to it. "Bank" looks at "river" or at "money" and adjusts its own vector accordingly. The position of each word is added as extra information, so order is not lost. This looking-around step is called **attention**, introduced in [Attention Is All You Need](https://arxiv.org/abs/1706.03762) (2017).]

How transformers do this in detail is a whole part of the series, later on. The principle stays the same as with single words: **a sentence, a paragraph, or a whole document becomes one vector,** and similar meanings should get similar vectors.

So problenm 1 is solved: anything becomes a vector. Now problem 2: what calculation says "similar"?

## Step 8: closeness as distance

A vector in $\mathbb{R}^d$ can be identified with a point in $d$-dimensional space: the tip of its arrow from the origin. So the first measure to try is the **Euclidean distance**, the straight-line distance between the two points. In 2D, for $\mathbf{a} = (a_1, a_2)$ and $\mathbf{b} = (b_1, b_2)$, Pythagoras gives

$$
\text{distance} = \sqrt{(a_1 - b_1)^2 + (a_2 - b_2)^2}
$$

The same rule extends to any number of dimensions, with one squared difference for each component:

$$
\|\mathbf{a} - \mathbf{b}\| = \sqrt{\sum_{i=1}^{d} (a_i - b_i)^2}
$$

The symbol $\sum_{i=1}^{d}$ means "add up the terms for $i = 1, 2, \dots, d$". The double bars $\|\ \|$ denote the **norm** (length) of a vector, which is its distance from the origin:

$$
\|\mathbf{a}\| = \sqrt{a_1^2 + a_2^2 + \dots + a_d^2}
$$

Quick check with one-hot vectors from Step 4: cat and dog differ in two places, by 1 each, so their distance is $\sqrt{1 + 1} = \sqrt{2}$. Every pair of different words is $\sqrt{2}$ apart, which is the "fair but empty" result in numbers.

Now use distance on the count table from Step 6:

$$
\begin{aligned}
\text{kitten to cat:}\ & \sqrt{(4-12)^2 + (3-9)^2 + (2-6)^2} = \sqrt{116} \approx 10.8 \\
\text{kitten to scooter:}\ & \sqrt{4^2 + 3^2 + 2^2 + 2^2 + 1^2} = \sqrt{34} \approx 5.8
\end{aligned}
$$

By distance, a kitten is closer to a scooter than to a cat. That is clearly wrong, and the reason is the point from Step 6 (kitten's row is one third of cat's). Kitten and scooter are both *rare* words, so both rows are short arrows near the origin, and short arrows are always near each other. Cat is a common word with a long arrow, so it is far from kitten even though it points the same way.

> **Key idea.** A vector carries two kinds of information: its **length**, which here mostly reflects how common the word is (for documents, often how long the document is), and its **direction**, which carries the pattern, and the pattern is what we mean by meaning.

Distance mixes the two. We need a measure of direction alone. It is built from one simple operation.

## Step 9: direction and the dot product

> **Definition.** The **dot product** (also called the scalar product or inner product) of two vectors $\mathbf{a}, \mathbf{b} \in \mathbb{R}^d$ is the sum of the products of their corresponding components:
>
> $$\mathbf{a} \cdot \mathbf{b} = a_1 b_1 + a_2 b_2 + \dots + a_d b_d = \sum_{i=1}^{d} a_i b_i$$

For $\mathbf{a} = (2, 3)$ and $\mathbf{b} = (4, 1)$:

$$
\mathbf{a} \cdot \mathbf{b} = (2)(4) + (3)(1) = 8 + 3 = 11
$$

The result is a single number (a scalar), computed with only additions and multiplications, which a computer does best. But why should this have anything to do with direction? Here is the reason, using class 11 trigonometry.

Draw $\mathbf{a}$ and $\mathbf{b}$ as arrows from the origin, with angle $\varphi$ between them. The line joining their tips makes a triangle, and the length of that third side is $\|\mathbf{a} - \mathbf{b}\|$. We can compute that length in two ways.

*Way 1: the cosine rule.* For a triangle with sides $p$ and $q$ and angle $\varphi$ between them, the third side $r$ satisfies $r^2 = p^2 + q^2 - 2pq\cos\varphi$. So

$$
\|\mathbf{a} - \mathbf{b}\|^2 = \|\mathbf{a}\|^2 + \|\mathbf{b}\|^2 - 2\|\mathbf{a}\|\|\mathbf{b}\|\cos\varphi
$$

*Way 2: expand the coordinates.* In 2D,

$$
\begin{aligned}
\|\mathbf{a} - \mathbf{b}\|^2 &= (a_1 - b_1)^2 + (a_2 - b_2)^2 \\
&= (a_1^2 + a_2^2) + (b_1^2 + b_2^2) - 2(a_1 b_1 + a_2 b_2)
\end{aligned}
$$

which is $\|\mathbf{a}\|^2 + \|\mathbf{b}\|^2 - 2\,(\mathbf{a} \cdot \mathbf{b})$. The same expansion works in any number of dimensions.

Both ways compute the same length, so the right-hand sides are equal. Cancel $\|\mathbf{a}\|^2 + \|\mathbf{b}\|^2$ from both sides and divide by $-2$:

$$
\boxed{\ \mathbf{a} \cdot \mathbf{b} = \|\mathbf{a}\|\,\|\mathbf{b}\|\cos\varphi\ }
$$

The component formula, which never mentions an angle, secretly contains the angle between the arrows. (For a visual explanation of why, see 3Blue1Brown's [Dot products and duality](https://www.youtube.com/watch?v=LyGKycYT2v0).) Lengths are never negative, so the sign of the dot product comes from $\cos\varphi$:

| Angle $\varphi$ | $\cos\varphi$ | Dot product | Meaning |
|---|---|---|---|
| 0Â° | 1 | largest, $\|\mathbf{a}\|\|\mathbf{b}\|$ | same direction |
| 90Â° | 0 | 0 | unrelated (perpendicular) |
| 180Â° | âˆ’1 | most negative | opposite directions |

Drag the arrows and watch it happen.

<div class="fs-widget" data-widget="angle">
<p class="fs-fallback"><strong>Worked example.</strong> For a = (2, 3) and b = (4, 1): a Â· b = 11, |a| = âˆš13 â‰ˆ 3.61, |b| = âˆš17 â‰ˆ 4.12, so cos Ï† = 11 / (3.61 Ã— 4.12) â‰ˆ 0.74 and Ï† â‰ˆ 42.3Â°. If b is doubled to (8, 2), the dot product doubles to 22 but cos Ï† stays 0.74.</p>
</div>

Press "Make b longer". The dot product doubles, but the angle does not move. So the dot product still mixes direction and length, the same problem distance had. One more step removes the length.

## Step 10: cosine similarity

Divide the dot product by both lengths. From the boxed result, what is left is exactly the cosine of the angle.

> **Definition.** The **cosine similarity** of two non-zero vectors is
>
> $$\cos(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{\|\mathbf{a}\|\,\|\mathbf{b}\|} = \cos\varphi$$
>
> It always lies between $-1$ and $1$, and it depends only on the directions of the vectors, not on their lengths.

Test it on the case that fooled distance. Kitten = (4, 3, 2, 0, 0, 0) is exactly one third of cat = (12, 9, 6, 0, 0, 0), so the two arrows point the same way and $\cos = 1$. Kitten and scooter share no non-zero position, so every product in their dot product is zero, and $\cos = 0$. Kitten is now a perfect match for cat and unrelated to scooter, which is what we wanted.

### Cat, dog, and car by hand

Here are cat, dog, and car squeezed to 3 numbers each, like the compression described in Step 6 (real embeddings are much longer, but the arithmetic is identical):

$$
\begin{aligned}
\textbf{cat} &= (0.9,\ 0.8,\ 0.1) \\
\textbf{dog} &= (0.8,\ 0.9,\ 0.2) \\
\textbf{car} &= (0.1,\ 0.2,\ 0.9)
\end{aligned}
$$

**Cat and dog.** The dot product:

$$
\begin{aligned}
\textbf{cat} \cdot \textbf{dog} &= (0.9)(0.8) + (0.8)(0.9) + (0.1)(0.2) \\
&= 0.72 + 0.72 + 0.02 = 1.46
\end{aligned}
$$

The lengths:

$$
\begin{aligned}
\|\textbf{cat}\| &= \sqrt{0.81 + 0.64 + 0.01} = \sqrt{1.46} \approx 1.208 \\
\|\textbf{dog}\| &= \sqrt{0.64 + 0.81 + 0.04} = \sqrt{1.49} \approx 1.221
\end{aligned}
$$

So

$$
\cos(\textbf{cat}, \textbf{dog}) = \frac{1.46}{1.208 \times 1.221} \approx 0.990
$$

**Cat and car.** The dot product is $(0.9)(0.1) + (0.8)(0.2) + (0.1)(0.9) = 0.09 + 0.16 + 0.09 = 0.34$, and $\|\textbf{car}\| = \sqrt{0.01 + 0.04 + 0.81} = \sqrt{0.86} \approx 0.927$. So

$$
\cos(\textbf{cat}, \textbf{car}) = \frac{0.34}{1.208 \times 0.927} \approx 0.303
$$

That answers the question from the top of the note: 0.990 for cat and dog, 0.303 for cat and car. Notice that **the maths knew nothing about cats.** It only multiplied and added. All the meaning came from how the vectors were arranged, and that arrangement came from how words are used.

<div class="fs-widget" data-widget="cosine3d">
<p class="fs-fallback"><strong>The three pairs.</strong> cos(cat, dog) â‰ˆ 0.990, cos(cat, car) â‰ˆ 0.303, and cos(dog, car) â‰ˆ 0.389. Cat and dog point almost the same way (about 8Â° apart), while car points elsewhere (about 72Â° from cat).</p>
</div>

The pixel experiment from Step 2 can now be scored the same way. The plus has 9 black pixels and the shifted plus has 8 (one fell off the edge), with 4 in common. With 1 for black and 0 for white, the dot product counts the shared black pixels, so the cosine is $4 / (\sqrt{9}\sqrt{8}) \approx 0.47$. To your eye the two pictures are the same shape; to raw pixels they are less than half alike.

Now you have everything needed to compare the three ways of giving words numbers side by side.

<div class="fs-widget" data-widget="schemes">
<p class="fs-fallback"><strong>Three schemes compared.</strong> With ID numbers, the word "closest" to cat is banana (difference 1). With one-hot vectors, every pair of different words has cosine 0. With learned vectors, the closest word to cat is kitten, then dog, while car, truck, and banana are far away.</p>
</div>

## Step 11: nearest-neighbour search

Once you can score similarity, search is one more step. Store a vector for every item in a collection: $\mathbf{v}_1, \mathbf{v}_2, \dots, \mathbf{v}_N$. When a question arrives, turn it into a vector $\mathbf{q}$ with the same model (as in Step 7, where sentences became vectors), score it against every stored vector, and return the best:

$$
\text{best match} = \arg\max_{i}\ \cos(\mathbf{q}, \mathbf{v}_i)
$$

"$\arg\max_i$" means "the $i$ that gives the largest value". [An everyday example: in a cricket scorecard, the max is the highest score, say 112; the argmax is the batter who scored it. Search wants the argmax, the stored item itself, not just the best score. Wikipedia's article on [arg max](https://en.wikipedia.org/wiki/Arg_max) has the formal definition.] In words: find the stored item whose arrow points most nearly the same way as the question's arrow. This is called **nearest-neighbour search**, because the answer is the stored point nearest to the question in direction.

This is **semantic search**: search by meaning instead of by matching letters. The query "small pet animal" can find a passage about kittens even though it never says "kitten". The same calculation drives recommendations ("people who liked this also liked"), grouping similar items (clustering), and spotting duplicates. It is also the "retrieval" in [retrieval-augmented generation (RAG)](notes/what-is-rag/): before an AI answers from your documents, it finds the relevant passages exactly this way.

<div class="fs-widget" data-widget="search">
<p class="fs-fallback"><strong>Toy search.</strong> On a small map of 18 words in four groups (animals, vehicles, food, and feelings), the query "small pet animal" returns cat, kitten, and puppy as its three nearest neighbours by cosine similarity.</p>
</div>

Now switcvh the ranking to "distance" and click near the centre of the map. A short query arrow there is roughly the same distance from every word, so the top results become a mix of animals, vehicles, and food. That is the kitten-and-scooter problem again. Switch back to cosine and the groups return, because cosine looks only at direction.

## Step 12: why normalisation matters

Search with a raw dot product, without dividing by the lengths, and long vectors win unfairly. Take

$$
\mathbf{a} = (1, 1), \qquad \mathbf{b} = (10, 10), \qquad \mathbf{c} = (5, 0).
$$

$\mathbf{a}$ and $\mathbf{b}$ point exactly the same way, and $\mathbf{c}$ points 45Â° away. The dot products are $\mathbf{a} \cdot \mathbf{b} = 20$ and $\mathbf{a} \cdot \mathbf{c} = 5$, so far so good. But compare a fourth vector $\mathbf{d} = (50, 0)$, which points the same way as $\mathbf{c}$: $\mathbf{a} \cdot \mathbf{d} = 50$, more than double the score of the perfect match $\mathbf{b}$. A long document, or a very common word, can beat a better match just by being long.

The fix is to normalise.

> **Definition.** To **normalise** a non-zero vector is to divide it by its own norm. The result is a **unit vector**, with the same direction and length 1:
>
> $$\hat{\mathbf{x}} = \frac{\mathbf{x}}{\|\mathbf{x}\|}, \qquad \|\hat{\mathbf{x}}\| = 1.$$

For example, $(3, 4)$ has length 5, so it becomes $(0.6, 0.8)$, which has length $\sqrt{0.36 + 0.64} = 1$. The direction is unchanged; only the length is reset.

Normalising helps in three ways:

1. **The dot product becomes the cosine.** Both lengths are 1, so the boxed formula gives $\hat{\mathbf{a}} \cdot \hat{\mathbf{b}} = \cos\varphi$. No division is needed at search time.
2. **It is fast.** Real systems normalise every stored vector once, when it is saved. After that, each comparison is a single dot product, which hardware is built to do quickly.
3. **Distance and cosine agree.** Put lengths of 1 into the cosine-rule equation from Step 9 (Way 1): $\|\hat{\mathbf{a}} - \hat{\mathbf{b}}\|^2 = 1 + 1 - 2\cos\varphi = 2 - 2\cos\varphi$. A bigger cosine always means a smaller distance, so ranking by either gives the same order, and the kitten-and-scooter problem cannot happen.

Is length always useless? No. In some representations the length carries a real signal, and research has measured it:

- **Words.** In word2vec-style embeddings, a word's vector length is linked to how frequent and how informative the word is. [Schakel and Wilson (2015)](https://arxiv.org/abs/1508.02297) used vector length to measure a word's significance, and [Oyama, Yokoi, and Shimodaira (2023)](https://arxiv.org/abs/2212.09663) showed that the norm of a word embedding encodes the word's information gain.
- **Faces.** In face recognition, [MagFace (2021)](https://arxiv.org/abs/2103.06627) trains the length of each face embedding to reflect the quality of the photo: clear, frontal faces get longer vectors than blurry or turned-away ones. The direction says *who*; the length says *how reliable* the picture is.

So whether to normalise depends on what length means in your representation. For most text search, direction is what you want.

## Step 13: high-dimensional geometry

Real embeddings use 768 or 1,536 numbers. Why so many?

Recall the fruits. With one number per fruit (Step 3), sorting by sourness separated orange from banana, and sorting by snack use separated orange from lime. With two numbers (Step 5), each fruit could be placed by both properties at once, and both relationships showed up together. Each additional component gives room for one more independent way in which things can be alike or different: size, colour, formality, topic, tense, and thousands of patterns with no simple name. To place hundreds of thousands of words, phrases, and documents so that many kinds of similarity hold at the same time, a model needs a lot of room.

Nothing about the maths changes with more numbers. With 1,024 numbers, the dot product is still "multiply matching numbers and add", just with 1,024 terms:

$$
\mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{1024} a_i b_i
$$

What changes is how the space behaves, and it surprises everyone the first time. Pick two completely random vectors. In 2D they often point roughly the same way by pure chance. In 1,000 dimensions they are almost always nearly perpendicular. For random vectors with $d$ numbers, the cosine is centred on 0 with a typical spread of about

$$
\text{spread} \approx \frac{1}{\sqrt{d}}, \qquad \text{e.g. } \frac{1}{\sqrt{1024}} = \frac{1}{32} \approx 0.031
$$

The figure below generates random vectors in your browser and measures them.

<div class="fs-widget" data-widget="highdim">
<p class="fs-fallback"><strong>Random vectors.</strong> For 600 pairs of random vectors with 768 numbers each, the cosine similarities cluster tightly around 0 with a spread of about 0.036 (theory: 1/âˆš768 â‰ˆ 0.036), and practically none reach 0.3. In 2 dimensions, the same experiment gives cosines spread across the whole range from âˆ’1 to 1.</p>
</div>

Two practical lessons follow. First, in 1,000 dimensions a cosine of 0.3 can be a strong signal, because chance alone almost never produces it; in 2D, 0.3 would mean nothing. Second, there is no universal "relevant" score. What counts as high depends on the space and the model.

And one warning: **more dimensions give room, not meaning.** A random 1,024-number vector means nothing at all. Training is what arranges the room so that useful relationships show up.

## Step 14: directions can carry relationships

So far, we have compared vectors by how close they are. But the difference of two vectors, $\mathbf{b} - \mathbf{a}$, is also a vector: the arrow from the tip of $\mathbf{a}$ to the tip of $\mathbf{b}$. In trained embeddings, some of these difference arrows turn out to mean something, without anyone building it in. The best-known example, from word2vec research by Tomas Mikolov and colleagues in 2013, is

$$
\mathbf{v}_{\text{king}} - \mathbf{v}_{\text{man}} + \mathbf{v}_{\text{woman}} \approx \mathbf{v}_{\text{queen}}
$$

Read it as arrows: the step from "man" to "woman" is roughly the same arrow as the step from "king" to "queen". Start at king, take that step, and you land near queen.

<div class="fs-widget" data-widget="analogy">
<p class="fs-fallback"><strong>Analogy as arithmetic.</strong> In a toy 2D map, the arrow from "man" to "woman" is (0.2, 2.0). Starting at "king" and adding that arrow lands at (4.8, 3.2), and the nearest word to that point is "queen".</p>
</div>

Do not over-learn this. Not every relationship is a clean arrow, and analogy tests in real models work only approximately and only some of the time. The lasting lesson is smaller and still remarkable: relationships between ideas can show up as relationships between vectors.

## Step 15: the numbers do not need human labels

In Step 5 (the fruit vectors), I gave every number a name: sourness, snack use, crunchiness. That was for teaching. In a real embedding, no number has a name, and it is a mistake to look for "the animal number".

You can see why from the count table in Step 6. Its columns did have names, the context words "chased", "fed", and so on. But a real table has tens of thousands of columns, and the model squeezes them down to a few hundred numbers. Each of the new numbers is a blend of thousands of old columns, a bit of "chased", minus a bit of "drove", plus a bit of "vet", and so on. No single human word describes that blend.

So a concept like "animal" is usually a **direction** made from many coordinates together, something like

$$
0.4x_1 - 0.2x_7 + 0.8x_{19} - 0.1x_{52} + \cdots
$$

and not one coordinate. The man-to-woman arrow in Step 14 works the same way: it is a direction in the space, and it need not line up with any single axis. This is called a **distributed representation**, an idea developed in the 1980s by Geoffrey Hinton, James McClelland, and David Rumelhart.

> **Key idea.** A representation can be meaningful as geometry without any single number being readable by a person.

Brain science has a similar debate. Is a concept such as "my grandmother" stored in one dedicated neuron, or spread across many? A well-known study ([Quian Quiroga and colleagues, 2005](https://doi.org/10.1038/nature03687)) recorded single neurons in the human brain that responded to one particular person across very different photos. Even so, such neurons are understood to work as part of larger groups, and the question of how concepts are coded in the brain is still being studied. Researchers likewise sometimes find readable directions inside AI models, but the idea in this note does not depend on that.

So if no person labels the numbers, who sets them? The answer, in one paragraph: a model starts with random numbers and is shown enormous amounts of text (books, articles, websites). It plays a guessing game with that text, such as predicting a hidden or next word. The text itself supplies the right answers, so no human labelling is needed; this is called **self-supervised learning**. Every wrong guess nudges all the numbers slightly in the direction that would have made the guess better. After billions of nudges, words that keep similar company end up with similar vectors, because that is what makes the guesses good. Images work the same way, with a different guessing game. Each piece of this, the guessing game (probability), the measure of a wrong guess (loss), and the nudging (gradients), gets its own note from first principles later in the series.

## Bird's-eye view: one real search, followed number by number

Now step back and watch every piece work together. Here is a single query going through a real semantic search system. Say you search a help centre for "my screen keeps freezing".

1. **Characters to bytes.** The query is 24 characters, stored as 24 bytes of UTF-8, which is 192 bits (Steps 1 and 2: bits and character codes).
2. **Bytes to tokens.** A tokenizer cuts it into pieces such as "my", " screen", " keeps", " free", "zing", and replaces each with its ID from a vocabulary of tens of thousands of tokens. These IDs are still labels with no meaning (Step 3: why ID numbers carry no meaning).
3. **Tokens to one vector.** An embedding model reads the IDs and outputs one contextual vector for the whole query, say 768 numbers (Steps 6 and 7: embeddings and sentence vectors). This is where meaning enters. [The model's numbers were set during training by the self-supervised guessing game described in Step 15: predict missing or next words across enormous amounts of text, and nudge every number after each wrong guess.]
4. **Normalise.** Divide the vector by its norm, so it has length 1 (Step 12: normalisation).
5. **Compare.** Earlier, every help article was embedded with the same model, normalised, and stored. Suppose there are 1,000,000 passages. Each score is one dot product of 768 multiplications and additions, about 768 million operations in total, which a modern computer does in well under a second. Large systems go faster still with an index that skips most comparisons (Step 11: nearest-neighbour search).
6. **Rank and return.** The top five scores, perhaps 0.62, 0.58, 0.55, 0.41, and 0.40, are returned. The article "Fixing a frozen display" comes first even though it shares no words with your query, because its arrow points the same way.
7. **In RAG,** those five passages are then handed to a language model as reading material, and it writes an answer from them.

Every later note in this series zooms into one of these steps.

## The whole idea in one line

You have now built every piece of this pipeline yourself, from the ground up:

<div class="fs-flow">
<span>a thing (word, sentence, photo)</span>
<span>a vector</span>
<span>a point and an arrow in space</span>
<span>angles between arrows</span>
<span>similarity, search, prediction</span>
</div>

And the idea of this note, Idea 1 of the 44:

> **Idea 1.** A good representation turns the relationships that matter into geometry that is easy to measure.

Raw character codes and raw pixels are representations, but the relationships that matter (meaning, the object in the picture) are not visible in their geometry. Learned embeddings are representations in which they are.

## Where this road leads

Pause on how far we have come, and how far there is to go.

We started with a machine that only knows switches that are off or on. It has no idea what a word is. Everything in this note was additions, multiplications, and compparisons of numbers, nothing more. Yet with these alone, a cat already lands next to a dog and far from a car, and a question about a frozen screen finds an article that shares none of its words.

The rest of this series climbs from here. Stack the same kind of arithmetic into matrices, let them learn from enormous amounts of text, and arrange them into deep networks and transformers, and you reach systems that answer questions, translate between languages, write poems, summarise papers, and work through a maths problem step by step, in a way that looks like reasoning. Underneath it all, it is still numbers in, numbers out.

Whether such a system truly "understands" is an open question. Philosophers have argued about it for decades, most famously in John Searle's Chinese Room argument ([Searle, 1980](https://doi.org/10.1017/S0140525X00005756)), and the debate is livelier than ever. What is not in question is the climb itself: from bits, to vectors, to systems that can hold a conversation. This series follows that climb, token by token.

## Four easy mistakes, and how to avoid them

These are the places where people who understand the idea still go wrong in real projects.

### 1. Feeding ID numbers to a model as if they were amounts

Product 900 and product 901 are not similar because their IDs are neighbours. This is the problem from Step 3 (one number per word), in a shop: an ID says *which* item; it says nothing about *what kind* of item.

**Instead:** use IDs only to look things up. Give the model a learned embedding for each item.

### 2. Comparing vectors from two different models

Model A and model B may both output 768 numbers, but each learned its own coordinate system. Number 1 in one model has nothing to do with number 1 in the other, so a cosine between their vectors is meaningless, however high it looks. Same number of dimensions does not mean the same space. It is like comparing two maps drawn by different people, each with their own scale and their own north.

**Instead:** embed the documents and the queries with the same model. If you switch models, re-embed everything.

### 3. Letting length decide

A raw dot product rewards long vectors, so long documents and common words win searches they should not (Step 12: normalisation).

**Instead:** use cosine similarity, or normalise every vector first. Keep the raw length only if you know what it means in your system.

### 4. Treating one score as truth everywhere

"0.8 means relevant" is false. Step 13 (high-dimensional geometry) showed that the same number means different things in different spaces, and different models spread their scores differently.

**Instead,** set the cut-off from your own data:

1. Collect pairs you know are related, and pairs you know are not.
2. Compute the cosine for every pair.
3. Look at the two groups of scores side by side.
4. Choose the cut-off that separates them best for your task.

If the two groups overlap heavily, no cut-off can fix it. The representation itself cannot tell those things apart, and you need a better model or better data.

## What this idea does not claim

It does not say that similar things always get nearly identical vectors, that every number in a vector has a human meaning, that cosine similarity is always the right measure, that more dimensions are automatically better, or that one threshold works for every model. And it does not make similarity an absolute fact about the world. Similarity is always *according to a particular model*, trained on particular data, for a particular purpose.

## The note in six lines

- A computer only adds, multiplies, and compares numbers, so every word, picture, or document must become numbers, and "similar" must become a calculation.
- Stored character codes and raw pixels are numbers, but they record the surface; shifting a 9-pixel plus by one square keeps only 4 pixels in place.
- One number per word fails because each number carries only one way of being alike. A list of numbers, a vector, carries many.
- Learned vectors (embeddings) come from usage: words that keep similar company get similar vectors, with no human labels. Sentences become vectors too.
- Cosine similarity, $\mathbf{a} \cdot \mathbf{b} / (\|\mathbf{a}\|\|\mathbf{b}\|)$, compares directions and ignores length. For the toy vectors here, cat and dog score 0.990 and cat and car score 0.303. Normalising first makes it a single dot product.
- In 768 dimensions, random vectors have cosines of about $0 \pm 0.036$, so scores must be judged against the space they come from, never against a universal cut-off.

## Test yourself

Try each one on paper before opening the answer.

**1.** Why is "cat = 17, dog = 9402" a bad way to feed words to a model?

<details>
<summary>Answer</summary>

The model would treat the numbers as amounts, so it would see cat as close to anything numbered 16 or 18 and far from dog. That closeness comes from the arbitrary numbering, not from meaning. IDs are fine as labels, not as features.

</details>

**2.** Find the cosine similarity of (1, 0) and (0, 1), and of (1, 2) and (2, 4).

<details>
<summary>Answer</summary>

For (1, 0) and (0, 1): the dot product is 0, so the cosine is 0 (perpendicular). For (1, 2) and (2, 4): the dot product is 2 + 8 = 10, the lengths are $\sqrt{5}$ and $\sqrt{20}$, and $10 / \sqrt{100} = 1$. They point the same way; the second is just twice as long.

</details>

**3.** Two vectors have a dot product of 12 and lengths 3 and 5. What is the angle between them?

<details>
<summary>Answer</summary>

$\cos\varphi = 12 / (3 \times 5) = 0.8$, so $\varphi = \cos^{-1}(0.8) \approx 36.9^\circ$.

</details>

**4.** Why do "the dog chased the cat" and "the cat chased the dog" get the same vector when you average word vectors?

<details>
<summary>Answer</summary>

Both sentences contain exactly the same words, and adding numbers gives the same total in any order. Averaging throws away word order, which is why modern models build contextual vectors instead.

</details>

**5.** A teammate embeds documents with model A and queries with model B. Both give 768 numbers, and the top match has a cosine of 0.9. Should you trust it?

<details>
<summary>Answer</summary>

No. The two models learned their coordinate systems independently, so comparing their vectors means nothing. Re-embed the documents with the same model as the queries.

</details>

**6.** Why can a cosine of 0.3 be strong evidence of similarity in 1,024 dimensions but weak evidence in 2?

<details>
<summary>Answer</summary>

Random vectors in $d$ dimensions have a cosine of about $0 \pm 1/\sqrt{d}$. In 1,024 dimensions that spread is about 0.03, so 0.3 is roughly ten times larger than chance would produce. In 2 dimensions, random pairs reach 0.3 or more very often.

</details>

**7.** In the count table, kitten is closer to scooter than to cat by distance. Why, and what fixes it?

<details>
<summary>Answer</summary>

Kitten and scooter are both rare words, so both are short arrows near the origin, and short arrows are close to each other whatever their direction. Cosine similarity (or normalising first) compares only direction: kitten and cat score 1, kitten and scooter score 0.

</details>

## Next in the series

We now have vectors that capture meaning. But a model also has to *do* something with them: mix them, compress them, and turn them into new vectors that answer a question. The tool for that is the **matrix**, a machine that turns one vector into another. Part 2 shows why a matrix is best understood as a set of learned measurements, and why every layer of every neural network is, at its core, a matrix multiplied by a vector.

Part 2 will also answer the question this note left open: where do the embedding numbers come from? A model's whole vocabulary of embeddings is stored as one matrix, with one row per token, and Part 2 will show, in plain terms, how a guessing game over text nudges the numbers in that matrix until similar words end up with similar rows. The full mathematics of that learning (probability, loss, and gradients) follows in the parts after it, each from first principles, and word2vec's training will get a dedicated note once those tools are in place.

## Sources and further reading

**Papers and books cited in this note**

- The Unicode Consortium, [The Unicode Standard](https://www.unicode.org/standard/standard.html): the character numbering used here.
- Z. S. Harris (1954), [Distributional Structure](https://doi.org/10.1080/00437956.1954.11659520), *Word* 10(2â€“3): the distributional hypothesis.
- L. Wittgenstein (1953), *Philosophical Investigations*: the view of meaning as use.
- J. R. Firth (1957), "A synopsis of linguistic theory, 1930â€“1955", in *Studies in Linguistic Analysis*: the "company it keeps" idea behind word embeddings.
- G. E. Hinton, J. L. McClelland, and D. E. Rumelhart (1986), "Distributed representations", in *Parallel Distributed Processing*, Vol. 1, MIT Press.
- J. R. Searle (1980), [Minds, brains, and programs](https://doi.org/10.1017/S0140525X00005756), *Behavioral and Brain Sciences* 3(3): the Chinese Room argument.
- R. Quian Quiroga, L. Reddy, G. Kreiman, C. Koch, and I. Fried (2005), [Invariant visual representation by single neurons in the human brain](https://doi.org/10.1038/nature03687), *Nature* 435.
- T. Mikolov, K. Chen, G. Corrado, and J. Dean (2013), [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781): word2vec.
- T. Mikolov, I. Sutskever, K. Chen, G. Corrado, and J. Dean (2013), [Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546): the improved word2vec training used in practice.
- T. Mikolov, W. Yih, and G. Zweig (2013), [Linguistic Regularities in Continuous Space Word Representations](https://aclanthology.org/N13-1090/): the king âˆ’ man + woman â‰ˆ queen result.
- J. Pennington, R. Socher, and C. Manning (2014), [GloVe: Global Vectors for Word Representation](https://aclanthology.org/D14-1162/): word vectors built from co-occurrence counts.
- A. M. J. Schakel and B. J. Wilson (2015), [Measuring Word Significance using Distributed Representations of Words](https://arxiv.org/abs/1508.02297): vector length and word significance.
- A. Vaswani and colleagues (2017), [Attention Is All You Need](https://arxiv.org/abs/1706.03762): the transformer.
- M. E. Peters and colleagues (2018), [Deep contextualized word representations](https://arxiv.org/abs/1802.05365): ELMo, contextual vectors from recurrent networks.
- J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova (2019), [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805): contextual embeddings with 768 numbers in the base model.
- Q. Meng, S. Zhao, Z. Huang, and F. Zhou (2021), [MagFace: A Universal Representation for Face Recognition and Quality Assessment](https://arxiv.org/abs/2103.06627): embedding length as image quality.
- M. Oyama, S. Yokoi, and H. Shimodaira (2023), [Norm of Word Embedding Encodes Information Gain](https://arxiv.org/abs/2212.09663).

**To learn more**

- D. Jurafsky and J. H. Martin, [Speech and Language Processing](https://web.stanford.edu/~jurafsky/slp3/) (free draft of the 3rd edition): the chapter on embeddings.
- Stanford CS224N, [Lecture 1: Intro and Word Vectors](https://www.youtube.com/watch?v=rmVRLeJRkl4) (Christopher Manning), and the [course page](https://web.stanford.edu/class/cs224n/).
- 3Blue1Brown, [Dot products and duality](https://www.youtube.com/watch?v=LyGKycYT2v0) and the rest of the [Essence of linear algebra](https://www.3blue1brown.com/topics/linear-algebra) series.
- 3Blue1Brown, [Transformers, the tech behind LLMs](https://www.youtube.com/watch?v=wjZofJX0v4M): a visual look at word embeddings inside a language model.
- My earlier notes on [how machine learning and deep learning differ](notes/ml-vs-deep-learning/) (who builds the representation) and [the maths and physics inside LLMs](notes/maths-physics-inside-llms/).


