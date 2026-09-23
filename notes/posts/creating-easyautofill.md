---
title: Creating EasyAutoFill
date: 2026-07-20
tags: [projects]
summary: A local, open-source browser extension that fills any form from your own profile file.
---

My latest side project is [EasyAutoFill](https://github.com/KaunteyAcharya/Easy-Auto-Fill), a free, open-source browser extension that fills in forms from your own profile data.

## The idea

Typing the same name, email, links, education, and work history into form after form gets old quickly. Browser autofill handles the basics, but not the longer fields like a summary or a job description. So the idea was simple: keep your details in one file you control, and let the extension map them onto whatever form is in front of you.

You upload a profile as Markdown, JSON, TXT, or CSV, open any form, and click **Auto-Fill All Fields**. Filled fields turn green and unmatched ones turn yellow, so you can see exactly what happened. You can keep several profiles (say, one for tech roles and one for academic applications) and save custom mappings for sites you use often.

## Tech stack

- A **Chrome/Edge extension** with a popup UI, a content script for field detection, and a background service worker
- **Multi-strategy field matching**, where the highest-confidence match wins: input type first (`type="email"`), then a keyword map of labels, then direct key matching, and finally fuzzy matching with **Levenshtein distance** for typos and variations
- **Native event dispatch**, so React, Angular, and Vue forms register the filled values
- **IndexedDB** for storage: no server, no API calls, and no analytics

## What I enjoyed

I had a lot of fun with this one beyond the code. Working through the product ideation, deciding what the extension should and shouldn't do, designing the popup, and thinking about how a first-time user would feel was the best part for me.
