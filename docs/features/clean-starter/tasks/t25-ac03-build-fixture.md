---
id: T25
title: "Exercise the header's offered sections against a real section page"
layer: "tests"
deps: ["T20"]
acs: ["AC-03"]
files_hint: ["tests/build.test.ts", "tests/fixtures/"]
owner: "pasichnyi"
source: "review-2026-10-04-2 R-02"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T25 — Exercise the header's offered sections against a real section page

Follow-up from the review: [`_review/review-2026-10-04-2.md`](../_review/review-2026-10-04-2.md). ACs: AC-03 — full text in [spec.md §5](../spec.md).

`src/pages/` holds only `index.astro` and `404.astro`, so `tests/build.test.ts:76-86` compares `[]` with
`[]`. A header that renders no `<nav>` links still passes. The wiring (Header.astro glob → strip `../pages/` →
`builtPagesFrom` → rendered `<a>` in planned order with its label) is never exercised with a real section page.

## Checklist

- [ ] Build a temp copy (or fixture root) of the site with at least one planted section page (e.g. `src/pages/research.astro` and a `join/index` page) and assert the header lists exactly those sections, with their planned labels, in planned order.
- [ ] Assert `expected.length > 0` so the test cannot pass vacuously.
- [ ] Keep the existing assertion on the real build (no section pages → no section links).

## Definition of Done

- [ ] the AC-03 build test asserts a non-empty ordered {label, href} list and fails if the header renders no section links
- [ ] `npm run lint && npm test` clean
