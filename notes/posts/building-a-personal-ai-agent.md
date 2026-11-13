---
title: Building a personal AI agent that keeps track of everything I work on
date: 2026-11-12
tags: [AI, projects]
summary: Saati is a personal AI agent I talk to on Telegram. It tracks my projects, ideas, and decisions, follows my coding sessions and voice notes, and runs in the cloud on a Gemini model.
related: [ai-agent-memory-experiments, voice-ai-agent, local-rag-agent]
---

I work on many projects at once, big and small, serious and quirky, and I sometimes lose track of where each one stands. Ideas also arrive at random moments: a feature to add, something to improve, a topic for a blog. So my working day kept raising the same questions. What did I decide last week? What was the next step? Which idea did I park? I built Saati to answer them. It is a personal agent I talk to on Telegram. I tell it about projects, progress, decisions, and ideas in plain language, and it answers questions like "where is the voice agent at?" from what it has stored.

It also follows my sessions with LLMs and coding tools, so it knows what I actually worked on, not only what I remembered to tell it. It runs in the cloud on a Gemini model, so it is always available, whether or not my laptop is on.

I had built agents before, but of a different kind: voice agents, and an agent that runs content and social media accounts. The closest was a RAG and spreadsheet-filling agent for an organisation. That company's data changed in ways that were easy to capture, which made life easier. A few months ago I built another agent for the same company, and it raised questions I had only thought about in theory: what an agent should keep, what it should forget, and how much it can read at once. Building Saati on a small, fast model made those questions concrete, because a small model is less forgiving about what it is given. Most of what follows, and the experiments after it, came from that.

## What it does

- **Tracks projects.** Status, progress, next steps, and deadlines, all from normal messages. Projects move through stages, from idea to research to development to maintenance, and they can move backwards too.
- **Keeps ideas, links, and decisions.** Ideas are captured even when I only float them ("what if..."), in my own words. Decisions are stored with their reasons, so I can ask later why I chose something.
- **Briefs me.** A morning plan, an evening wrap-up, and a weekly review.
- **Knows what I worked on.** New sessions and chats from the LLMs and IDEs I use reach Saati automatically. When I ask about a project, it checks what I actually did, not what I said I would do.
- **Hears my voice notes.** I dictate with Whisper running locally, inside Claude Code, other LLM apps, IDEs, or anywhere else. Those transcripts reach Saati too, so what I say out loud while brainstorming becomes part of its memory.
- **Reminds me.** Deadline alerts, and a nudge when a project has been idle for a while.

## Its personality

Most of the work went into how Saati should behave, not into what it can do. Its instructions describe it as a second brain and a thinking partner, and a few rules shaped it more than the rest:

- **Helpful, not agreeable.** It should say "I don't think that's the best approach" when that is true, and point out when I start something new while several projects are unfinished.
- **Never accept an unchecked premise.** If I say it forgot something, it checks its records first. If something is not there, it says so plainly instead of guessing.
- **Act without being asked, a little.** If something I say links to an older idea, it points that out. If I logged a plan weeks ago, it asks once what happened. If a piece of work would make a good post or experiment, it says so in one line.
- **Answer first, and keep it short.** Light, nerdy humour is allowed: at most one dry joke per reply, physics or sci-fi flavoured.

When I bring it an idea, it does not cheer. It asks what problem it solves, for whom, what already exists, what it would cost, and what the smallest useful experiment would be. Interesting is not the same as viable, and I wanted an agent that remembers that for me.

## Things that went wrong

**It invented projects.** The worst bug was a confident one. Asked for my current projects, Saati listed one that did not exist, and when I mentioned a project by a slightly wrong name, it created a new record instead of matching the real one. The model was only doing what it was allowed to do.

The fix was in the design, not in the prompt. Saati can no longer create a project from a name it knows nothing about. When a name is close to an existing one, it has to ask "did you mean...?" instead of quietly adding a record. And when I start working in a new folder, it suggests it as a possible project rather than guessing.

**It answered from stale data.** At one point Saati did not know about a project I had worked on for days, because my sessions had stopped reaching it. An agent cannot tell you about data it never received, so the fix was about keeping that pipeline running, not about the model.

## What the experiments changed

Most of the bigger systems I had built were either for someone else, or, when they were for me, their data did not change often. Saati is different. Its source data changes every hour as I work. That makes it a good test bed for ideas from research papers on agent architecture, design, and memory, starting with the most basic one: how should an agent like this store memory? Overwrite facts when they change, keep everything, or search the raw history? To begin with, I ran five experiments on two months of my own coding sessions, including prompts and brainstorming conversations with LLMs. They are written up in [Experiments with AI agents: memory and retrieval](notes.html?post=ai-agent-memory-experiments).

The short version: keep old facts but mark them as no longer valid instead of overwriting them, and keep a path from each stored fact back to the raw text it came from. That is the next change going into Saati.

If you are building something similar, or want to know more about how Saati works, [get in touch](index.html#contact) or message me on [LinkedIn](https://www.linkedin.com/in/kauntey-acharya/).
