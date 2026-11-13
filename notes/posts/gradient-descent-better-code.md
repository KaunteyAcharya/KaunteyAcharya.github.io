---
title: "Why Karpathy said gradient descent writes better code than you"
date: 2025-01-08
updated: 2026-11-13
tags: [AI]
summary: In 2017 Andrej Karpathy tweeted that gradient descent can write code better than you, then made the case in his Software 2.0 essay. What he actually meant, what the essay gets right, what it admitted would go wrong, and how the claim reads nine years later.
related: [how-gradient-descent-works, ml-vs-deep-learning, how-labs-train-ai-models, ai-benchmarks]
---

On 4 August 2017, Andrej Karpathy, then director of AI at Tesla, [tweeted](https://x.com/karpathy/status/893576281375219712): *"Gradient descent can write code better than you. I'm sorry."*

It reads like a provocation, and it was meant to. But it is also a precise technical claim, and the precision is usually lost when people quote it. Karpathy was not saying that an AI would type Python faster than you. In 2017 nothing could do that. He was saying something stranger: that the weights of a trained neural network *are* a program, that an optimisation algorithm searches the space of such programs more effectively than a human writes them, and that for a growing class of problems this is simply the better way to produce software.

Three months later he made the full argument in an essay called [Software 2.0](https://karpathy.medium.com/software-2-0-a64152b37c35). This note is about what that argument actually says, what it conceded at the time, and how it has aged.

## First, what gradient descent is actually doing

The claim only makes sense if you take seriously the idea that gradient descent *writes* something. So it is worth being concrete about what it produces.

Picture standing on a hillside at night in thick fog. You want the lowest point in the valley, but you cannot see it. You cannot see ten metres. What you can do is feel the slope under your feet and take one step downhill, then feel again, and repeat.

In a neural network, the landscape is how wrong the model currently is, measured as a single number called the loss. Your position on it is the setting of every parameter in the model, often billions of numbers at once. Each step adjusts all of them slightly in the direction that reduces the loss fastest. Nobody tells the network how to solve the problem, and nobody inspects the numbers afterwards. (I build this up properly, with every number worked by hand, in [how gradient descent works in AI](notes/how-gradient-descent-works/).)

Here is the part that matters for Karpathy's claim. When that process finishes, the artefact you are left with is a long list of numbers. Those numbers determine the model's behaviour completely. Feed in an input and the arithmetic runs and an output comes out, deterministically, the same way it would through a function you had written by hand.

So the weights satisfy the working definition of a program: a fixed specification of behaviour that a machine executes. They are just a program nobody wrote and nobody can read. Karpathy's move was to stop treating that as a curiosity and start treating it as a software engineering discipline.

## What the Software 2.0 essay actually claims

Karpathy published [Software 2.0](https://karpathy.medium.com/software-2-0-a64152b37c35) on 11 November 2017. The core distinction fits in two of his own lines:

- **Software 1.0** is "code we write". A human writes explicit instructions: if this, do that; loop over these; call this function.
- **Software 2.0** is "code written by the optimization based on an evaluation criterion". In practice that code is a neural network's weights. You do not write them. You assemble a dataset, define what good looks like, and let gradient descent search for a program that achieves it.

The framing he uses is worth stating carefully, because it is the strongest part of the essay. Both are searches through the space of possible programs. In Software 1.0 a human does the searching, slowly, guided by intuition, and can only explore the tiny region of that space expressible as readable code. In Software 2.0 the search is automated, runs over a vastly larger region, and is guided by a measurable objective rather than by taste.

Try writing rules by hand for recognising a cat in a photograph. Pointy ears, whiskers, fur. Then the cat sits in an odd pose, or the lighting changes, or it is behind a chair, and the rules collapse. The handwritten program is competing in a space it cannot reach into.

He listed six domains where the switch was already happening: visual recognition, speech recognition, speech synthesis, machine translation, games, and databases. Google Translate's move to a neural system in 2016 is the best known example, and the gain was not incremental.

He also listed why the 2.0 artefact is preferable as an engineering object, and these are the arguments people usually skip:

- **Computationally homogeneous.** A trained network is almost entirely matrix multiplications. A 1.0 codebase is an unbounded variety of operations.
- **Simple to bake into silicon.** Because of that homogeneity, you can build hardware for it. The entire GPU and accelerator industry of the last decade is this prediction being correct.
- **Constant running time and constant memory.** Every forward pass through a fixed network costs the same. No input triggers an unexpected recursion or an unbounded loop.
- **Highly portable.** A sequence of matrix multiplications runs anywhere.
- **Modules can meld into an optimal whole.** Two separately trained components can be fine-tuned jointly, and the boundary between them optimises away. Handwritten modules cannot do this; their interfaces are fixed by their authors.

The last item on his list is the tweet restated: "It is better than you." His reasoning is one sentence: "the optimization can find much better code than what a human can write."

## The costs he named himself

The essay is routinely cited by people selling things, which has stripped it of the half that is a warning. Karpathy was explicit about what you give up.

When a trained network works, "it's very hard to tell how". You have a program with no source you can read, no comments, no structure corresponding to anything a person would recognise as reasoning. Debugging in the ordinary sense is not available.

These systems "can fail in unintuitive and embarrassing ways". This is a sharper point than it sounds. A 1.0 program fails in ways traceable to a line. A 2.0 program can be correct on every example you tried and catastrophically wrong on one you did not, with no signal in advance. Adversarial examples, inputs perturbed imperceptibly to flip a model's answer, "highlight the unintuitive nature of this stack".

And it changes what the job is. In the 2.0 stack, he wrote, most of the active software development consists of "curating, growing, massaging and cleaning labeled datasets". The data becomes the source code, which means data quality becomes code quality, and a mislabelled example is a bug you cannot grep for.

I find this the most honest part of the essay, and the part that has aged best. Everything he warned about is now routine.

## What I liked about it

It inverts what programming means. Instead of writing the solution, you write down what a good solution looks like, which is the data, the objective, and how you will measure success, and then you let the optimiser find the solution.

Having spent years tuning parameters in physics code by hand, choosing step sizes and convergence criteria and watching simulations diverge for reasons I could not immediately see, that framing landed hard. The skill moves from "can you write the algorithm?" to "can you specify the problem and judge the answer?" Those are genuinely different abilities, and the second one is rarer than the field admits.

## The twist: 2.0 started writing 1.0

Here is what the essay did not predict, and what makes the tweet read differently now.

Software 2.0 began producing Software 1.0. Models trained by gradient descent now generate ordinary Python, JavaScript and SQL, which humans can read, review, and run. The unreadable program started emitting readable ones.

Roughly how that happened:

**2021: GitHub Copilot.** Built on OpenAI's Codex, a GPT model trained on public code. It sat in the editor and suggested the next line or the whole function. GitHub's own controlled experiment found developers completed a task about 55% faster with it.

**2022 to 2023: chat models.** ChatGPT, then GPT-4 and Claude, could write, explain and debug code from a plain-language description. DeepMind's AlphaCode showed models competing in programming contests at roughly the level of a median human competitor.

**2024: whole projects.** Models began editing entire codebases, reading many files, making coordinated changes, running tests, and fixing their own failures. On SWE-bench, which tests models against real GitHub issues, scores went from low single digits at the start of the year to around half the problems solved by the end. (I write about how benchmarks like this are built, and where they mislead, in [how AI benchmarks are actually designed](notes/ai-benchmarks/).)

**December 2024: o3.** OpenAI announced a model trained to reason step by step before answering, reporting a Codeforces rating around 2727, which would place it among the top few hundred competitive programmers in the world, and 71.7% on SWE-bench Verified. Those were the lab's own figures on a model not yet publicly available, so they deserved caution, but the direction was not ambiguous.

What changed after that is less a benchmark story than a structural one. The unit of work stopped being the line and became the task. You describe an outcome, the model plans, edits across files, runs the tests, reads the failures and tries again. The loop that used to be the programmer's is increasingly the model's, and the programmer's loop now wraps around it.

## 2025: Karpathy added a third layer

In June 2025, at Y Combinator's AI Startup School, Karpathy gave a talk called *Software Is Changing (Again)* and extended his own taxonomy ([full transcript on Latent Space](https://www.latent.space/p/s3)).

**Software 3.0** is the prompt. If 1.0 is code written in Python and 2.0 is weights found by gradient descent, 3.0 is a program written in English and executed by a language model. His line, now widely quoted, is that the hottest new programming language is English. He frames the LLM itself as a new kind of computer, a general-purpose processor whose instructions happen to be natural language.

Two things about that talk are worth holding onto.

The first is that he did not present the three eras as a succession where each kills the last. He showed them coexisting, with 3.0 eating into the other two rather than replacing them. A real system today is all three at once: handwritten code, trained weights, and prompts, in one stack, each doing what it is best at.

The second is that it completes an arc that makes the 2017 tweet look less like a prediction about code generation and more like a prediction about *who does the specifying*. In 1.0 you specify the procedure. In 2.0 you specify the objective and the data. In 3.0 you specify the intent in a sentence. Each step moves the human further from the mechanism and closer to the statement of what is wanted. That is one trend, not three.

It is also where his own warning bites hardest. A prompt is a specification with no type system, no compiler, and no guarantee that the same input produces the same output tomorrow. Everything he said in 2017 about 2.0 being hard to debug applies to 3.0 with the error bars widened.

## So was the tweet true?

For problems with a clear objective and cheap evaluation, yes, and it stopped being controversial some time ago. Nobody hand-writes a vision pipeline. Nobody hand-writes a translation system. Gradient descent won those outright, exactly as the essay said it would, and the six domains he listed in 2017 have all gone the same way.

For code generation specifically, which is the reading the tweet now gets, it is true in a narrower sense than the quoting suggests. On contest problems and well-specified tasks with automatic tests, models are extremely strong. That is precisely the regime Software 2.0 predicted would fall: a clear evaluation criterion and abundant examples.

For software as an actual activity, the claim is still mostly unsettled, and for a reason the essay anticipated. Most of the work in a real project is not producing code. It is deciding what to build, extracting requirements from people who have not articulated them, making trade-offs with consequences that arrive months later, carrying context nobody wrote down, and being accountable when it breaks. None of that has a loss function. You cannot run gradient descent on a problem you cannot score, and the hardest parts of software are the parts nobody has worked out how to score.

The risks have also become concrete rather than theoretical. Code that looks right and is subtly wrong. Plausible security holes. Imports of libraries that do not exist. Reviewing machine-written code carefully is now a core engineering skill, and it is a different skill from writing it.

## What it changed about how I work

I let the model write the first draft, especially boilerplate, data cleaning, and plotting code. Then I spend the time where it matters: the design, the edge cases, the tests, and the question of whether the thing actually solves the problem that was posed.

My code has improved, and not because I write more of it. It is because I review more of it, and because reviewing forces you to articulate what correct would look like, which is a thing I used to leave implicit.

Which is, in the end, the essay's own argument turned on its author's readers. The job was always to specify the problem well and judge the result honestly. Software 1.0 let you avoid doing that explicitly, because the procedure you wrote stood in for the specification. Gradient descent removed that hiding place, and prompting removed what was left of it.

That is what I think the tweet was really about.
