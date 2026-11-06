---
title: "What Is a Neural Network Layer? Matrices, Bias, and ReLU"
date: 2026-11-05
tags: [AI, maths]
summary: "A neural network layer is a matrix, a bias, and a nonlinearity. This note builds it from nothing: what a matrix does to a vector, why stacking linear layers collapses into a single layer, and why ReLU is what makes depth worth having."
related: [word-embeddings-explained, ml-vs-deep-learning, gradient-descent-better-code]
series: token-by-token
---

<div class="fs-series">
<p><strong>AI from Scratch, Token by Token</strong><br>Article 2</p>
<p>Follows on from <a href="notes/word-embeddings-explained/">Article 1</a>, but reads on its own. You need school coordinates (x, y) and what a dot product is. No coding. Boxes marked "Try it" are interactive.</p>
</div>

A neural network layer is three things applied in order: a matrix multiplication, an added bias, and a nonlinear function. Written out, that is $\mathbf{h} = \sigma(W\mathbf{x} + \mathbf{b})$. The matrix $W$ takes a vector and produces a new one, which you can read either as a set of learned measurements of the input or as a reshaping of the whole space the input lives in. The bias $\mathbf{b}$ shifts the result. The nonlinear function $\sigma$ is the part that makes depth matter at all, because without it a hundred stacked matrices are mathematically identical to one. This note builds each of those three pieces from nothing and works every number by hand.

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

[Article 1](notes/word-embeddings-explained/) ended with every object turned into a vector: a word, a sentence, a photo, all of them lists of numbers arranged so that similar things point in similar directions. That solved the problem of getting the world into a machine.

It left a different problem untouched. A vector that arrives from an embedding model is not arranged for the job you happen to want. Suppose you want to sort incoming support messages into "billing" and "technical". The embedding was trained on general text, which means its numbers were set by reading an enormous pile of ordinary writing and arranging each word so that words appearing in similar company end up pointing in similar directions. Nobody told it what a billing complaint is. [Article 1](notes/word-embeddings-explained/) builds that from nothing: [its Step 6](notes/word-embeddings-explained/#step-6) shows how counting which words keep company with which turns language into geometry, and [its Step 15](notes/word-embeddings-explained/#step-15) covers the guessing game that sets the numbers without any human labelling. The result is a map of general English, and on a map of general English, billing complaints and technical complaints are scattered through the same region of space, mixed together. There is no clean line between them. The information is in there, but it is in the wrong shape.

So the question for this note is:

> Once a thing has become a vector, what can a machine actually **do** to it?

The answer is one word: transform it. Take the vector you have and produce a different vector, in which the thing you care about is easier to read off. Do that several times in a row and you have a neural network.

The tool for a single transformation is the **matrix**. Everything below is about what a matrix does, why one is never enough, and what has to be added between them.

## Frog's-eye view: building it from the ground up

Thirteen steps at ground level, one small idea at a time, every number worked out by hand. After that, the bird's-eye view follows one real block from a real language model.

## Step 1: what a matrix does to a vector

A **matrix** is a rectangular block of numbers. Here is a small one:

$$
W=
\begin{bmatrix}
2 & 1\\
0 & 1
\end{bmatrix}
$$

By itself that is just a table. It becomes interesting when you apply it to a vector. Take

$$
\mathbf{x}=
\begin{bmatrix}
3\\
2
\end{bmatrix}
$$

The rule for $W\mathbf{x}$ is: for each row of $W$, multiply it against $\mathbf{x}$ term by term and add the results.

$$
W\mathbf{x}=
\begin{bmatrix}
2 & 1\\
0 & 1
\end{bmatrix}
\begin{bmatrix}
3\\
2
\end{bmatrix}
=
\begin{bmatrix}
2(3)+1(2)\\
0(3)+1(2)
\end{bmatrix}
=
\begin{bmatrix}
8\\
2
\end{bmatrix}
$$

The vector $(3, 2)$ went in and the vector $(8, 2)$ came out. That is the whole computation. Written in general, if $W$ has entries $W_{ij}$ and $\mathbf{x}$ has components $x_j$, then output component $i$ is

$$
\boxed{\ y_i=\sum_{j=1}^{n}W_{ij}\,x_j\ }
$$

Read that formula slowly, because the rest of the note is built on it. **Every output number is a weighted sum of all the input numbers.** The matrix holds the weights. Nothing else is happening.

That single line can be read two ways, and both are worth having in your head.

## Step 2: the row view, a matrix is a stack of learned measurements

Look again at the formula for one output number:

$$
y_1=W_{11}x_1+W_{12}x_2+\dots+W_{1n}x_n
$$

This is exactly the dot product of row 1 of $W$ with $\mathbf{x}$:

$$
y_1=\begin{bmatrix}W_{11} & W_{12} & \cdots & W_{1n}\end{bmatrix}\cdot\mathbf{x}
$$

Article 1 established what a dot product means: it measures how much two vectors point the same way. So each row of a matrix is itself a vector, a direction, and the output number it produces is a score for **how much the input lines up with that direction**.

> **Key idea.** A row of a matrix is a question asked of the input. The output number is the answer.

Take the AI out of it for one paragraph and the idea becomes obvious.

A fruit basket holds 3 portions of apple and 2 of banana, which is the vector $\mathbf{x}=(3,2)$. You want three facts about the basket: its calories, its sugar, and its vitamin C. Each fact needs one row of per-portion figures. Rounded to keep the arithmetic clean:

|  | per apple | per banana |
|---|---|---|
| calories | 50 | 90 |
| sugar (g) | 10 | 12 |
| vitamin C (mg) | 5 | 10 |

That table is a matrix, and the question "what is in this basket?" is a matrix multiplication:

$$
W=\begin{bmatrix}50&90\\10&12\\5&10\end{bmatrix},\qquad
W\mathbf{x}=\begin{bmatrix}50(3)+90(2)\\10(3)+12(2)\\5(3)+10(2)\end{bmatrix}
=\begin{bmatrix}330\\54\\35\end{bmatrix}
$$

Row 1 is a calorie meter. It knows nothing about fruit, flavour, or breakfast. It knows how heavily to weigh an apple and how heavily to weigh a banana when counting calories, and that is all it is. Row 2 is a different instrument pointed at the same basket. The matrix is a rack of three instruments, applied at once.

Now change the nouns and nothing else. The input is a 768-number embedding of a support message rather than a basket, and the rows are not calories and sugar but measurements a model found useful. Suppose row 1 has ended up large and positive on the coordinates that tend to be large when money is being discussed, and negative on the coordinates that tend to be large when something is broken. Feed it "my card was charged twice" and it returns a big number. Feed it "the app crashes on startup" and it returns a small one. You could reasonably call that row a money detector, though the model never used the word.

One difference matters, and it is the whole difference between a spreadsheet and a model. Somebody measured a banana. Nobody measured billing-ness. Row 1 began as 768 random numbers and was pushed into that shape by training, because having a money detector happened to reduce the model's mistakes. The rows of a trained matrix are hypotheses the model arrived at on its own.

$$
\text{matrix row}\cdot\text{input}=\text{one learned measurement of the input}
$$

This is the single most useful way to read a weight matrix in a real model, and it is literally how interpretability research reads them. A **linear probe** is one row, fitted by hand to test a guess: train a single direction to predict, say, whether a sentence is in French, and if it predicts well, that fact is present in the representation as a direction ([Alain and Bengio, 2016](https://arxiv.org/abs/1610.01644)). A layer with 3072 rows is 3072 such detectors, except nobody chose what any of them look for.

## Step 3: the column view, a matrix mixes fixed directions

There is a second reading, equally correct. The row view explained where each output number comes from. The column view explains what the output can be.

Write $W$ as a set of columns $\mathbf{w}_1, \mathbf{w}_2, \dots, \mathbf{w}_n$, each column being a vector in the output space. Then

$$
\boxed{\ W\mathbf{x}=x_1\mathbf{w}_1+x_2\mathbf{w}_2+\dots+x_n\mathbf{w}_n\ }
$$

Read the fruit table from Step 2 downwards instead of across and this falls out. Column 1 is $(50, 10, 5)$: everything one portion of apple contributes, gathered into one object. Column 2, $(90, 12, 10)$, is one portion of banana. The basket is then not three measurements taken of it, but a sum of what each fruit brought:

$$
3\begin{bmatrix}50\\10\\5\end{bmatrix}+2\begin{bmatrix}90\\12\\10\end{bmatrix}
=\begin{bmatrix}150\\30\\15\end{bmatrix}+\begin{bmatrix}180\\24\\20\end{bmatrix}
=\begin{bmatrix}330\\54\\35\end{bmatrix}
$$

The same 330, 54, and 35 as before, reached by a different route. One table, two readings, and the fruit makes both concrete.

**Across a row is an instrument.** Row 2 is a sugar meter. It knows how much sugar one apple carries and how much one banana carries, it reports a single number, and it is indifferent to everything else about the basket. That is the sense in which rows tell you what the matrix is looking for.

**Down a column is an ingredient.** Column 2 is the nutritional signature of a banana. Every banana in the basket pushes the answer 90 units along calories, 12 along sugar, and 10 along vitamin C, always in that fixed ratio, no matter what else is in the basket. The only thing the basket decides is how many bananas, which is to say how loudly that fixed vector gets added. That is the sense in which columns tell you what the matrix can build.

The second reading has teeth, and the fruit shows why. Ask what answers this table can possibly produce. Only apples and bananas go in, so only blends of those two columns come out. You will never get an answer that is high in vitamin C and low in calories, because neither fruit offers that combination and no quantity of either creates it. The reachable answers are the blends of two fixed vectors, which inside a three-number output space is a plane: a large but strictly limited menu. Add a third column, kiwi at $(40, 9, 70)$, and that plane becomes the whole space. High vitamin C with modest calories is now reachable, not because the measuring got better, but because a new ingredient was added to the list of things the output can be made of.

So the column view is the one that explains output. Whatever the input, the result is a blend of the columns and never anything else. If every column of a layer happens to lie in the same plane, every output of that layer lies in that plane too, no matter how much variety the inputs had.

### The same two readings inside a transformer

This is not an analogy that gets left behind at the door of a real model. It is how interpretability researchers read one.

Take the second matrix of a feed-forward block in GPT-2, of shape $768\times3072$. It receives the 3072 numbers the block computed in its wide middle and projects them back down to the 768-number vector the rest of the model carries along. By the shape rule of Step 4 it has 3072 columns, one for each of those 3072 hidden units, and each column is a fixed vector of 768 numbers. Apply the column view:

$$
W_2\mathbf{h}=h_1\mathbf{w}_1+h_2\mathbf{w}_2+\dots+h_{3072}\mathbf{w}_{3072}
$$

Hidden unit 1,742 contributes $h_{1742}$ times column 1,742 and nothing else, exactly as a banana contributed twice $(90,12,10)$ and nothing else. Column 1,742 never changes from one token to the next; it was frozen when training ended. The only thing that varies is the single number $h_{1742}$, which sets how loudly that fixed vector is added to the running total.

That splits one hidden unit into two separate jobs, and they live in two different matrices. Row 1,742 of the *first* matrix decides **when** the unit speaks, because it is the direction the unit scans the incoming vector for, which is the fruit row. Column 1,742 of the *second* matrix decides **what** it says, because it is the fixed vector added when the unit does speak, which is the fruit column. The unit itself is only the number in between, a volume knob.

That is the picture in [Elhage and colleagues (2021)](https://transformer-circuits.pub/2021/framework/index.html): a transformer read not as a pile of layers but as a collection of components, each reading a few directions out of a shared running vector and writing a fixed direction back into it. It is a useful way to read a model because it can be checked. A column is available for inspection without running the model on anything, and for a late block you can push one column through the model's output head and read off which tokens that column argues for.

When you want to know *what a layer detects*, read the rows. When you want to know *what a layer can produce*, read the columns.

## Step 4: a matrix is a function between two spaces

The matrix in Step 1 was square, two rows and two columns, so it took a 2-vector and returned a 2-vector. Matrices do not have to be square.

If $W$ has $m$ rows and $n$ columns, written $W\in\mathbb{R}^{m\times n}$, then it takes a vector with $n$ components and returns one with $m$:

$$
\boxed{\ W:\mathbb{R}^{n}\rightarrow\mathbb{R}^{m}\ }
$$

The number of columns must match the size of the input, because each row needs one weight per input number. The number of rows sets the size of the output, because each row produces one output number.

Three cases are worth naming, and each one is a design decision somebody made on purpose in a model you have used:

- $m<n$: **compression.** Fewer numbers come out than went in, so something must be thrown away. A classifier head that turns a 768-number vector into 2 scores is doing this deliberately: almost everything about the sentence is irrelevant to the question "billing or technical?", and the layer's job is to discard it.
- $m=n$: **reshaping.** Same size in and out, rearranged. Attention's query, key, and value projections in GPT-2 are all $768\times768$. They do not shrink or grow the token's vector, they re-aim it.
- $m>n$: **expansion.** More numbers come out than went in. No new information appears, but it is spread across more coordinates, which gives the fold that follows more places to act.

> **Definition.** The **shape** of a layer is the pair of numbers (input size, output size). A matrix of shape $3072\times768$ maps a 768-vector to a 3072-vector.

Shape is the first thing worth reading about any architecture, because the sequence of shapes is the architecture. Here is a real one, the encoder half of a small BERT-style model, written as nothing but shapes:

$$
\underbrace{30{,}522\rightarrow768}_{\text{embedding}}\ \longrightarrow\
\underbrace{768\rightarrow768}_{\text{attention}}\ \longrightarrow\
\underbrace{768\rightarrow3072\rightarrow768}_{\text{feed-forward}}\ \longrightarrow\ \cdots
$$

Read left to right and you can say what the model does with a token before knowing anything about attention: pick a row for it, re-aim that row, widen it to compute in, narrow it back, repeat.

Shape mismatches are the single most common error message a beginner meets, and the message is blunt for a good reason. If your vector has 768 numbers and your matrix expects 512, the multiplication simply has no definition. There is no row long enough to touch all your numbers. In PyTorch a layer is declared as exactly this pair, `nn.Linear(768, 3072)`, and the two numbers in that line are the two numbers in $W\in\mathbb{R}^{3072\times768}$.

## Step 5: what a matrix does to the whole space

So far a matrix has acted on one vector at a time. Now apply the same matrix to every point in the plane at once and watch what happens to the plane itself.

Take

$$
W=\begin{bmatrix}2&0\\0&1\end{bmatrix},\qquad
W\begin{bmatrix}x\\y\end{bmatrix}=\begin{bmatrix}2x\\y\end{bmatrix}
$$

Every point's horizontal coordinate doubles and its vertical coordinate stays put. The whole plane is stretched sideways, like pulling a sheet of rubber from left and right.

Now take

$$
W=\begin{bmatrix}1&2\\0&1\end{bmatrix},\qquad
W\begin{bmatrix}x\\y\end{bmatrix}=\begin{bmatrix}x+2y\\y\end{bmatrix}
$$

Heights are unchanged, but each point slides sideways by an amount proportional to how high it is. A point at height 1 slides 2 to the right, a point at height 3 slides 6. The plane is pushed over like a deck of cards. This is called a **shear**. Check one point: $(3,1)$ becomes $(3+2, 1) = (5,1)$.

Different matrices do different things to the plane, and the standard vocabulary is short:

| What it does | Example matrix | Effect on $(x, y)$ |
|---|---|---|
| Stretch | $\begin{bmatrix}2&0\\0&1\end{bmatrix}$ | $(2x,\ y)$ |
| Shrink | $\begin{bmatrix}0.5&0\\0&0.5\end{bmatrix}$ | $(0.5x,\ 0.5y)$ |
| Rotate 90&deg; | $\begin{bmatrix}0&-1\\1&0\end{bmatrix}$ | $(-y,\ x)$ |
| Reflect in the $x$-axis | $\begin{bmatrix}1&0\\0&-1\end{bmatrix}$ | $(x,\ -y)$ |
| Shear | $\begin{bmatrix}1&2\\0&1\end{bmatrix}$ | $(x+2y,\ y)$ |
| Project onto the $x$-axis | $\begin{bmatrix}1&0\\0&0\end{bmatrix}$ | $(x,\ 0)$ |

Most matrices do several of these at once. A general rotation by angle $\theta$, which you can verify against the 90&deg; case by putting $\cos 90° = 0$ and $\sin 90° = 1$, is

$$
R(\theta)=\begin{bmatrix}\cos\theta & -\sin\theta\\ \sin\theta & \cos\theta\end{bmatrix}
$$

Drag the input point and switch matrices in the figure below. Watch the grid, not just the point: the grid is the space.

<div class="fs-widget" data-widget="matrix">
<p class="fs-fallback"><strong>Try it.</strong> Applying the shear matrix [[1, 2], [0, 1]] to the point (3, 1) gives (5, 1). The grid lines stay straight and evenly spaced but tilt over. Applying the projection matrix [[1, 0], [0, 0]] to any point flattens the entire plane onto the horizontal axis, so (3, 1) and (3, 7) both land on (3, 0).</p>
</div>

Try the projection matrix and notice what it does: the whole two-dimensional plane is flattened onto a single line, and two different inputs can land on the same output. Once that has happened, nothing downstream can tell those two inputs apart. A layer that compresses is deciding what to forget, permanently, and no later layer can undo it.

### What this looks like on real data

A grid of dots is a fine way to see the rule, but it is worth seeing why a model would want any of this.

Go back to the support tickets. Shrink the embedding to two numbers so it fits on paper, and suppose the embedding model, trained on general English, ended up with coordinate 1 meaning roughly "how formal is this writing" and coordinate 2 meaning roughly "how urgent does it sound". Those are reasonable things for general English to care about. Neither is the thing you want.

On that map a billing complaint might sit at $(0.8, 0.9)$ and a technical one at $(0.9, 0.8)$. Close together, both formal, both urgent, and the difference you actually care about lies along the diagonal, squeezed into the small gap between them. A classifier reading coordinate 1 alone or coordinate 2 alone will fail, because neither axis is the question.

Now apply

$$
W=\begin{bmatrix}1&-1\\1&1\end{bmatrix}
$$

The billing ticket goes to $(0.8-0.9,\ 0.8+0.9) = (-0.1,\ 1.7)$ and the technical one to $(0.9-0.8,\ 0.9+0.8) = (0.1,\ 1.7)$. The second coordinate is now identical for both, carrying the part they share, and the entire distinction has moved onto the first coordinate, where it is the only thing there. Nothing was added. The same two numbers went in and came out, rotated and scaled so that the axis of the space is the axis of the question.

That is what training a layer is for. The embedding gave you a map drawn for somebody else's purpose, and the matrix redraws it with your purpose along an axis. A model with 768 coordinates does this on a much bigger scale and the directions it chooses have no names, but the move is the same one.

> **Key idea.** A matrix does not just change a vector. It changes the geometry of the space that every vector lives in.

This is the mental model that makes neural networks make sense. The network does not look at your data and recognise it. The network bends the space the data lives in, repeatedly, until the answer is easy to read off.

## Step 6: linearity, the promise and the price

Look at the figure again, at the grid rather than the point. Whatever matrix you choose, three things stay true: straight lines stay straight, parallel lines stay parallel, and the origin stays where it is. The grid can be stretched, tilted, flipped, or flattened, but never curved.

That is not a coincidence about the examples. It is the defining property of a matrix. For any vectors $\mathbf{x}$ and $\mathbf{z}$ and any numbers $\alpha$ and $\beta$:

$$
\boxed{\ W(\alpha\mathbf{x}+\beta\mathbf{z})=\alpha W\mathbf{x}+\beta W\mathbf{z}\ }
$$

A transformation with this property is called **linear**. Two consequences follow directly.

**Scaling.** $W(\alpha\mathbf{x}) = \alpha W\mathbf{x}$. Double the input and the output doubles exactly. Check it: with $W$ from Step 1 and $\mathbf{x}=(3,2)$ we got $(8,2)$. With $\mathbf{x}=(6,4)$ we get $(2 \cdot 6 + 1 \cdot 4,\ 0 \cdot 6 + 1 \cdot 4) = (16, 4)$, which is exactly double.

**Addition.** $W(\mathbf{x}+\mathbf{z}) = W\mathbf{x}+W\mathbf{z}$. Transforming a sum gives the sum of the transforms.

Linearity is a genuine gift, and the size of the gift is easiest to see in hardware. Because $W(\mathbf{x}+\mathbf{z})=W\mathbf{x}+W\mathbf{z}$, a thousand inputs can be stacked into one block of numbers and pushed through in one operation instead of a thousand, which is what a **batch** is. Because the only operations are multiply and add, chips can be built that do nothing else: an NVIDIA tensor core exists to multiply small matrices and add the results, and the reason a GPU is worth thousands of pounds for this work is that linearity makes the whole computation one shape repeated.

But every guarantee is also a restriction, and here the restriction has a familiar name. A model that is only a matrix, with the right readout on the end, is linear regression or logistic regression. Those are good tools. They also cannot represent the statement "this is urgent **only if** it is about billing", because that sentence is about two features interacting, and a linear model adds its features up and never multiplies them. The sentiment of "not good" is the same problem: the contribution of "good" has to depend on what came before it, and a sum of per-word weights has no way to let one word change another's meaning. Neural networks exist because most interesting statements about data have an *only if* in them.

Geometrically, that is one sentence. A linear transformation can stretch space and it can tilt space, and it cannot bend space. If two groups of points are mixed together in a way that no straight line separates, no matrix will ever separate them, because straight lines stay straight.

Here is the picture I keep in my head. Imagine your data drawn on a sheet of transparent film. A matrix is everything you can do to that film while it stays flat and rigid: slide it, turn it, stretch it, squash it, hold it up at an angle. You have a lot of freedom, and from a well-chosen angle two groups can be made to look very different. But you can never crease the film. If the two groups are interleaved on the sheet, like alternating black and white squares on a chessboard, no amount of turning and stretching will gather the black squares to one side, because tilting the sheet moves everything on it together.

A nonlinearity is permission to crease. That one extra move, folding the film along a line, is what lets you bring two far-apart regions together and push two neighbouring ones apart. Everything a deep network does is this, repeated: flatten and tilt, crease, flatten and tilt, crease, until the thing you are looking for sits cleanly on one side of a straight cut.

That restriction has a consequence so important it gets its own step.

## Step 7: why stack at all, and why stacking alone fails

Where the argument stands: a thing has become a vector, and a matrix reshapes the whole space that vector lives in. The plan was to transform a vector several times in a row. Before testing whether that works, it is worth being clear about why anybody would want a sequence rather than one big transformation.

Two reasons, and they pull in the same direction. The first is that a single transformation from raw input to final answer would have to be found in one go, and finding it is the original problem again, undiminished. A sequence lets each step be modest: make the data slightly better arranged than it was, hand it on. Nothing in the chain has to be clever by itself.

The second is that useful structure is built in levels, and the levels can be reused. In an image model, the first layers settle on edges, the next combine edges into corners and textures, the next combine those into eyes and wheels, and only the last combine those into cats and cars. [Zeiler and Fergus (2014)](https://arxiv.org/abs/1311.2901) produced pictures of exactly this by reconstructing what each layer of a trained network responds to, and the hierarchy is plainly visible in them. The same holds in language models: early layers resolve what a token is, middle layers resolve what it refers to, late layers decide what comes next. A hundred edge detectors get used by every shape above them, which is cheaper than learning every cat from pixels directly.

So: apply two matrices, one after the other.

$$
\mathbf{x}\ \longrightarrow\ W_1\mathbf{x}\ \longrightarrow\ W_2(W_1\mathbf{x})
$$

Matrix multiplication is associative, so $W_2(W_1\mathbf{x})=(W_2W_1)\mathbf{x}$. And $W_2W_1$ is itself just a matrix. Define $W=W_2W_1$ and the two steps become

$$
\boxed{\ W_2W_1\mathbf{x}=W\mathbf{x}\ }
$$

one step. Work it through with numbers so there is no doubt. Take

$$
W_1=\begin{bmatrix}1&1\\0&1\end{bmatrix},\qquad
W_2=\begin{bmatrix}2&0\\1&1\end{bmatrix}
$$

Their product, computed the usual way (row of the first against column of the second):

$$
W_2W_1=
\begin{bmatrix}2&0\\1&1\end{bmatrix}
\begin{bmatrix}1&1\\0&1\end{bmatrix}
=\begin{bmatrix}2(1)+0(0) & 2(1)+0(1)\\ 1(1)+1(0) & 1(1)+1(1)\end{bmatrix}
=\begin{bmatrix}2&2\\1&2\end{bmatrix}
$$

Now test both routes on $\mathbf{x}=(1,1)$.

*Two steps:* $W_1\mathbf{x}=(1+1,\ 0+1)=(2,1)$. Then $W_2(2,1)=(2 \cdot 2+0 \cdot 1,\ 1 \cdot 2+1 \cdot 1)=(4,3)$.

*One step:* $W\mathbf{x}=(2 \cdot 1+2 \cdot 1,\ 1 \cdot 1+2 \cdot 1)=(4,3)$.

Identical, and not by luck. It holds for every input, and it holds for any number of layers:

$$
\boxed{\ W_{100}\cdots W_2W_1\mathbf{x}=W\mathbf{x}\ }
$$

for a single matrix $W$ that you could compute once and store.

> **Key idea.** A hundred stacked matrices compute exactly the same function as one matrix. Depth, on its own, buys nothing.

This is worth sitting with, because it is a real result and it is not obvious if one has not studied linear algebra. You could build a network with fifty layers and a billion parameters, and if every layer is just a matrix, the whole thing is mathematically equivalent to a single layer. All those parameters would be an extremely expensive way to store one matrix.

Use the figure to convince yourself. The two-layer path and the one-matrix path land on the same point every time.

<div class="fs-widget" data-widget="collapse">
<p class="fs-fallback"><strong>Try it.</strong> With W1 = [[1, 1], [0, 1]] and W2 = [[2, 0], [1, 1]], the combined matrix is W2W1 = [[2, 2], [1, 2]]. For the input (1, 1), going through both layers gives (2, 1) and then (4, 3). Going through the single combined matrix gives (4, 3) directly. Switching ReLU on after the first layer breaks this: the input (&minus;2, 1) gives (0, 1) with ReLU but (&minus;2, 0) without it.</p>
</div>

## Step 8: the fold

Something has to go between the matrices that is not itself a matrix. Step 6 said what it must do: crease the film. The surprise is how little it takes.

Keep positive numbers as they are. Replace negative numbers with zero. That is the whole function:

$$
\boxed{\ \operatorname{ReLU}(z)=\max(0,z)\ }
$$

The name is short for **rectified linear unit**, which sounds more imposing than "set the negatives to zero". Applied to a vector it works coordinate by coordinate:

$$
\operatorname{ReLU}
\begin{bmatrix}-2\\3\\-1\\5\end{bmatrix}
=
\begin{bmatrix}0\\3\\0\\5\end{bmatrix}
$$

### Where this idea came from

Before testing whether that is enough, it is worth knowing that the fold is the oldest surviving piece of the whole apparatus, and that it was borrowed from biology before anyone had a computer to run it on.

In 1943 a neurophysiologist and a logician, Warren McCulloch and Walter Pitts, published [a model of a neuron](https://doi.org/10.1007/BF02478259) as a device that adds up its inputs and fires if the total passes a threshold. That is $W\mathbf{x}+\mathbf{b}$ followed by a fold, written two years before the first electronic computer, and their point was philosophical as much as biological. They were arguing that a network of all-or-nothing units can compute any proposition of logic, and therefore that thinking might be a mechanical process. Frank Rosenblatt's perceptron (1958) made it a physical machine with adjustable weights, stored as dials turned by small motors.

The biological story behind that threshold is real. A neuron that is weakly stimulated does not fire a weak spike; it fires a full spike or none, a finding usually credited to Edgar Adrian's recordings in the 1920s. What varies is the *rate* of firing, and a real neuron's rate against input current is roughly flat at zero until the input passes a threshold, then climbs close to linearly. That curve is, near enough, ReLU. The sharp corner at zero that looks like a crude engineering shortcut is closer to the biology than the elegant S-curve that replaced it for forty years.

That is as far as the biology is worth taking. What is being built here is not a brain simulation, and nothing below depends on it being one: the fold has to earn its place mathematically, which is the next section.

### Why it breaks the collapse

ReLU is not linear, and the quickest way to see that is to test the scaling rule. $\operatorname{ReLU}(-1 \times -2) = \operatorname{ReLU}(2) = 2$, while $-1 \times \operatorname{ReLU}(-2) = -1 \times 0 = 0$. Those disagree, so the rule fails.

Put it between the matrices:

$$
\mathbf{h}_1=\operatorname{ReLU}(W_1\mathbf{x}),\qquad
\mathbf{h}_2=\operatorname{ReLU}(W_2\mathbf{h}_1)
$$

There is now, in general, no single matrix $W$ that reproduces this for every input. Here is a concrete witness. Take the same $W_1$ and $W_2$ as before and feed in $\mathbf{x}=(-2,1)$.

*Without ReLU:* $W_2W_1\mathbf{x} = \begin{bmatrix}2&2\\1&2\end{bmatrix}\begin{bmatrix}-2\\1\end{bmatrix} = (-4+2,\ -2+2) = (-2, 0)$.

*With ReLU after the first matrix:* $W_1\mathbf{x} = (-2+1,\ 0+1) = (-1, 1)$, and $\operatorname{ReLU}(-1,1) = (0,1)$. Then $W_2(0,1) = (2 \cdot 0 + 0 \cdot 1,\ 1 \cdot 0 + 1 \cdot 1) = (0,1)$.

$(-2, 0)$ against $(0, 1)$. The single clipped number changed the answer, and no fixed matrix can reproduce that behaviour, because the clipping happens for some inputs and not others.

That is precisely what was missing. ReLU does different things in different regions of the space. Where the input to it is positive it does nothing at all, and where the input is negative it flattens. So the space gets a **fold** in it. Stack many layers, each adding its own folds, and the geometry can become as complicated as you like while every individual piece stays a simple multiply-and-add.

> **Key idea.** A matrix stretches and tilts the space. The nonlinearity folds it. Depth is only worth having because of the folds.

### Why this one, out of all the functions that are not linear

ReLU is not the only choice and was not the first. For about forty years the standard was the sigmoid, $\sigma(z)=1/(1+e^{-z})$, a smooth S-curve squashing everything into the range 0 to 1, which was preferred partly because it looks like a neuron deciding and partly because it is smooth everywhere.

One fact decided it, and it is worth carrying forward even though its machinery arrives in Article 3. Training works by asking each number "if I nudged you slightly, how much would the final answer improve?" Where a function is flat, the honest answer is "almost nothing", so the nudge is almost nothing and that layer stops learning. The sigmoid flattens at both ends: at $z=6$ it returns about 0.9975, and at $z=8$ about 0.9997, so the input moved by 2 and the output barely noticed. Stack ten such layers and multiply ten almost-nothings together, and the layers near the input receive effectively no signal at all.

ReLU never flattens on the positive side. For any positive input its slope is exactly 1, so the signal crosses any number of layers undiminished. It is also the cheapest nonlinear function there is, a single comparison against zero. [Krizhevsky, Sutskever, and Hinton (2012)](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks) reported their network reaching a given error rate about six times faster with ReLU than with the smooth alternative, and said plainly that they could not have trained it at all with the saturating one. That paper is usually cited as the start of the modern era, and one of the things it changed was which function everybody put between their matrices.

Both halves of that argument are visible in one picture. The figure below draws a function in the upper panel and its slope directly underneath, on the same input axis, so you can see the flatness being complained about rather than take it on faith. Switch to the sigmoid and drag the probe outwards: the curve looks like it is still doing something, while the slope underneath has already fallen into the shaded dead band. Switch to ReLU and the slope is a flat 1 all the way to the right edge, forever.

<div class="fs-widget" data-widget="activations">
<p class="fs-fallback"><strong>Try it.</strong> ReLU(z) = max(0, z) is flat at zero for negative input and a 45-degree line for positive input, so its slope is 0 on the left and exactly 1 on the right, at every distance from the origin. The sigmoid 1/(1 + e<sup>&minus;z</sup>) rises smoothly from 0 to 1, but its slope peaks at only 0.25 at z = 0 and falls below 0.08 once z passes about 2.4 in either direction, which is the flatness that stops a deep stack of sigmoid layers from training.</p>
</div>

The other functions in that figure are in common use, each patching a specific flaw in the one before it: leaky ReLU, GELU, SwiGLU. Which to pick, and what goes wrong with each, is a question big enough for its own note and does not change anything here. The requirement for this article is only that the function is not linear.

## Step 9: the bias, moving the fold

Where the argument stands: words are vectors, a matrix transforms a vector, and a fold has been added between matrices so that stacking them buys something. One piece of the layer is still missing. Notice that $W\mathbf{0}=\mathbf{0}$ for every matrix: a matrix always leaves the origin alone. So a pure matrix can tilt and stretch the space but cannot slide it.

The fix is to add a vector after multiplying:

$$
W\mathbf{x}+\mathbf{b}
$$

The vector $\mathbf{b}$ is called the **bias**, and it has one number per output. It is learned along with $W$.

A small example. Suppose $W\mathbf{x}=(5,1)$ and $\mathbf{b}=(-4,0)$. Then

$$
W\mathbf{x}+\mathbf{b}=\begin{bmatrix}5\\1\end{bmatrix}+\begin{bmatrix}-4\\0\end{bmatrix}=\begin{bmatrix}1\\1\end{bmatrix}
$$

Alone that looks trivial. Its importance shows up in combination with ReLU. ReLU always cuts at zero, so the bias is what decides *where* the cut falls relative to the data. With a bias of $-4$, the first output only survives ReLU when $W\mathbf{x}$ exceeds 4. The matrix picks the direction the fold runs along, and the bias picks how far along that direction the fold sits.

Think of it as a threshold, which is exactly what it was in 1943. The row of $W$ asks "how much does this input look like direction $\mathbf{w}$?", and the bias says "and only report it if the answer beats this much".

$$
W\ \text{controls orientation, scale, and mixing.}\qquad
\mathbf{b}\ \text{controls position.}
$$

### What is actually being learned, and by whom

Both $W$ and $\mathbf{b}$ are *learned*, a word used freely above and worth pinning down, because the two of them learn different kinds of thing.

Stay with the support tickets. Suppose one row of $W$ has settled into a money detector, large on the coordinates that go up when payments are discussed. What that row learned is **a direction**: which combination of the input coordinates counts as evidence. What the matching bias learned is **how much evidence is enough**. ReLU always cuts at zero, so with a bias of $-4$ the unit stays silent until the row's score passes 4, and everything below that is reported as nothing at all rather than as a small amount of something.

That distinction matters because the right answer depends on the data, not on the concept. Suppose this company emails an invoice with every single reply, so the word "charged" turns up in almost every ticket, technical ones included. The money detector now scores a baseline 3 on everything. The direction is still correct, so $W$ needs no change at all; what needs to change is the bias, from $-1$ to something nearer $-4$, so the baseline is subtracted away and only genuine billing tickets survive the cut. Move to a second company whose customers never mention money unless they mean it, and the same row wants a bias near zero, because there is no baseline to subtract. One learned direction, two different thresholds, decided entirely by what the incoming mail looks like.

Nobody sits down and picks either. A person chooses the architecture, which is the shapes of the matrices and how many layers there are, and then every individual number inside $W$ and $\mathbf{b}$ is set by the training algorithm, which starts them off random and nudges each one repeatedly in whichever direction reduces the model's mistakes. The bias is nudged by exactly the same mechanism as the weights, which is why it drifts to $-4$ at the first company and to $0$ at the second without anyone noticing it happened. How that nudging works is Article 3, and it is the one question this note leaves standing.

## Step 10: one complete layer, by hand

All three pieces are now in place. The standard layer is

$$
\boxed{\ \mathbf{h}=\sigma(W\mathbf{x}+\mathbf{b})\ }
$$

where $\mathbf{x}$ is the input vector, $W$ is a learned matrix, $\mathbf{b}$ is a learned bias, $\sigma$ is a nonlinear function applied to each number, and $\mathbf{h}$ is the output, usually called the **hidden representation**.

Work one all the way through. Take

$$
W=\begin{bmatrix}1&2\\0&1\end{bmatrix},\qquad
\mathbf{x}=\begin{bmatrix}3\\1\end{bmatrix},\qquad
\mathbf{b}=\begin{bmatrix}-4\\0\end{bmatrix}
$$

**Multiply.**

$$
W\mathbf{x}=\begin{bmatrix}1(3)+2(1)\\0(3)+1(1)\end{bmatrix}=\begin{bmatrix}5\\1\end{bmatrix}
$$

**Add the bias.**

$$
W\mathbf{x}+\mathbf{b}=\begin{bmatrix}5\\1\end{bmatrix}+\begin{bmatrix}-4\\0\end{bmatrix}=\begin{bmatrix}1\\1\end{bmatrix}
$$

**Apply ReLU.** Both numbers are positive, so nothing is clipped:

$$
\mathbf{h}=\operatorname{ReLU}\begin{bmatrix}1\\1\end{bmatrix}=\begin{bmatrix}1\\1\end{bmatrix}
$$

The complete journey of the vector was

$$
\mathbf{x}\ \rightarrow\ W\mathbf{x}\ \rightarrow\ W\mathbf{x}+\mathbf{b}\ \rightarrow\ \sigma(W\mathbf{x}+\mathbf{b})
$$

Change the input to $\mathbf{x}=(1,1)$ and the story is different: $W\mathbf{x} = (1+2, 1) = (3,1)$, then $+\mathbf{b}$ gives $(-1, 1)$, and ReLU clips the first number to give $(0, 1)$. The same layer, different input, and this time the fold did something.

Change the numbers yourself below and watch which stage does the work.

<div class="fs-widget" data-widget="layer">
<p class="fs-fallback"><strong>Try it.</strong> With W = [[1, 2], [0, 1]], b = (&minus;4, 0), and x = (3, 1): Wx = (5, 1), then Wx + b = (1, 1), then ReLU leaves it as (1, 1). With x = (1, 1) instead: Wx = (3, 1), Wx + b = (&minus;1, 1), and ReLU clips the first number to give (0, 1).</p>
</div>

That is a neural network layer, complete. Everything else in deep learning is this, repeated, with bigger matrices.

## Step 11: untangling cat and dog

The recipe is complete: a vector arrives, a matrix tilts the space, a bias slides it, a fold creases it, a new vector leaves. Time to see why the fold earns its place. The cleanest demonstration is the smallest problem that a single layer cannot solve.

Put four points on the plane. Two are cats, at $(0,0)$ and $(1,1)$. Two are dogs, at $(0,1)$ and $(1,0)$. Draw them: the cats are on one diagonal and the dogs are on the other.

Now try to draw a straight line with both cats on one side and both dogs on the other. You cannot. Any line that puts $(0,0)$ and $(1,1)$ together must pass between the two diagonals, and that leaves the dogs on opposite sides. This arrangement is called **XOR**, and its unsolvability by a single linear layer is a famous result: Marvin Minsky and Seymour Papert proved it in [*Perceptrons*](https://mitpress.mit.edu/9780262630221/perceptrons/) (1969), and the proof is widely credited with cooling enthusiasm for neural networks for most of the following decade.

By Step 6 we know why no matrix can fix it. A matrix keeps straight lines straight, so if the classes are not separable by a line before the transformation, they are not separable by a line after it either. You can stretch, rotate, and shear the picture as much as you like; the diagonals stay crossed.

Add the fold and it comes apart. Use

$$
W=\begin{bmatrix}1&1\\1&1\end{bmatrix},\qquad
\mathbf{b}=\begin{bmatrix}0\\-1\end{bmatrix}
$$

and compute $\mathbf{h}=\operatorname{ReLU}(W\mathbf{x}+\mathbf{b})$ for all four points.

| Input $\mathbf{x}$ | Class | $W\mathbf{x}$ | $W\mathbf{x}+\mathbf{b}$ | $\mathbf{h}$ after ReLU |
|---|---|---|---|---|
| $(0,0)$ | cat | $(0,0)$ | $(0,-1)$ | $(0,0)$ |
| $(1,1)$ | cat | $(2,2)$ | $(2,1)$ | $(2,1)$ |
| $(0,1)$ | dog | $(1,1)$ | $(1,0)$ | $(1,0)$ |
| $(1,0)$ | dog | $(1,1)$ | $(1,0)$ | $(1,0)$ |

Look at the last column. The two dogs have landed on exactly the same point, $(1,0)$. The two cats are at $(0,0)$ and $(2,1)$, which both sit on the line $y=x/2$, while the dog point sits below it. A straight line now separates them, so one more row of weights finishes the job. Take the row $(1, -2)$:

$$
\begin{aligned}
\text{cat }(0,0): &\quad 1(0)-2(0)=0\\
\text{cat }(2,1): &\quad 1(2)-2(1)=0\\
\text{dog }(1,0): &\quad 1(1)-2(0)=1
\end{aligned}
$$

Cats score 0, dogs score 1. The problem is solved.

Trace what actually happened. Before the layer, the two classes were interleaved and no line could get between them. The matrix mapped both dogs to the same place and spread the cats apart, and then ReLU clipped one coordinate, which is the step that bent the picture. After the layer, a line works.

<div class="fs-widget" data-widget="untangle">
<p class="fs-fallback"><strong>Try it.</strong> The four XOR points, two cats at (0, 0) and (1, 1) and two dogs at (0, 1) and (1, 0), cannot be separated by any straight line. After the layer h = ReLU(Wx + b) with W = [[1, 1], [1, 1]] and b = (0, &minus;1), the cats land at (0, 0) and (2, 1) and both dogs land at (1, 0), which a straight line does separate. Turning ReLU off leaves the four points on a single line, still inseparable.</p>
</div>

Switch ReLU off in the figure and the four points collapse onto one straight line, still hopeless. The matrix alone never had a chance.

This is the whole argument for depth in one picture. **A layer is not a classifier. A layer is a change of geometry that makes the next layer's job easier, and the last layer's job is the only one that has to be a straight cut.** That is worth being concrete about, because "the next layer" is doing real work in that sentence. Here the next layer was the row $(1,-2)$, a single straight cut, and it only worked because the layer before it had already moved the two dogs on top of each other. Every hidden layer in a real model is in the same position. Its output goes straight into something else, and it is judged solely on whether it left the problem in better shape for whatever that is.

Stack enough of them and almost any tangle can be combed out before the final cut is made. That intuition has a formal counterpart: the **universal approximation theorem**, proved by [George Cybenko in 1989](https://doi.org/10.1007/BF02551274) and extended by Kurt Hornik in 1991, which says a network with one hidden layer and a nonlinearity can approximate any continuous function on a bounded region, given enough hidden units. It is an existence result, not a recipe. It says nothing about how many units you need or how to find the weights, which is why depth and training methods still matter enormously in practice.

## Step 12: where Article 1's numbers actually live

Article 1 left a question open: where do embedding vectors come from, and where are they kept? The answer is a matrix, and it closes the loop between the two notes rather neatly.

A model's whole vocabulary of embeddings is stored as one **embedding matrix** $E$, with one row per token. GPT-2 has 50,257 tokens and 768 numbers per token, so

$$
E\in\mathbb{R}^{50{,}257\times768},\qquad 50{,}257\times768=38{,}597{,}376\ \text{numbers}
$$

Looking up the embedding for token number $i$ means taking row $i$ of $E$. That sounds like a different kind of operation from everything in this note, but it is not. Recall the one-hot vectors from Article 1: $\mathbf{e}_i$ is a vector of 50,257 numbers, all zero except a 1 in position $i$. Multiply it against $E$ and the zeros kill every row except row $i$:

$$
\mathbf{e}_i^{\top}E=\text{row } i \text{ of } E
$$

So an embedding lookup **is** a matrix multiplication, with a one-hot vector as the input. Article 1 introduced one-hot vectors only to reject them as a representation. They come back here as the thing that selects a row.

In practice no system performs that multiplication, because multiplying by 50,256 zeros to reach one row is a waste; libraries index directly into the row. But the equivalence is the reason an embedding table is treated as a layer, trained exactly like any other weight matrix, with gradients flowing into its rows.

And that answers the other half of Article 1's open question. The embeddings are not looked up from a dictionary someone wrote. They start as random numbers in $E$ and are adjusted during training, by the same mechanism that adjusts every other matrix in the model, until words that keep similar company end up with similar rows. The mechanism itself, gradients and loss, is the subject of the next notes.

## Step 13: a layer doing a real job

Put all of it together on something small enough to check by hand. Suppose an embedding model has already turned a support message into four numbers, and you want to route it to billing or technical.

The message is "my card was charged twice", with embedding $\mathbf{x}=(0.9,\ 0.1,\ 0.8,\ 0.2)$.

**Layer 1**, four numbers to two, with weights that have already been learned:

$$
W_1=\begin{bmatrix}1&0&1&0\\0&1&0&1\end{bmatrix},\qquad \mathbf{b}_1=\begin{bmatrix}-1\\0\end{bmatrix}
$$

Row 1 of $W_1$ measures coordinates 1 and 3 together, and row 2 measures coordinates 2 and 4. Compute:

$$
W_1\mathbf{x}=\begin{bmatrix}0.9+0.8\\0.1+0.2\end{bmatrix}=\begin{bmatrix}1.7\\0.3\end{bmatrix},\qquad
W_1\mathbf{x}+\mathbf{b}_1=\begin{bmatrix}0.7\\0.3\end{bmatrix}
$$

Both positive, so ReLU leaves them: $\mathbf{h}=(0.7,\ 0.3)$.

**Layer 2**, two numbers to two scores, one per class:

$$
W_2=\begin{bmatrix}2&-1\\-1&2\end{bmatrix},\qquad
W_2\mathbf{h}=\begin{bmatrix}1.4-0.3\\-0.7+0.6\end{bmatrix}=\begin{bmatrix}1.1\\-0.1\end{bmatrix}
$$

Two raw scores, 1.1 and $-0.1$. To read them as probabilities, the last step of almost every classifier divides each exponentiated score by the total:

$$
\operatorname{softmax}(\mathbf{z})_i=\frac{e^{z_i}}{\sum_j e^{z_j}}
$$

Here $e^{1.1}\approx3.004$ and $e^{-0.1}\approx0.905$, which sum to $3.909$:

$$
\text{billing}=\frac{3.004}{3.909}\approx0.77,\qquad
\text{technical}=\frac{0.905}{3.909}\approx0.23
$$

The ticket is routed to billing with 77 percent confidence.

Now the other case. A technical message, "the app crashes on startup", might embed as $\mathbf{x}=(0.1,\ 0.9,\ 0.2,\ 0.8)$. Then $W_1\mathbf{x}=(0.3,\ 1.7)$, and after the bias $(-0.7,\ 1.7)$. **ReLU clips the first to zero**, giving $\mathbf{h}=(0,\ 1.7)$. The second layer gives $W_2\mathbf{h}=(-1.7,\ 3.4)$, and softmax turns that into roughly 0.006 for billing and 0.994 for technical.

Look at what the clip did. For the billing message nothing was clipped and both hidden units stayed active, so both classes had something arguing for them and the answer came out at 77 percent. For the technical message the billing unit was switched off entirely, leaving nothing on that side at all, which is why the answer is 99.4 percent. That is the fold doing its job on a real task: not a general reshaping, but a switch that is on for some inputs and off for others.

Every number in $W_1$, $\mathbf{b}_1$, and $W_2$ was written down by hand to make this work. In a real system all of them would be learned, which is the one thing still missing.

## Bird's-eye view: one block, followed number by number

Step back and watch the pieces work together on something real. Here is one token's vector passing through one feed-forward block of a GPT-2-sized model, the part that sits after attention in every layer.

1. **In.** A vector of 768 numbers arrives, representing one token in its context. It came from the embedding matrix of Step 12 and has been reshaped by the layers before this one.
2. **Expand.** Multiply by $W_1$, of shape $3072 \times 768$. Each of the 3072 output numbers is a dot product of one row with the input, which is 2.36 million multiply-add operations in total (Steps 1 and 2). The representation now has 3072 numbers: four times the room, no new information, but the information is spread out.
3. **Shift.** Add the bias $\mathbf{b}_1$, 3072 numbers, which sets where each fold sits (Step 9).
4. **Fold.** Apply the nonlinearity to each of the 3072 numbers. This is the only step in the whole block that is not a stretch or a tilt, and it is the reason the block is worth having at all (Step 8).
5. **Project back.** Multiply by $W_2$, of shape $768 \times 3072$, returning to 768 numbers, and add $\mathbf{b}_2$. Another 2.36 million multiply-adds. This is a compression, four to one, so information is being discarded here on purpose: the block keeps what it computed in the wide space that is worth carrying forward (Steps 4 and 5).
6. **Out.** A vector of 768 numbers, the same shape as the input and different content. The next layer receives it and does the same thing again.

Counting the weights, that block holds $3072 \times 768$ numbers in the first matrix and $768 \times 3072$ in the second, plus their biases, which comes to 4,722,432 learned numbers. GPT-2 small stacks 12 of them, so these blocks alone account for roughly 56.7 million of the model's 124 million parameters. Close to half the model is these two matrices, repeated.

Every later note in this series zooms into one of these steps, or into the training that set the numbers inside $W_1$ and $W_2$.

## The whole idea in one line

You have now built the entire layer yourself:

<div class="fs-flow">
<span>a vector</span>
<span>multiply by a matrix</span>
<span>add a bias</span>
<span>apply a nonlinearity</span>
<span>a new vector, better shaped for the task</span>
</div>

And the idea of this note, Idea 2 of the 44:

> **Idea 2.** A matrix is a function that reshapes a space in a structured way, and a neural network is a stack of such reshapings with a fold between each pair.

Article 1's idea was that a good representation turns the relationships that matter into geometry. Article 2's idea is that a model can change that geometry, over and over, until the relationships that matter are easy to read.

## Where this road leads

Look at what the two notes together have built. A machine that only adds, multiplies, and compares numbers can now hold a word as a vector and reshape that vector with a matrix, a bias, and a clipping rule. That is already enough machinery to express a classifier, a translator, or a language model, because every one of those is a stack of these layers. Nothing in the arithmetic will change later. Only the numbers inside the matrices will, and they will change because of data rather than because someone chose them.

Four questions raised in passing here get notes of their own, because each is too big for a paragraph: which nonlinearity to use and what goes wrong with each; how much information a layer destroys and why that makes fine-tuning on a laptop possible; how to count a model's parameters and work out whether they will fit on your hardware; and exactly where these matrices sit inside a transformer.

## Three easy mistakes, and how to avoid them

These are the places where people who understand the idea still go wrong in real projects.

### 1. Reading a matrix as a table instead of a function

A weight matrix printed out looks like a spreadsheet, and it is tempting to look for meaning in individual entries. The useful reading is the one from Step 2: each row is a direction the layer measures against, and each column is a direction the layer can produce.

**Instead:** when inspecting weights, look at whole rows and columns and what they do to a vector, not at single numbers.

### 2. Expecting depth alone to help

Stacking more layers with no nonlinearity between them gives you one layer with extra steps, as Step 7 showed with numbers. The same mistake appears in subtler forms, such as two consecutive linear layers in a block with the activation accidentally left out.

**Instead:** check that every pair of consecutive matrices has something nonlinear between them. If removing a layer does not change what the model can express, it is not doing anything.

### 3. Expecting each hidden number to mean something

It is natural to hope that $h_{17}$ is the "cat" number. Article 1 made this point for embeddings, and it applies just as much to every hidden layer. The information is spread across coordinates, and a concept is usually a direction built from many of them rather than a single axis.

**Instead:** treat hidden vectors as whole objects. If you want to find out what a layer has learned, probe directions, not individual coordinates.

## What this idea does not claim

It does not say that every useful transformation is a matrix; attention, normalisation, and convolution each add structure beyond a plain matrix multiply, and each gets its own note later. It does not say that ReLU is the best nonlinearity, only that some nonlinearity is required. It does not say that a deep linear network is useless in every sense: it computes a linear function, but its *training behaviour* genuinely differs from a single layer's, a point studied carefully by [Saxe, McClelland, and Ganguli (2013)](https://arxiv.org/abs/1312.6120). It does not say that more layers or wider layers are automatically better. And the universal approximation theorem does not say a network will *find* the right function, only that one exists within reach.

## The note in six lines

- A matrix turns one vector into another, and every output number is a weighted sum of the input numbers, $y_i=\sum_j W_{ij}x_j$.
- Read the rows and a matrix is a set of learned measurements; read the columns and it is a set of directions the output is blended from.
- Applied to every point at once, a matrix stretches, rotates, shears, or flattens the whole space, and it always keeps straight lines straight. That is why a model built only of matrices is logistic regression and cannot represent "urgent only if billing".
- Stacking matrices achieves nothing on its own: $W_{100}\cdots W_1\mathbf{x}=W\mathbf{x}$ for a single matrix $W$. A nonlinearity such as $\operatorname{ReLU}(z)=\max(0,z)$ is what breaks the collapse and folds the space.
- A complete layer is $\mathbf{h}=\sigma(W\mathbf{x}+\mathbf{b})$: the matrix sets orientation and scale, the bias sets position, the nonlinearity does the bending. Four XOR points that no line can separate become separable after exactly one such layer.
- The same three lines appear everywhere in a real model. One feed-forward block of GPT-2 small holds 4,722,432 of them, and twelve such blocks are roughly 57 million of its 124 million parameters.

## Next in the series

Every matrix in this note was written down by hand, by me, to make a point. In a real model there are billions of these numbers and no person chooses any of them. **Where do the numbers in $W$ and $\mathbf{b}$ actually come from?** Article 3 answers that, starting from the slope of a straight line and building two things: a **loss function**, which turns a wrong answer into a single number saying how wrong it is, and the **gradient**, which says for each individual weight whether nudging it up or down would make that number smaller. Step 8's claim about the sigmoid's flatness becomes a calculation you can do rather than a picture you have to trust.

After that comes the descent itself: take a small step downhill for every weight at once, repeat a few million times. A network of the layers built in this note, trained by the method built in the next two, is a working model.

## Sources and further reading

**Papers and books cited in this note**

- W. S. McCulloch and W. Pitts (1943), [A logical calculus of the ideas immanent in nervous activity](https://doi.org/10.1007/BF02478259), *Bulletin of Mathematical Biophysics* 5(4): the threshold unit, two years before the first electronic computer.
- F. Rosenblatt (1958), [The perceptron: a probabilistic model for information storage and organization in the brain](https://doi.org/10.1037/h0042519), *Psychological Review* 65(6): the single-layer ancestor of the modern layer.
- M. Minsky and S. Papert (1969), [*Perceptrons: An Introduction to Computational Geometry*](https://mitpress.mit.edu/9780262630221/perceptrons/), MIT Press: the proof that a single linear layer cannot solve XOR.
- G. Cybenko (1989), [Approximation by superpositions of a sigmoidal function](https://doi.org/10.1007/BF02551274), *Mathematics of Control, Signals and Systems* 2(4): the universal approximation theorem.
- K. Hornik (1991), [Approximation capabilities of multilayer feedforward networks](https://doi.org/10.1016/0893-6080(91)90009-T), *Neural Networks* 4(2).
- A. Krizhevsky, I. Sutskever, and G. E. Hinton (2012), [ImageNet Classification with Deep Convolutional Neural Networks](https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks), NeurIPS: AlexNet, which reports ReLU training about six times faster than the smooth alternative.
- A. M. Saxe, J. L. McClelland, and S. Ganguli (2013), [Exact solutions to the nonlinear dynamics of learning in deep linear neural networks](https://arxiv.org/abs/1312.6120): deep linear networks compute a linear function but learn differently from a single layer.
- M. D. Zeiler and R. Fergus (2014), [Visualizing and Understanding Convolutional Networks](https://arxiv.org/abs/1311.2901): pictures of what each layer of a trained network responds to, which is the clearest evidence for the hierarchy argument in Step 7.
- G. Alain and Y. Bengio (2016), [Understanding intermediate layers using linear classifier probes](https://arxiv.org/abs/1610.01644): reading a single row of weights as a question asked of a representation.
- A. Vaswani and colleagues (2017), [Attention Is All You Need](https://arxiv.org/abs/1706.03762): the transformer, whose feed-forward block is the example in the bird's-eye view.
- A. Radford and colleagues (2019), [Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf): GPT-2, the source of the 768, 3072, and 50,257 figures used here.
- N. Elhage and colleagues (2021), [A Mathematical Framework for Transformer Circuits](https://transformer-circuits.pub/2021/framework/index.html): reading a transformer as components that read directions in and write directions out, which is the column view of Step 3 applied in anger.

**To learn more**

- 3Blue1Brown, [Linear transformations and matrices](https://www.youtube.com/watch?v=kYB8IZa5AuE) and [Matrix multiplication as composition](https://www.youtube.com/watch?v=XkY2DOUCWMU), from the [Essence of linear algebra](https://www.3blue1brown.com/topics/linear-algebra) series: the best visual treatment of Steps 5 to 7.
- G. Strang, [Linear Algebra and Its Applications](https://math.mit.edu/~gs/linearalgebra/) and the free MIT course [18.06](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/): the proper treatment of everything in Steps 1 to 7.
- M. Nielsen, [Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/chap4.html), chapter 4: a visual proof that a network with one hidden layer can approximate any function.
- I. Goodfellow, Y. Bengio, and A. Courville, [Deep Learning](https://www.deeplearningbook.org/) (free online), chapters 2 and 6: linear algebra and feedforward networks.
- My earlier notes on [word embeddings and why AI needs vectors](notes/word-embeddings-explained/) (Article 1 of this series), [how machine learning and deep learning differ](notes/ml-vs-deep-learning/), and [gradient descent](notes/gradient-descent-better-code/).
