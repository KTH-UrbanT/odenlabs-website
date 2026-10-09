---
id: T41
title: "Bookkeeping after T40"
layer: "docs"
deps: ["T40"]
acs: []
files_hint: ["docs/features/clean-starter/tasks/tracker.md", "docs/features/clean-starter/spec.md", "docs/features/clean-starter/pr-body.md", "docs/features/clean-starter/changelog.md"]
owner: "pasichnyi"
source: "review-2026-10-09-2 J10-03"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T41 — Bookkeeping after T40

Follow-up from the tenth review: [`_review/review-2026-10-09-2.md`](../_review/review-2026-10-09-2.md). Run after T40 so the counts are final.

## Checklist

- [x] `tasks/tracker.md`: rows T40 and T41, total recomputed from the rows (S 0.3, M 0.7, 1d = 1 d), a "Review follow-ups, 10th pass" line.
- [x] `spec.md`: R6-02 line carries the corrected residuals and false-positive wording from T40, ticked once T40 is done; bump `updated_at`.
- [x] `pr-body.md` (ten passes, T8–T41, the `npm test` count) and `changelog.md` agree with the tracker and spec §8.

## Definition of Done

- [x] the drafts and the tracker agree with spec §8 and the code at HEAD
- [x] `npm run lint && npm test` clean
