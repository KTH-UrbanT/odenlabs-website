# People

One Markdown file per person. The file name is the person's ID
(`jane-doe.md` → `jane-doe`); projects refer to people by it.

```md
---
name: Jane Doe # required
role: PhD student # required
themes: [urban-energy] # optional, IDs from src/content/themes/
photo: ./jane-doe.jpg # optional, image next to this file
email: jane@kth.se # optional
links: # optional
  - label: Google Scholar
    url: https://scholar.google.com/...
alumni: false # optional (default false)
order: 0 # optional, lower comes first (default 0)
draft: true # optional: keep an unfinished entry off the site (default false)
---

Short bio in Markdown.
```

A theme ID that does not exist fails the build.

An entry that still holds a `TODO(...)` placeholder must be `draft: true`: publishing
it, or publishing an entry that refers to a draft, fails the build.
