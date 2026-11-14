# Projects

One Markdown file per project. The file name is the project's ID
(`district-heating-ai.md` → `district-heating-ai`).

```md
---
title: District heating with AI # required
summary: One or two sentences for cards and lists. # required
themes: [urban-energy] # required, at least one ID from src/content/themes/
people: [jane-doe] # optional, IDs from src/content/people/
funder: Swedish Energy Agency # optional
start: 2025-01-01 # optional
end: 2027-12-31 # optional
url: https://example.org # optional, external project page
draft: true # optional: keep an unfinished entry off the site (default false)
---

Project description in Markdown.
```

A theme or person ID that does not exist fails the build.

An entry that still holds a `TODO(...)` placeholder must be `draft: true`: publishing
it, or publishing an entry that refers to a draft, fails the build.
