---
id: T18
title: "Seal the report and write the summary on every failure, and report record and listing problems"
layer: "app"
deps: ["T16"]
acs: ["AC-07", "AC-09", "AC-12"]
files_hint:
  [
    "deploy/publish.ts",
    "deploy/plan.ts",
    "deploy/report.ts",
    "tests/publish.test.ts",
    "tests/plan.test.ts",
    "tests/report.test.ts",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-03"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T18 — Seal the report and write the summary on every failure, and report record and listing problems

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-03. ACs: AC-07, AC-09, AC-12 — full text in [spec.md §5](../spec.md).

## Checklist

- [ ] `deploy/publish.ts` steps 4–6 (upload, swap, HTTPS check): any failure becomes a named failed check (e.g. `upload-failed`, `swap-failed`; `post-publish-check` already exists), the report is re-sealed with the right outcome, and the public summary is written. Never leave the interim `outcome: "stopped"` + `failedCheck: null`. Distinguish "server untouched" (failed before the swap) from "swap began" in the outcome so the report doesn't claim the server is untouched when it isn't — extend the closed sets in the report types as needed. Errors must not put server file names into the public summary or thrown messages.
- [ ] The interim report sealed before upload must satisfy `failedCheck set iff outcome ≠ published` (data-model.md:254) — use a distinct interim outcome (e.g. `in-progress`) or equivalent.
- [ ] `parseRecord` returns a reason (absent / unreadable / malformed-path) so `publish.ts` emits a `warning` entry for an unreadable record with deletion off (data-model.md:153-155) and the planner stops with `malformed-path` for a malformed owned path (data-model.md:121-123).
- [ ] Log each maintainer key's fingerprint when sealing (data-model.md:241) — public log is fine, fingerprints are not secret.
- [ ] Remote-tools probe: check each tool separately (`find tar mv xargs awk rmdir dirname mkdir rm`); a failed `find` is a failed listing (stop), not an empty listing. Unreadable folders: count `find` permission errors and put the count (no names) into the public summary and a warning into the encrypted report.
- [ ] Tests in `tests/publish.test.ts` (fake executor): swap fails mid-rename → report re-sealed, summary written, outcome says the swap began; upload fails → outcome says server untouched; unreadable record → warning; a tool missing → `remote-tools-missing`; `find` exits with permission errors → count reported.

## Definition of Done

- [ ] every failure after sealing produces a re-sealed report with a named outcome and a public summary; unreadable/malformed record and unreadable folders are reported; per-tool probe; tests for each
- [ ] `npm run lint && npm test` clean
