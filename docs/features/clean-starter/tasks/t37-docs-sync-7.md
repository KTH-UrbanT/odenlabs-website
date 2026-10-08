---
id: T37
title: "T35 status, tracker total, R6-02 wording after T36"
layer: "docs"
deps: ["T36"]
acs: []
files_hint: ["docs/features/clean-starter/tasks/t35-docs-sync-6.md", "docs/features/clean-starter/tasks/tracker.md", "docs/features/clean-starter/spec.md", "docs/features/clean-starter/pr-body.md", "docs/features/clean-starter/changelog.md"]
owner: "pasichnyi"
source: "review-2026-10-08-2 G8-04"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T37 — Bookkeeping after T36

Follow-up from the eighth review: [`_review/review-2026-10-08-2.md`](../_review/review-2026-10-08-2.md). Run after T36 so the counts are final.

## Checklist

- [ ] `tasks/t35-docs-sync-6.md`: set `status: "done"` and tick the boxes (all are met).
- [ ] `tasks/tracker.md`: rows for T36 and T37, total 37 tasks and the person-days recomputed from the rows (S 0.3, M 0.7, 1d = 1 d; the stale ~16.3 should be ~16.4 before these two), a "Review follow-ups, 8th pass" line.
- [ ] `spec.md`: bump `updated_at`; tick R6-02 again once T36 is done (reworded in T36).
- [ ] `pr-body.md` (eight passes, T8–T37, the `npm test` count) and `changelog.md` agree with the tracker and spec §8.

## Definition of Done

- [ ] the drafts and the tracker agree with spec §8 and the code at HEAD
- [ ] `npm run lint && npm test` clean
