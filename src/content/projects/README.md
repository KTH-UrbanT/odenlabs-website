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
image: ./jane.jpg # thumbnail in the project gallery, image file next to this one
imageAlt: A short description of the picture # required when image is set
draft: true # optional: keep an unfinished entry off the site (default false)
---

Project description in Markdown.
```

Every published project should have an `image`: it is the large thumbnail in the project
gallery (shown 4:3, cropped to fit; use a landscape picture at least 1200 px wide). Without
one the gallery shows an empty tile, and the build lists the projects that lack one. Use only
pictures the group may publish: its own, or ones with a licence that allows it.

A theme or person ID that does not exist fails the build.

An entry that still holds a `TODO(...)` placeholder must be `draft: true`: publishing
it, or publishing an entry that refers to a draft, fails the build.
