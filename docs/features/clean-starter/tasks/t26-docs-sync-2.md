---
id: T26
title: "Docs sync: AC-13b, ownership table, CODEOWNERS rule, failure outcomes"
layer: "docs"
deps: ["T24", "T25"]
acs: ["AC-08", "AC-09", "AC-12", "AC-13b"]
files_hint: ["docs/features/clean-starter/data-model.md", "docs/features/clean-starter/sad.md", "docs/features/clean-starter/adr/0005-gate-publishing-rules-by-review-and-main-only-server-secrets.md", "tests/plan.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-04-2 R-03, R-04"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T26 — Docs sync: AC-13b, ownership table, CODEOWNERS rule, failure outcomes

Follow-up from the review: [`_review/review-2026-10-04-2.md`](../_review/review-2026-10-04-2.md). ACs: AC-08, AC-09, AC-12, AC-13b — full text in [spec.md §5](../spec.md).

Spec now carries AC-13b (added-by-fix, maintainer decision in the review): an unknown or protected file in the
way of the build stops the publish with `layout-clash`. The code already does this (`deploy/plan.ts:356-366, 401-407`,
`deploy/remote/swap.sh:50-65`); the docs don't say so.

## Checklist

- [ ] `data-model.md:192` ownership table: split "owned / approved + inBuild" into "owned + inBuild: overwrite" and "approved + inBuild: stop `approved-in-build`"; add a rule: any listed path (protected, owned or unknown) that is a strict parent or child of a build path, or a link on the way, stops with `layout-clash`. Define `layout-clash` where `FailedCheck` is listed (~269).
- [ ] `sad.md` §8: mirror AC-13b; add the AC-13b row to the §6 coverage table (Flow 1 / Flow 5 stop branch).
- [ ] `sad.md` ~288, ~729 and ADR-0005 ~37: state the real CODEOWNERS rule — every file the deploy step loads while `SSH_PRIVATE_KEY` is in its environment — and point to `tests/workflow.test.ts`. ADR-0005 gets a dated note, not a rewritten decision.
- [ ] `sad.md` §6 Flow 1 (~355-369) and Flow 5 (~493-503): add an "upload or swap fails" branch showing the re-sealed report with outcome `failed-before-swap` / `failed-during-swap` and the public summary with counts only.
- [ ] `tests/plan.test.ts:484-497`: rename the "unknown" clash case to cite AC-13b.

## Definition of Done

- [ ] every item in the checklist done; AC-13b traced spec → sad → data-model → test
- [ ] `npm run lint && npm test` clean
