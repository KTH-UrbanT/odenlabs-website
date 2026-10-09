---
id: T3
title: "Render only offered sections in the header and assert every header link resolves"
layer: "ui"
deps: ["T1"]
blocks: []
acs: ["AC-03"]
files_hint: ["src/components/Header.astro", "tests/build.test.ts"]
owner: "pasichnyi"
estimate: "S"
context_budget: "S"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T3 — Render only offered sections in the header and assert every header link resolves

## Place in the sequence

- **Blocked by:** T1 (planned-sections list and `offeredSections()`) · **Blocks:** none · **Wave:** 2.
- **Lane:** shares `tests/build.test.ts` with T4, T5 and T7, so they are serialized.

## Why (user story)

> **As a** visitor
> **I want** the navigation to offer exactly the sections that exist, including new ones as soon as they are published
> **So that** every link I click leads somewhere
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

This task removes today's three dead header links: the header lists only planned sections whose page the build contains.

## Inlined context

> ├── components/Header.astro            # renders offeredSections(); logo links home
>
> — `sad.md §5, internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> `tests/build.test.ts` asserts … that every header link resolves to a file in `dist/`.
>
> — `sad.md §10, QG-2 How verify, abridged` · full text: [sad.md](../sad.md)

> **Dead navigation links on the live site** — baseline: 3 (Research, People, Join/Contact in the skeleton header); target: 0 at launch and after every publish.
>
> — `spec.md §7, KPI, verbatim` · full text: [spec.md](../spec.md)

Today `Header.astro` hard-codes a `nav` array with the same three entries. Pages are found at build time with `import.meta.glob("../pages/**/*.{astro,md}")`, mapped to the same `dist/`-relative file paths T1's `hrefToFile()` produces. Reuse: existing `Header.astro` markup and styles, unchanged; no new component.

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) in full and follow them. Do not guess.

## Data delta

No DB changes. Reads `PLANNED_SECTION` (`src/data/sections.ts`, from T1).

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-03 — happy path

> **Given** a section is on the site's ordered list of planned sections and its page has been published
> **When** a visitor opens any page
> **Then** the navigation offers that section, in the planned order and with its planned label, without a separate navigation edit, and planned sections without a page are not offered
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Replace the hard-coded `nav` array with `offeredSections(sections, builtPages)` — `src/components/Header.astro`
- [ ] Keep the `<nav>` element even when empty; the logo still links to `/` — `src/components/Header.astro`
- [ ] Build test: every `<a href>` inside `<header>` of every built HTML file resolves to a file in `dist/` — `tests/build.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| No section page exists (today) | header shows the logo and an empty navigation; the build test passes |
| A section page is added later | it appears in the header on the next build with no header edit |

## Definition of Done

- [ ] `dist/index.html` header contains no link to `/research/`, `/people/` or `/join/` while those pages do not exist
- [ ] `tests/build.test.ts` header-link assertion passes
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
