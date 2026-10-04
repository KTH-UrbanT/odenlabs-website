---
id: T32
title: "US-06 malformed-path in ux-flows, sad Flow 5 deletion-off stops"
layer: "docs"
deps: []
acs: ["AC-12"]
files_hint: ["docs/features/clean-starter/ux-flows.md", "docs/features/clean-starter/sad.md"]
owner: "pasichnyi"
source: "review-2026-10-05-5 F5-06"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T32 — US-06 malformed-path in ux-flows, sad Flow 5 deletion-off stops

Follow-up from the review: [`_review/review-2026-10-05-5.md`](../_review/review-2026-10-05-5.md). ACs: AC-12 — full text in [spec.md §5](../spec.md).

`ux-flows.md:175-176, 187-188` say the checks run in "the same order as `deploy/plan.ts`" but leave out `malformed-path`,
which the planner checks first for build paths (`deploy/plan.ts:374-377`) and again for the record before the deletion
gate (`:410-415`), whatever the deletion setting. `sad.md:492` (Flow 5, deletion-off stop branch) names only the
protected and layout clashes; `approved-in-build` and `malformed-path` also stop with deletion off (`data-model.md:162, 193`).

## Checklist

- [ ] F5-06 `ux-flows.md`: name `malformed-path` first (build paths) and again for the record before the deletion gate, in the flowchart and the prose; or drop "the same order as `deploy/plan.ts`". Keep the AC references on each branch.
- [ ] F5-06 `sad.md:492`: add `approved-in-build` and `malformed-path` to the Flow 5 deletion-off stop branch.

## Definition of Done

- [ ] ux-flows and sad Flow 5 list every stop the planner can return, in its order
- [ ] `npm run lint && npm test` clean
