---
title: How Claude overtook GPT (where it matters)
date: 2024-12-05
tags: [AI]
summary: ChatGPT is still the household name, but in coding and enterprise use, Anthropic's Claude has caught up and pulled ahead this year. Here is how that happened.
---

If you ask most people which AI they use, the answer is still ChatGPT. It has the brand, the user numbers, and the head start. But in the places I care about most, which are coding, agents, and real work inside companies, the story of 2024 has been Claude.

I switched most of my own work to Claude this year, so I wanted to understand whether that was just me or a real shift. Here is the timeline, and what I think explains it.

## Quick background: who makes Claude?

Claude is made by **Anthropic**, a company founded in 2021 by a group of former OpenAI researchers, including siblings Dario and Daniela Amodei. Their focus from the start was AI safety: how to build models that are helpful but also predictable and honest.

The first Claude came out in March 2023, a few months after ChatGPT. For most of 2023, Claude was "the other one." It was good at long documents (Claude 2 could read around 100,000 tokens, roughly a full book, in one go), but GPT-4 was clearly ahead on most tasks.

## March 2024: the first crack

In March, Anthropic released the **Claude 3** family in three sizes: Haiku (small and fast), Sonnet (balanced), and Opus (largest).

A few weeks later, Claude 3 Opus reached the top of the **LMSYS Chatbot Arena**. This is a public leaderboard where people type a prompt, get two answers from anonymous models, and vote for the better one. Thousands of blind votes add up to a ranking. It was the first time a GPT-4 model had lost the top spot.

It didn't stay there forever. OpenAI responded with updated models, and GPT-4o in May. But the point was made: GPT was beatable.

## June 2024: Claude 3.5 Sonnet

This is when things really changed for developers. **Claude 3.5 Sonnet** was a mid-sized model, so faster and cheaper than Opus, but better than Opus at almost everything, especially code.

What people around me noticed:

- **It wrote cleaner code** and changed only what you asked it to change.
- **It followed instructions carefully,** including long, detailed ones.
- **It understood whole projects,** not just one file at a time.

Anthropic also launched **Artifacts** alongside it, where Claude shows generated code, documents, or small apps in a separate panel next to the chat. You could ask for a small web tool and actually use it right there. It sounds like a small UI change, but it made Claude feel like a workspace instead of a chatbot.

Around the same time, AI code editors like Cursor took off among developers, and Claude 3.5 Sonnet became the model most people picked inside them. For a lot of programmers, their main daily AI tool quietly became Claude, even if they never opened claude.ai.

## October 2024: agents and computer use

In October, Anthropic released an **upgraded Claude 3.5 Sonnet**. The headline number was on **SWE-bench Verified**, a benchmark that gives the model real GitHub issues from real open-source projects and checks whether its fix actually passes the tests. Its score jumped from **33.4% to 49.0%**, the best published result at the time.

The same release introduced **computer use**: Claude can look at screenshots of a computer, move the mouse, click, and type, like a person would. It is slow and clunky, and Anthropic called it experimental. But it's the clearest sign yet of where things are heading: from AI that *answers* to AI that *does*.

And just last week, Anthropic released the **Model Context Protocol (MCP)**, an open standard for connecting AI models to tools and data sources (files, databases, apps) in a consistent way. I think this will matter a lot for agents.

What I found most interesting is that all of these are skills you need for **agents**, not just chat: working through long multi-step tasks, using tools correctly, and not breaking things along the way. Anthropic seems to be betting on that future, and so far the bet is paying off.

## The numbers

According to Menlo Ventures' report on enterprise AI, published in November 2024:

| | 2023 | 2024 |
|---|---|---|
| OpenAI's share of enterprise LLM use | 50% | 34% |
| Anthropic's share | 12% | 24% |

OpenAI is still ahead overall, but in one year Anthropic doubled its share while OpenAI lost about a third of its own. The same report lists code generation as one of the biggest use cases in companies, which lines up with where Claude is strongest. Amazon also announced another $4 billion investment in Anthropic last month, bringing its total to $8 billion.

## Why I think it happened

**1. Coding first.** Developers are the earliest adopters and the most demanding users. They pick whatever saves them the most time, and they tell each other. Winning developers means winning the tools built for them.

**2. Reliability over flash.** For businesses, a model that follows instructions, stays on task, and admits uncertainty is worth more than one that impresses in a demo. Claude's style tends to be careful and direct, which fits real work.

**3. Long context.** Claude 3 models can read 200,000 tokens at once. Being able to load a whole codebase or a long contract in a single request matters a lot in practice.

**4. Thoughtful product choices.** Artifacts, Projects (shared knowledge for a set of chats), computer use, and MCP all point the same direction: making the model useful inside real workflows.

## To be precise

"Overtook" here means in **coding, developer preference, and enterprise momentum**. ChatGPT is still far bigger with everyday users, with hundreds of millions using it every week. And OpenAI's **o1** models, released in September, are very strong at maths and reasoning by "thinking" longer before they answer.

This race changes every few months, and I wouldn't bet on any lead being permanent. But it has been fun to watch the default choice stop being automatic.
