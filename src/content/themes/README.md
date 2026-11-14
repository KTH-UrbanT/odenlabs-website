# Themes

One Markdown file per research theme. The file name is the theme's ID
(`urban-energy.md` → `urban-energy`); people and projects refer to themes by it.

```md
---
title: Urban energy systems # required
summary: One or two sentences for cards and lists. # required
order: 1 # optional, lower comes first (default 0)
draft: true # optional: keep an unfinished entry off the site (default false)
---

Longer description of the theme in Markdown.
```

An entry that still holds a `TODO(...)` placeholder must be `draft: true`: publishing
it, or publishing an entry that refers to a draft, fails the build.
