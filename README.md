# kaunteyacharya.github.io

Personal site of Kauntey Acharya. Plain HTML/CSS/JS, no build step, hosted on GitHub Pages.

```
index.html            main page
notes.html            notes list + single-note view (notes.html?post=<slug>)
assets/style.css      all styles (light/dark tokens at the top)
assets/main.js        theme toggle, scroll reveal, "latest posts" on the home page
assets/chatbot.js     portfolio assistant (edit the KB array to change answers)
assets/notes.js       notes engine (Markdown + optional LaTeX via KaTeX)
assets/vendor/        marked.js (Markdown parser, self-hosted)
notes/posts/*.md      one file per note (front matter + Markdown)
notes/posts.json      backup list, only used if GitHub can't be reached
notes/images/         images for posts
notes/_TEMPLATE.md    copy this to start a post
```

## Writing a new note

Upload one Markdown file to `notes/posts/`. Nothing else to edit.

```markdown
---
title: My new note
date: 2026-10-01
tags: [AI, projects]
summary: One sentence for the list page.
---

Your text here. Markdown and LaTeX ($...$, $$...$$) both work.
```

- The file name becomes the link (`my-new-note.md` → `notes.html?post=my-new-note`).
- Notes are sorted by `date`, newest first. The newest three also appear on the home page.
- Add `draft: true` to hide a note. Files starting with `_` are ignored.
- If you leave out `summary`, the first paragraph is used. If you leave out `title`, a leading `# Heading` or the file name is used.

In the GitHub web editor: open `notes/posts/` → **Add file → Create new file** → name it, paste, commit.
It appears within a minute or two (visitors' browsers cache the list for 5 minutes).

How it works: `assets/main.js` asks the GitHub API which files are in `notes/posts/` and reads each file's
front matter. If the API can't be reached (for example, a visitor hits GitHub's hourly limit), the site
falls back to `notes/posts.json`. That file is only a backup, so it's fine if it goes out of date.

## Previewing locally

`fetch()` doesn't work from `file://`, so serve the folder:

```
python -m http.server 8000
```

then open http://localhost:8000.

## Chat assistant

Everything it knows is in `assets/chatbot.js` (`KB`). Each entry has `keys` (trigger words),
`answer` (`[label](url)` becomes a link) and optional `chips` (suggested follow-ups).
It runs entirely in the browser. Contact answers give email and LinkedIn only.
