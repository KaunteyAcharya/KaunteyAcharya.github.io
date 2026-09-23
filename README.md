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
notes/posts.json      list of posts
notes/posts/*.md      post content
notes/images/         images for posts
notes/_TEMPLATE.md    copy this to start a post
```

## Writing a new note

1. Create `notes/posts/my-new-post.md` and write in Markdown (math: `$...$`, `$$...$$`).
2. Add an entry at the top of `notes/posts.json`:

   ```json
   {
     "slug": "my-new-post",
     "title": "My new post",
     "date": "2026-10-01",
     "tags": ["physics"],
     "summary": "One sentence for the list page."
   },
   ```

3. Commit and push. It shows up on the Notes page and in the home page's Notes section.

You can do this entirely in the GitHub web editor: **Add file → Create new file**, type
`notes/posts/my-new-post.md`, write, commit; then edit `posts.json`.

Tips: add `"draft": true` to hide a post; keep the JSON valid (commas between entries, none after the last).

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
