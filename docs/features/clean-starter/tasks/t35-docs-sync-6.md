---
id: T35
title: "T33 bookkeeping and ship drafts"
layer: "docs"
deps: ["T34"]
acs: []
files_hint: ["docs/features/clean-starter/tasks/tracker.md", "docs/features/clean-starter/tasks/t33-offsite-reader-desync.md", "docs/features/clean-starter/spec.md", "docs/features/clean-starter/changelog.md", "docs/features/clean-starter/pr-body.md"]
owner: "pasichnyi"
source: "review-2026-10-08 F7-04"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T35 — T33 bookkeeping and ship drafts

Follow-up from the seventh review: [`_review/review-2026-10-08.md`](../_review/review-2026-10-08.md). Run after T34 so the counts are final.

## Checklist

- [ ] `tasks/tracker.md`: update the total (35 tasks; add 0.7 d for T33 and T34, 0.3 d for T35) and add a "Review follow-ups, 7th pass" line.
- [ ] `tasks/t33-offsite-reader-desync.md`: tick the checklist and DoD boxes that are met (same convention as T24–T30).
- [ ] `spec.md`: bump `updated_at`.
- [ ] `changelog.md:40`: list the deferred items as they stand after T34 (R6-01, R6-03, R6-04 and anything left from the seventh pass). R6-02 is not deferred.
- [ ] `changelog.md:32`: reword "staged swaps leave no half-written folder" to match ADR-0003 (an interruption inside the rename step can leave some pages new and some old; spec §8 R-07).
- [ ] `pr-body.md`: refresh the number of review passes, the task range (through T35) and the test count from `npm test`.

## Definition of Done

- [ ] the drafts and the tracker agree with spec §8, ADR-0003 and the code at HEAD
- [ ] `npm run lint && npm test` clean
