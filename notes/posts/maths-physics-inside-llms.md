---
title: The maths and physics hiding inside LLMs
date: 2024-10-14
tags: [AI, maths]
summary: Like many others, I was surprised the physics Nobel went to Geoffrey Hinton. So I went looking for the physics and maths inside large language models.
---

On 8 October, the 2024 Nobel Prize in Physics went to John Hopfield and Geoffrey Hinton "for foundational discoveries and inventions that enable machine learning with artificial neural networks."

Just like many others, I was surprised the Nobel for physics went to Geoffrey Hinton. My first reaction was: isn't this computer science? But then I tried to understand what physics and maths go behind LLMs, to see why the committee made this choice. This note is what I found. I've tried to keep it readable even if you haven't touched an equation in years.

## Why physics, at all?

The answer starts in the 1980s.

**Hopfield networks (1982).** John Hopfield built a network that stores memories the way a physical system settles into a stable state. He borrowed the idea of **energy** from physics, specifically from models of magnets where tiny atomic spins point up or down and try to line up with their neighbours. Each stored memory is a valley in an energy landscape. Show the network a noisy or partial pattern, and it rolls downhill to the nearest valley, recovering the full memory. It's like recognising a friend's face from a blurry photo.

**Boltzmann machines (1985).** Hinton and colleagues took this further using **statistical mechanics**, the physics of systems with huge numbers of particles where we deal in probabilities, not certainties. A Boltzmann machine learns by adjusting itself until the patterns it generates match the probabilities of patterns in the data. Its name comes from Ludwig Boltzmann, and the core formula is lifted straight from thermodynamics.

So neural networks didn't just borrow a few physics words. Their foundations were built with physics tools. Modern LLMs are much bigger and quite different, but a lot of that DNA is still there.

## Step 1: words become vectors (linear algebra)

A model can't read words directly. Text is split into **tokens** (words or pieces of words), and each token is turned into a **vector**: a long list of numbers, often thousands long.

You can picture each vector as an arrow in a space with thousands of dimensions. Words with similar meanings end up pointing in similar directions. "King" and "queen" sit close together; "king" and "banana" do not.

From then on, almost everything the model does is **matrix multiplication**: taking those vectors and transforming them, layer after layer. A large language model is, at its heart, an enormous amount of linear algebra running on GPUs.

## Step 2: attention, or "which words matter here?"

The key idea in transformers is **attention**. For every token, the model asks: which other tokens in this text should I pay attention to?

It does this by creating three versions of each token's vector, called a query ($Q$), a key ($K$), and a value ($V$). Roughly:

- the **query** is "what am I looking for?"
- the **key** is "what do I contain?"
- the **value** is "what information do I pass on?"

The model compares each query with every key using a **dot product**, which measures how much two vectors point the same way. High overlap means "pay attention." Written compactly:

$$\mathrm{Attention}(Q,K,V) = \mathrm{softmax}\big(QK^\top / \sqrt{d}\big)\, V$$

If you've done quantum mechanics, a dot product as "how much do these two states overlap" will feel very familiar. The $\sqrt{d}$ just keeps numbers from growing too large when vectors are long.

## Step 3: softmax is the Boltzmann distribution

This is the one I loved most.

At the end of each step, the model gives every possible next token a score $z_i$. To turn scores into probabilities, it uses **softmax**:

$$p_i = \frac{e^{z_i/T}}{\sum_j e^{z_j/T}}$$

Now compare that with the **Boltzmann distribution** from statistical mechanics, which gives the probability of a system being in a state with energy $E_i$ at temperature $T$:

$$p_i = \frac{e^{-E_i/k_B T}}{\sum_j e^{-E_j/k_B T}}$$

It's the same formula, with score playing the role of negative energy. And the "temperature" setting you see in AI tools behaves exactly like physical temperature:

- **Low temperature:** a cold system sits in its lowest-energy state. The model almost always picks its top choice. Answers are safe and repetitive.
- **High temperature:** a hot system jumps between many states. The model explores less likely words. Answers become creative, and eventually nonsense.

Seeing a formula from my thermodynamics classes sitting at the heart of ChatGPT made the Nobel make a lot more sense to me.

## Step 4: measuring mistakes (information theory)

During training, the model reads real text and tries to predict each next token. To measure how wrong it is, we use **cross-entropy loss**, which basically measures how *surprised* the model is by the actual word:

$$L = -\log p_{\text{correct}}$$

If the model gave the right word a probability close to 1, the loss is near 0. If it gave it a tiny probability, the loss is large. This comes from Claude Shannon's information theory, and Shannon's entropy is a close cousin of entropy in thermodynamics. Training is, in a sense, making the model less and less surprised by human language.

## Step 5: learning by rolling downhill (calculus)

So how does the model actually improve? Through **gradient descent**.

Imagine standing on a hilly landscape in thick fog, trying to reach the lowest valley. You can't see far, but you can feel the slope under your feet. So you take a small step downhill, then check again, over and over. That's gradient descent. The landscape is the loss, and your position is the setting of all the model's parameters $\theta$:

$$\theta_{\text{new}} = \theta_{\text{old}} - \eta \, \nabla L$$

Here $\nabla L$ is the slope (the gradient) and $\eta$ is the step size.

The hard part is computing that slope for billions of parameters at once. The method for it, **backpropagation**, is really just the chain rule from school calculus, applied carefully backwards through every layer. Hinton was one of the people who popularised it in a famous 1986 paper. Modern optimisers like **Adam** add momentum, a bit like a ball rolling downhill that remembers which way it was going and doesn't stop at every small bump.

## Step 6: rotations that encode word order

Attention on its own doesn't know word order. "Dog bites man" and "man bites dog" would look the same. Many modern models fix this with **rotary position embeddings (RoPE)**: each token's vector is rotated by an angle that depends on its position in the text.

When two rotated vectors are compared, the result depends on the *difference* in their angles, which means relative position comes out naturally. It's the same maths as rotating an arrow in a plane, or the phase of a wave. Physicists use this trick all the time with complex numbers.

## Step 7: diffusion and thermodynamics

Image generators like Stable Diffusion use a different kind of model called **diffusion models**. The idea was inspired by **non-equilibrium thermodynamics**: take an image, slowly add noise until it becomes pure static (like ink spreading in water), then train a network to reverse the process step by step. To generate something new, start from random noise and "un-diffuse" it into a picture.

I honestly don't understand this part in much detail. The general picture makes sense to me, but the full mathematics of how the reverse process is learned is something I still need to sit down and work through properly. It isn't central to how text LLMs work, but it's another place where physics thinking shaped modern AI.

## Step 8: scaling laws look like physics

What I found most interesting of all: when researchers plotted how a model's loss changes as you add more parameters, data, and compute, they got smooth **power laws**, straight lines on a log-log plot.

$$L(N) \propto N^{-\alpha}$$

Power laws show up all over physics: in phase transitions, turbulence, and earthquake sizes. Seeing one describe how an AI model improves felt strangely familiar. It also changed how labs work. Research from DeepMind in 2022 (the "Chinchilla" paper) used this kind of analysis to show many models were too big for the data they were trained on, and that you should scale data and model size together.

To me, this is the most "physics" part of modern AI: treat a complex system you can't fully explain, measure it carefully, and find the simple law hiding underneath.

## So, was it a physics prize?

After going through all this, I think yes, in spirit. The early neural networks were built from statistical physics ideas, and modern LLMs still run on Boltzmann's formula, energy landscapes, information theory, and power laws.

LLMs aren't "just physics." But the toolbox overlaps far more than I expected, and it makes me feel a little less like I'm changing fields and more like I'm applying the same thinking somewhere new.
