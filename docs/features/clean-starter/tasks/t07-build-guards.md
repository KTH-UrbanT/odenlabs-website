---
id: T7
title: "Add build guards for zero off-site references and the per-page font budget"
layer: "tests"
deps: ["T6"]
blocks: []
acs: ["AC-05"]
files_hint: ["tests/build.test.ts"]
owner: "pasichnyi"
estimate: "S"
context_budget: "S"
status: "blocked"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T7 — Add build guards for zero off-site references and the per-page font budget

## Place in the sequence

- **Blocked by:** T6 (self-hosted fonts in place) · **Blocks:** none · **Wave:** 3.
- **Lane:** shares `tests/build.test.ts` with T3, T4 and T5, so they are serialized.

## Why (user story)

> **As a** visitor
> **I want** every page to carry the group's own recognisable, readable look derived from its logo
> **So that** I recognise the group and can read comfortably
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task keeps the identity self-contained: a later change that pulls a font or script from another host, or bloats the fonts, fails the check job.

## Inlined context

> | Third-party requests | 0 per page — fonts, styles and scripts all served from the site itself | build-time scan of built pages for off-site asset references |
> | Font payload | ≤ 100 KB of font files per page | build output size check |
>
> — `spec.md §6, NFR rows, verbatim` · full text: [spec.md](../spec.md)

> `tests/build.test.ts` scans every built HTML and CSS file for off-site `src`, `href` and `url()` references (a "build-time scan of built pages for off-site asset references") and sums the font files each page references (a "build output size check").
>
> — `sad.md §10, QG-3 How verify, verbatim` · full text: [sad.md](../sad.md)

> - **Data classification:** … serving fonts from the site itself keeps visitors' addresses away from third parties.
>
> — `spec.md §6.1, abridged` · full text: [spec.md](../spec.md)

Allowed off-site references: ordinary navigation links (`<a href>`) and the canonical `<link rel="canonical">`; these are not assets the browser fetches. Everything fetched (`src`, `<link rel="stylesheet|icon|preload">`, CSS `url()`, `@import`) must be same-site.

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) in full and follow them. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-05 — happy path

> **Given** the palette and type derived from the logo are in place
> **When** a visitor opens the front page or the not-found page
> **Then** both show the unchanged logo with the group's palette and type applied consistently, matching the before/after screenshot the maintainer signed off; that sign-off is a one-time manual acceptance — it never blocks a later publish, and later palette edits may change the look
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Scan every `dist/**/*.html` for fetched-asset attributes and every `dist/**/*.css` for `url()`/`@import`; fail on any absolute `http(s):` or protocol-relative `//` URL, naming file and URL — `tests/build.test.ts`
- [ ] For each built page, collect the font files reachable from its stylesheets and sum their sizes; fail above 100 KB, naming the page and the total — `tests/build.test.ts`
- [ ] A small fixture case proves each guard fails on a planted off-site reference and an oversized font — `tests/build.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| A content link to an external site (`<a href="https://kth.se">`) | allowed: navigation, not an asset |
| A `data:` URL font | counted towards the 100 KB budget |
| A page with no fonts | total 0, passes |

## Definition of Done

- [ ] both guards pass on the current build and fail on their planted fixtures
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
