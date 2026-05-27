# Transcripts

This folder powers the `/transcripts` hub and individual transcript pages.

## How it works

- Add an entry to `index.json`
- Add a matching Markdown file: `<slug>.md`

## Entry format (`index.json`)

```json
{
  "slug": "example-episode",
  "title": "Example Episode Title",
  "publishedAt": "2026-05-27",
  "summary": "One-paragraph summary used for SEO + AI discovery.",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
  "faqs": [
    { "q": "Question?", "a": "Answer." }
  ],
  "primaryCta": { "label": "Book a setup call", "href": "/calendar" }
}
```

