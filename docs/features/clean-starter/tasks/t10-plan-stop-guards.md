---
id: T10
title: "Add the planner stop-guards: protected clash, missing front page/logo, record, removal limit, malformed path"
layer: "domain"
deps: ["T9"]
blocks: ["T13"]
acs: ["AC-11b", "AC-12"]
files_hint: ["deploy/plan.ts", "tests/plan.test.ts"]
owner: "pasichnyi"
estimate: "M"
context_budget: "S"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T10 — Add the planner stop-guards

## Place in the sequence

- **Blocked by:** T9 (classification and plan) · **Blocks:** T13 (publish shell) · **Wave:** 3.
- **Lane:** shares `deploy/plan.ts` and `tests/plan.test.ts` with T8 and T9, so they are serialized.

## Why (user story)

> **As a** maintainer
> **I want** each publish to remove from the live site whatever I removed from the repository
> **So that** the live site stays accurate without manual server work
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task makes the mirror refuse to run when the build or the folder looks wrong, so a misconfiguration cannot turn into "wipe the account".

## Inlined context

> - Wrong or empty target folder (misconfigured publish destination): the publish refuses to delete when the folder does not contain the site's previously published files, and never removes more than the routine limit without an approved list — blast radius capped before anything is lost.
>
> — `spec.md §6.1, Abuse cases, verbatim` · full text: [spec.md](../spec.md)

> | Routine removal limit | ≤ 20 files removed per publish without a maintainer-approved list | publish guard; count shown in the removal report |
>
> — `spec.md §6, NFR row, verbatim` · full text: [spec.md](../spec.md)

> `tests/plan.test.ts` has one case per guard and per branch: empty folder, wrong folder, missing record, record without front page or logo, 20 versus 21 removals, an approved list off by one file, a protected clash, unknown files including odd names.
>
> — `sad.md §10, QG-1 How verify, verbatim` · full text: [sad.md](../sad.md)

> With deletion on and no record present, the AC-12 check stops the publish.
>
> — `adr/0002, Ownership model, abridged` · full text: [ADR-0002](../adr/0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor.md)

**Fallback:** insufficient or contradicted by the code → read [data-model.md](../data-model.md) · [sad.md](../sad.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes. `FailedCheck` values this task produces: `missing-front-page`, `missing-logo`, `no-previous-record`, `record-without-front-page-or-logo`, `removal-limit`, `protected-clash`, `malformed-path`. Exact-match rule: when planned removals exceed `removalLimit`, the planned removal set must **equal** the approved paths still present on the server; approved paths already gone are ignored and reported as a `warning`. Unreadable record = no matching record: stop with deletion on; with deletion off, go ahead and warn.

— `data-model.md §PUBLISH_REPORT, §APPROVED_REMOVAL, §PUBLISH_RECORD, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Guards run inside `planPublish()` and return `{ ok: false, failedCheck, entries }` before any plan is produced.

## Acceptance criteria

### AC-11b — error

> **Given** the build contains a file at the same address as a protected file
> **When** the maintainer publishes
> **Then** the publish stops before changing anything on the server and tells the maintainer which file clashes with a protected file
>
> — `spec.md §5, AC-11b, verbatim` · full text: [spec.md](../spec.md)

### AC-12 — error

> **Given** the build is missing the front page or the logo, or the target folder does not contain the previous publish's record together with the front page and logo that record lists, or the publish would remove more files than the routine removal limit without the maintainer having approved that exact list (an approval of a list that differs by even one file does not count)
> **When** the maintainer publishes
> **Then** the publish stops before deleting anything and tells the maintainer which check failed
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Guard order: malformed acted-on path → missing front page/logo in build → protected clash → (deletion on only) record missing/unreadable → record lacks front page/logo, or the folder lacks them → removal limit with exact match — `deploy/plan.ts`
- [ ] The protected clash applies with deletion off too (it would overwrite a protected file) — `deploy/plan.ts`
- [ ] One test per guard and per QG-1 case listed above: empty folder, wrong folder, 20 vs 21 removals, approved list off by one (one extra, one missing) — `tests/plan.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Exactly 20 removals, no approval | allowed (≤ 20) |
| 21 removals, approved list equals them | allowed |
| 21 removals, approved list has one extra still on the server | stop `removal-limit` |
| Wrong folder (no record, unrelated files), deletion on | stop `no-previous-record` before any removal |
| Empty folder, deletion on | stop `no-previous-record` |
| Malformed name on an unknown file | not a stop (T9 reports it) |

## Definition of Done

- [ ] every guard has a passing failing-input test in `tests/plan.test.ts` and names its check
- [ ] each stop returns before any `upload` or `remove` is produced
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
