---
id: T30
title: "US-06 check order in ux-flows, AC-13b approved case, T16 trace line"
layer: "docs"
deps: []
acs: ["AC-11b", "AC-12", "AC-13b"]
files_hint: ["docs/features/clean-starter/ux-flows.md", "tests/plan.test.ts", "docs/features/clean-starter/tasks/t16-path-layout-guards.md"]
owner: "pasichnyi"
source: "review-2026-10-04-4 R4-05, R4-06"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T30 — US-06 check order in ux-flows, AC-13b approved case, T16 trace line

Follow-up from the review: [`_review/review-2026-10-04-4.md`](../_review/review-2026-10-04-4.md). ACs: AC-11b, AC-12, AC-13b — full text in [spec.md §5](../spec.md).

`firstFailedCheck` (`deploy/plan.ts:369-437`) runs, in this order: malformed build path → front page → logo →
`protected-clash` → `approved-in-build` → `layout-clash` → malformed record → (deletion on only) record and folder
→ removal limit. The US-06 flow in `ux-flows.md:150-176` says "five checks run in order", puts the record check
before the clashes, and leaves out `approved-in-build`. With deletion on, a wrong folder holding a stray `_astro`
file stops with `layout-clash`, but ux-flows predicts `no-previous-record`.

## Checklist

- [x] R4-05 `ux-flows.md:150-160`: reorder the flowchart to front page/logo → protected clash → approved-in-build → layout clash → record/folder (deletion on) → removal limit. Add the `approved-in-build` decision (yes → SCR-04 names the check), and keep the AC references on each branch. Done with one change: the spec has no AC for `approved-in-build` (it is a data-model guard from T21), so the branch cites the data-model rather than AC-11b, to avoid inventing a trace.
- [x] R4-05 `ux-flows.md:173-185`: rewrite the prose to the same order and count, or drop "in order". Check that the AC-13b coverage row still points at the right branch.
- [x] R4-06 `tests/plan.test.ts:484`: add `"approved"` to the `it.each`, with `approved: ["_astro"]`. Expect `layout-clash` if `approved-in-build` doesn't fire first. `_astro` is not in the build, so it shouldn't. Confirm by running the test.
- [x] R4-06 `tasks/t16-path-layout-guards.md:23`: "ACs: AC-11, AC-13" → "ACs: AC-11, AC-13, AC-13b".

## Definition of Done

- [x] the ux-flows US-06 order matches `deploy/plan.ts`; the AC-13b scope is tested for all four listed kinds; T16's body and frontmatter agree
- [x] `npm run lint && npm test` clean
