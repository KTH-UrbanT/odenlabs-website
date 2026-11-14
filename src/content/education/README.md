# Education

One Markdown file per course, programme or handbook. The file name is the entry's ID
(`transdisciplinary-approaches.md` → `transdisciplinary-approaches`). Entries have no
pages of their own: the Education page lists them, grouped by kind, with the text
next to the title.

```md
---
title: Smart Cities and Climate Mitigation Strategies # required
summary: One or two sentences. # required
kind: course # required: course, programme or handbook
code: MJ2685 / MJ2686 # optional, the course code
people: [jane-doe] # optional, IDs from src/content/people/
url: https://example.org # optional, external page
order: 0 # optional, lower comes first (default 0); then by title
draft: true # optional: keep an unfinished entry off the site (default false)
---

Longer description in Markdown, shown under the summary.
```

A person ID that does not exist fails the build.

An entry that still holds a `TODO(...)` placeholder must be `draft: true`: publishing
it, or publishing an entry that refers to a draft, fails the build.
