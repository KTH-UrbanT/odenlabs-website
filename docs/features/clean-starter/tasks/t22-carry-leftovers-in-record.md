---
id: T22
title: "Carry owned files a publish did not remove into the new record"
layer: "app"
deps: ["T21"]
acs: ["AC-07b", "AC-10"]
files_hint:
  [
    "deploy/plan.ts",
    "deploy/publish.ts",
    "tests/plan.test.ts",
    "tests/publish.test.ts",
    "docs/features/clean-starter/data-model.md",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-07"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T22 — Carry owned files a publish did not remove into the new record

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-07. ACs: AC-07b, AC-10 — full text in [spec.md §5](../spec.md).

With deletion off, `deploy/publish.ts` (~219-227) writes only `plan.upload` to the new record, so a page removed from the repo drops out of the record, becomes `unknown` once deletion is on, and stays live. The report label (`deploy/report.ts:38`) promises "removed once deletion is on".

## Checklist

- [ ] The plan exposes the owned-but-not-removed paths that are still in the listing (owned, not in the build, deletion off — or held back otherwise). The new record = uploaded files (fresh sha256) + those carried entries with their **previous** sha256 from the old record — `deploy/plan.ts`, `deploy/publish.ts`
- [ ] Owned entries no longer in the listing are dropped (nothing to carry).
- [ ] Tests: two-publish scenario in `tests/publish.test.ts` (fake executor): publish with deletion off after removing a page → record still lists it; next publish with deletion on → it is in the removal list and removed. Planner unit test for the carried set.
- [ ] `data-model.md` §PUBLISH_RECORD: record = uploaded + carried owned leftovers; state the invariant.

## Definition of Done

- [ ] with deletion off, a page removed from the repo stays in the record and is removed on the first publish with deletion on; data-model updated
- [ ] `npm run lint && npm test` clean
