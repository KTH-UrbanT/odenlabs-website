---
id: T17
title: "Fail the build test when any built page references another host"
layer: "tests"
deps: ["T4"]
acs: []
files_hint: ["tests/build.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-04 F-02 (T7 split)"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T17 — Fail the build test when any built page references another host

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-02 (T7 split). ACs: none (spec §6 NFR) — full text in [spec.md §5](../spec.md).

Split from T7: the off-site-request half of T7 does not depend on the palette or fonts, so it ships now. The font-budget half stays in T7, blocked on T6. Spec §6 NFR: _Third-party requests: 0_.

## Checklist

- [ ] In `tests/build.test.ts`, scan every built `.html` (and `.css`) in `dist/` for absolute URLs in `src`, `href` (stylesheet/preload/icon), `srcset`, `url(...)` and `@import` that point to a host other than the site's own. Plain navigational `<a href>` to external sites (e.g. KTH) and `mailto:` are allowed — they are not requests the page makes.
- [ ] Unit-test the scanner (pure helper in the test file or `src/lib/` with its own test) on a planted fixture string with an off-site `<link rel=stylesheet>`, `<script src>`, `<img src>` and `url()` — each must be reported.

## Definition of Done

- [ ] guard passes on the current build and fails on a planted off-site reference
- [ ] `npm run lint && npm test` clean
