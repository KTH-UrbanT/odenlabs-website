---
id: T39
title: "Bookkeeping after T38"
layer: "docs"
deps: ["T38"]
acs: []
files_hint: ["docs/features/clean-starter/tasks/tracker.md", "docs/features/clean-starter/spec.md", "docs/features/clean-starter/pr-body.md", "docs/features/clean-starter/changelog.md"]
owner: "pasichnyi"
source: "review-2026-10-09 H9-01, H9-04"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T39 — Bookkeeping after T38

Follow-up from the ninth review: [`_review/review-2026-10-09.md`](../_review/review-2026-10-09.md). Run after T38 so the counts are final.

## Checklist

- [x] `tasks/tracker.md`: rows T38 and T39, total recomputed from the rows (S 0.3, M 0.7, 1d = 1 d), a "Review follow-ups, 9th pass" line.
- [x] `spec.md`: bump `updated_at`; R6-02 line: the legacy scan's rule and the residuals named in T38; tick it again once T38 is done.
- [x] `pr-body.md` (nine passes, T8–T39, the `npm test` count) and `changelog.md` agree with the tracker and spec §8.

## Definition of Done

- [x] the drafts and the tracker agree with spec §8 and the code at HEAD
- [x] `npm run lint && npm test` clean
