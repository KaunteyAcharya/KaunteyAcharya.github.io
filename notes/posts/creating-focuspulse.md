I have been building [FocusPulse](https://github.com/KaunteyAcharya/FocusPulse), a small Chrome extension for tracking focus.

## The idea

Most productivity trackers watch you: they log which sites you visit and hand you a report at the end of the week. FocusPulse goes the other way. You tell it what you are doing, right now, with one click:

- **Green** for deep focus
- **Blue** for working with music or a podcast on
- **Orange** for mindless tab-switching (you estimate the minutes lost, and it adds a 10-minute penalty)
- **Red** for a break

A floating widget sits on every tab and shows today's colour ratio filling up in real time. The bet is that watching your own green bar grow is its own reward. You are not being tracked; you are tracking yourself, and I think that difference matters. It is honesty-based and non-punitive: orange and red are just time you can win back.

## Tech stack

- Chrome extension on **Manifest V3**, written in plain **JavaScript** and **CSS**
- A **background service worker** holds the single source of truth: the active colour, time per colour, widget position, and session history
- A **content script** injects the widget into every tab and keeps it in sync through runtime messages and storage-change events
- Everything lives in **chrome.storage.local**: no backend, no account, and no data leaving the browser

Phase 1 (the persistent widget and basic logging) works. Next up are an analytics dashboard, streaks, small nudges, end-of-day summaries, and eventually export and idle detection.

## Help me make it better

The whole point is for FocusPulse to be a little addictive, in a good way. If you have ideas on how to make it more engaging (or you try it and something feels off), drop me an [email](mailto:kaunteyacharya2000@gmail.com) or message me on [LinkedIn](https://www.linkedin.com/in/kauntey-acharya). I would love to hear them.
