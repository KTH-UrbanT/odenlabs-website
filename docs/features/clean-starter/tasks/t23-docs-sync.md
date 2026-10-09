---
id: T23
title: "Bring the docs in line with the code after review"
layer: "docs"
deps: ["T16", "T17", "T18", "T19", "T20", "T21", "T22"]
acs: ["AC-14"]
files_hint:
  [
    "README.md",
    "docs/features/clean-starter/sad.md",
    "docs/features/clean-starter/ux-flows.md",
    "docs/features/clean-starter/data-model.md",
    "docs/features/clean-starter/adr/0001-build-a-static-web-frontend-and-a-separate-publish-worker.md",
    "docs/features/clean-starter/tasks/",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-06 (docs items)"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T23 — Bring the docs in line with the code after review

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-06 (docs items). ACs: AC-14 — full text in [spec.md §5](../spec.md).

## Checklist

- [ ] `README.md` ~39-47: rewrite the stale Deploy section (the publish job runs `node deploy/publish.ts` with secrets from the main-only `kth-server` environment; link `deploy/README.md`).
- [ ] Commit the `sad.md` §6 edit (Flows 3–8 + coverage); mark Flow 8 and the AC-05/AC-15 coverage rows as pending T5/T6.
- [ ] `ux-flows.md` ~38,107,116: a failing colour pair is reported in the check job's log, not the publish report (ADR-0004).
- [ ] `data-model.md` ~162: sha256 is recorded for repair/audit; no check reads it yet — fix the wording.
- [ ] ADR-0001: note that no events contract is produced — nothing consumes the worker's events.
- [ ] `tasks/t01…t23` frontmatter `status` synced with `tracker.md`.

## Definition of Done

- [ ] lint clean; every item in the checklist done
- [ ] `npm run lint && npm test` clean
