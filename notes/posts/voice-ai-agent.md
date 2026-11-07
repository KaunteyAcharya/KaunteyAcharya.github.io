---
title: Building Aditi, a Hindi and English voice agent with Pipecat and tool calling
date: 2026-11-07
tags: [AI, projects]
summary: A real-time voice agent for a fictional Ahmedabad real estate agency. She searches listings, works out EMIs, books site visits, and texts a follow-up, in Hindi or English, on a laptop CPU and free tiers.
related: [local-rag-agent, tickerbrief, ai-stack-advisor]
---

Most of my other projects are workflows: the steps are fixed, and the LLM fills in one part of them. For this one I wanted to build a real agent, where the model listens to a caller and decides for itself which tool to use next. The result is [Aditi](https://github.com/KaunteyAcharya/voice-ai-agent), a real-time voice agent for Tatsat Real Estate, a fictional agency in Ahmedabad.

In one line: you talk to her in the browser, in English, Hindi, or Hinglish, and she searches listings, answers questions, calculates home-loan EMIs, books, moves, or cancels site visits, and texts you a follow-up SMS. You can interrupt her mid-sentence or ask her to switch language mid-call. It runs on a normal laptop (CPU only) and free tiers.

*All properties, prices, and bookings are fictional. The neighbourhoods are real Ahmedabad and Gandhinagar areas.*

## What makes it an agent

Aditi has ten tools: `search_properties`, `get_property_details`, `calculate_emi`, `schedule_site_visit`, `find_my_visits`, `reschedule_site_visit`, `cancel_site_visit`, `send_follow_up`, `set_language`, and `end_call`. The order of steps is not scripted. The LLM reads the conversation and decides which tool to call, with which arguments, and when to just talk.

A typical call shows why that matters. A caller asks for a three-bedroom flat in Bopal around 90 lakh, then asks about parking, then about the EMI on a 70 lakh loan, then asks to visit tomorrow at 11. That slot is taken, so Aditi offers 12 or 10 instead and books the one the caller picks. No fixed script handles that order of events; the model chooses each step.

## How a call flows

Audio travels between the browser and a local Python server over WebRTC. On the server, Pipecat runs the pipeline:

```
Mic -> WebRTC -> speech-to-text (Groq Whisper)
    -> turn detection (Silero VAD + smart-turn model)
    -> LLM (Groq gpt-oss-120b, with backups)  <->  tools (search, EMI, bookings, SMS)
    -> text-to-speech (Edge neural voices, Kokoro fallback)
    -> WebRTC -> speaker
```

The browser shows a live transcript, property and booking cards, a log of every tool call, and the latency of each turn. Bookings are stored in SQLite, so a caller can ring back later to check, move, or cancel a visit.

## Talking like a person, not a form

Voice is less forgiving than chat, so a lot of the work went into the conversation itself:

- **Natural turn-taking.** A voice activity detector plus Pipecat's smart-turn model decide when the caller has finished speaking, and barge-in stops Aditi the moment the caller talks over her.
- **Hindi and English.** The caller can pick a language before the call or switch during it ("Hindi mein baat karo"). Hindi replies are simple Hinglish in Devanagari, and money is spoken the Indian way: "82 lakh", "1 crore 25 lakh".
- **Understanding how people say things.** The model passes tool arguments the way the caller said them, like "90 lakh" or "kal" (tomorrow). Dedicated parsing code turns those into amounts, dates, and times before any tool runs.
- **Guarded phone numbers.** A number is only used if the caller actually said it, even when it comes in pieces ("double nine, seven zero…"). The model cannot invent one to finish a booking.
- **Polite endings.** After 10 seconds of silence Aditi gives one warning, then ends the call. Before saying goodbye she listens for 3 more seconds in case the caller has one more question, and the call ends with a summary: duration, searches, homes discussed, EMI, and visits.

## Staying up on free tiers

Free tiers have rate limits, and a voice call cannot pause for an error message. So every stage has a fallback:

- **An LLM backup chain.** Groq `gpt-oss-120b` comes first, then `qwen3.8-27b`, then `gpt-oss-20b`, then Gemini. On a rate limit, an error, or a stall, the same turn silently re-runs on the next model. A stall is defined by timeouts: 9 seconds to the first token and 10 seconds of silence mid-reply.
- **A voice fallback.** If the cloud voice fails, a local Kokoro voice speaks the same sentence.
- **Pre-recorded fixed lines.** The greeting, "one moment", the silence warning, and goodbye play from audio generated in advance.
- **Swappable providers.** Speech-to-text, the LLM, and text-to-speech can each be switched in one settings file, including an all-Sarvam stack for better Indian-language coverage.

## The follow-up SMS

When a caller agrees, Aditi saves their number and texts them the homes they liked plus two or three more good options. The SMS goes out for free from an Android phone through textbee, so it reaches any Indian number using the phone's own SMS plan. Every message is logged as sent, failed, or saved, so the team can follow up on any that did not go out.

WhatsApp would have been the obvious channel, but Meta only allows free messages to five pre-verified test numbers; messaging any caller needs a paid, approved template.

## Testing a conversation

A voice agent is hard to test with ordinary unit tests alone, so there are two layers. A pytest suite covers the tools and parsing. On top of that, Pipecat's eval harness runs conversation tests in text mode:

- **Scripted callers:** fixed lines, where each turn checks which tool Aditi called and whether her reply meets a plain-English criterion.
- **Simulated callers:** an LLM plays a caller with a persona and a goal (a buyer booking a visit, a Hindi-speaking renter, someone moving or cancelling a booking, an off-topic chatter). A separate judge LLM decides whether Aditi got it right and scores each reply for voice style.

The judge, the simulated caller, and the bot under test each run on a different Groq model, so they never share one rate limit.

## Tech stack

- **Pipecat** for the real-time voice pipeline, with WebRTC between browser and server
- **Groq Whisper** for speech-to-text, **Groq** and **Gemini** models for the LLM chain
- **Edge neural voices** for speech, with **Kokoro** running locally as the fallback
- **Silero VAD** and Pipecat's **smart-turn** model for turn-taking
- **FastAPI**, **SQLite**, and a plain HTML, CSS, and JavaScript front end
- **textbee** for the follow-up SMS

## Limitations

- Gujarati was dropped because there is no free, good-quality Gujarati voice that runs on a CPU. The Sarvam stack supports it.
- Groq Whisper does not stream, which adds about 0.3 to 0.5 seconds per turn. Sarvam's speech-to-text streams.
- The follow-up SMS depends on the textbee phone being on and online; unsent messages stay in the log.
- Free tiers are shared and sometimes slow, so an occasional failure in testing can be the provider rather than the agent.

The code, setup steps, and a demo script in both languages are in the [GitHub repository](https://github.com/KaunteyAcharya/voice-ai-agent).
