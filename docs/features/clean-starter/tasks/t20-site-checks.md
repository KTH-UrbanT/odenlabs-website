---
id: T20
title: "Move the header's page rule into the navigation helper and close the readability-check gaps"
layer: "ui"
deps: ["T3", "T2"]
acs: ["AC-03", "AC-06"]
files_hint:
  [
    "src/lib/navigation.ts",
    "src/components/Header.astro",
    "src/styles/contrast-pairs.ts",
    "src/lib/contrast.ts",
    "tests/navigation.test.ts",
    "tests/contrast.test.ts",
    "tests/build.test.ts",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-05"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T20 — Move the header's page rule into the navigation helper and close the readability-check gaps

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-05. ACs: AC-03, AC-06 — full text in [spec.md §5](../spec.md).

## Checklist

- [ ] `src/lib/navigation.ts`: add a pure `pageToBuiltFile(pagePath)` (or equivalent) — `index.astro` → `index.html`, `research.astro`/`research.md`/`research.html` → `research/index.html`, `research/index.astro` → `research/index.html`, `people/myindex.astro` → `people/myindex/index.html` (exact `/index` check, not `endsWith("index")`), dynamic routes (`[x]`) → `null` (document in a comment that sections must be fixed-name pages). data-model.md:288-291 says the rule is defined once here. Unit-test every case — `tests/navigation.test.ts`
- [ ] `src/components/Header.astro`: use the helper; widen the glob to `.html` pages too.
- [ ] AC-03 build-level test in `tests/build.test.ts`: the header must not pass vacuously — assert that for every section in `src/data/sections.ts` whose page exists the header contains a link with its planned label in planned order, and that the test fails if `builtPages` were empty when a section page exists. If no section page exists in the repo, test the helper composition (`offeredSections(planned, builtPagesFrom(pageFiles))`) on a fixture page list that includes one, at the level the header uses.
- [ ] `src/styles/contrast-pairs.ts`: declare `{ name: "heading on page", text: "--color-brand", background: "--color-bg", size: "large" }` (global.css h1–h3).
- [ ] `tests/contrast.test.ts`: `checkPairs` tests with pairs at exactly 4.5:1 (body) and 3.0:1 (large) passing and just below each failing (use a stub ratio or colours computed for it); replace `length >= 5` with the exact list of pair names.
- [ ] `src/lib/contrast.ts`: when a token value can't be parsed, the error names the pair and the token; a token defined twice in tokens.css throws naming the token. Tests for both.

## Definition of Done

- [ ] page→built-file rule lives in navigation.ts with unit tests and an AC-03 build-level test; heading pair declared; exact threshold tests; parse errors name pair and token; duplicate tokens fail
- [ ] `npm run lint && npm test` clean
