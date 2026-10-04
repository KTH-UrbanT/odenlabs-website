---
id: T28
title: "Docs sync: AC-13b in ux-flows, AC-13b scope, task traceability"
layer: "docs"
deps: []
acs: ["AC-13", "AC-13b"]
files_hint: ["docs/features/clean-starter/ux-flows.md", "docs/features/clean-starter/spec.md", "docs/features/clean-starter/data-model.md", "docs/features/clean-starter/tasks.json", "docs/features/clean-starter/tasks/t16-path-layout-guards.md", "docs/features/clean-starter/tasks/t24-offsite-entity-decoding.md"]
owner: "pasichnyi"
source: "review-2026-10-04-3 F-1, F-3, F-4"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T28 — Docs sync: AC-13b in ux-flows, AC-13b scope, task traceability

Follow-up from the review: [`_review/review-2026-10-04-3.md`](../_review/review-2026-10-04-3.md). ACs: AC-13, AC-13b — full text in [spec.md §5](../spec.md).

The code stops with `layout-clash` on **any** listed path in the way of the build — unknown, protected, owned or
approved (`deploy/plan.ts:356-366, 401-407`; `tests/plan.test.ts:484-497` covers owned). The docs say less.

## Checklist

- [ ] F-1 `ux-flows.md:147-182`: in the US-06 flowchart, add a decision before "Upload build" — "Listed file or folder in the way of a build path?" — with yes → "SCR-04 names `layout-clash` and the path (AC-13b)"; one sentence of prose; add the coverage row `AC-13b | Flow US-06 → layout-clash branch → SCR-04` to the table at `:203-223`.
- [ ] F-3 `spec.md` AC-13b Given: "a listed file or folder in the server folder (unknown, protected, owned or approved)". Keep the `added-by-fix` marker and add a note that the scope was widened in review 2026-10-04 (3rd pass).
- [ ] F-3 `data-model.md:204-205`: "(protected, owned or unknown)" → "(protected, owned, approved or unknown)". Check sad §6 Flows 1/5 and §8 wording match.
- [ ] F-4 `tasks.json` + the T16 task file: add `AC-13b` to T16's `acs`.
- [ ] F-4 T24 task file: note that its code commit `04b4222` carries no `SDD-Task: T24` trailer (history is not rewritten).

## Definition of Done

- [ ] AC-13b traced spec → ux-flows → sad → data-model → T16 → test, with the same scope everywhere
- [ ] `npm run lint && npm test` clean
