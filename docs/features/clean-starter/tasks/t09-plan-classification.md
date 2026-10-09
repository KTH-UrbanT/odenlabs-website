---
id: T9
title: "Implement planPublish() classification and the upload / remove / list plan"
layer: "domain"
deps: ["T8"]
blocks: ["T10"]
acs: ["AC-01", "AC-07", "AC-07b", "AC-10", "AC-11", "AC-13"]
files_hint: ["deploy/plan.ts", "tests/plan.test.ts"]
owner: "pasichnyi"
estimate: "M"
context_budget: "M"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T9 — Implement planPublish() classification and the upload / remove / list plan

## Place in the sequence

- **Blocked by:** T8 (publish model and parsers) · **Blocks:** T10 (stop-guards) · **Wave:** 2.
- **Lane:** shares `deploy/plan.ts` and `tests/plan.test.ts` with T8 and T10, so they are serialized.

## Why (user story)

> **As a** maintainer
> **I want** each publish to remove from the live site whatever I removed from the repository
> **So that** the live site stays accurate without manual server work
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task is the heart of the safe mirror: it decides, per server file, whether to upload over it, remove it, keep it or list it.

## Inlined context

> `planPublish()` is a pure function. It takes the build's file list, the server listing, the previous publish record, the protected list, the approvals and the deletion switch, and returns either a plan (upload, remove, report) or the first failed check. It never touches the network, so every guard is unit-tested.
>
> — `sad.md §4, choice 2, abridged` · full text: [sad.md](../sad.md)

> | Ownership | A server file is owned (in the publish record), approved (in `approved-removals.txt`), protected (in `protected.txt`) or unknown. Only owned or approved files missing from the build are removed. Protected and unknown files are never changed. |
>
> — `sad.md §8, Ownership, verbatim` · full text: [sad.md](../sad.md)

> PJ->>PJ: Checks idempotency by planning from the record, so a re-run of the same commit adds no new change
> PJ->>PJ: Plans upload only with zero removals
> PJ->>PJ: Sorts every folder file the build lacks into protected, approved or unknown
>
> — `sad.md §6, Flow 5 steps 7–9, verbatim` · full text: [sad.md](../sad.md)

> **Hard rule:** the planner is pure — no file system, network or clock; the caller passes everything in.
>
> — `adr/0002, Decision outcome, abridged` · full text: [ADR-0002](../adr/0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor.md)

**Fallback:** insufficient or contradicted by the code → read [data-model.md](../data-model.md) · [sad.md](../sad.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes. Classification order: `protected` first, then `owned`, then `approved`, else `unknown`.

| `ownership` | `inBuild` | Deletion off | Deletion on |
|---|---|---|---|
| protected | yes | stop: `protected-clash` (AC-11b, **T10**) | stop: `protected-clash` (**T10**) |
| protected | no | leave unchanged | leave unchanged (AC-11) |
| owned / approved | yes | overwrite with the build file | overwrite with the build file |
| owned / approved | no | list for review, keep | remove (AC-10, AC-01) |
| unknown | no | list for review, keep | keep, report (AC-13) |
| unknown | yes | overwrite; it becomes owned; report a `warning` | same |

`REPORT_ENTRY.kind`: `uploaded`, `removed`, `unknown`, `protected`, `approved-pending`, `owned-pending`, `warning`. `*-pending` = would be removed with deletion on. Unknown entries keep the raw name and may carry `malformed: true`.

— `data-model.md §SERVER_FILE, §REPORT_ENTRY, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. `planPublish(input) → { ok: true, plan: { upload, remove, entries } } | { ok: false, failedCheck, entries }`.

## Acceptance criteria

### AC-01 — happy path

> **Given** deletion has been switched on and the maintainer has approved the starter files for removal
> **When** the maintainer publishes
> **Then** no starter page, image or file remains reachable on the live site, and the maintainer sees the list of what was removed
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-07 — happy path

> **Given** deletion has not yet been switched on
> **When** the maintainer publishes
> **Then** the build is uploaded, nothing on the server is deleted, and the maintainers receive, through a maintainer-only route, a listing of every server-folder file the build does not contain, to mark each as protected or approve it for removal
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

### AC-07b — happy path

> **Given** deletion is switched on
> **When** a maintainer switches it off and publishes
> **Then** the publish behaves as in AC-07: the build is uploaded, nothing is deleted and the listing is produced
>
> — `spec.md §5, AC-07b, verbatim` · full text: [spec.md](../spec.md)

### AC-10 — happy path

> **Given** deletion is switched on
> **When** the maintainer removes a page from the repository and publishes
> **Then** the page disappears from the live site (visitors following its address get the not-found page) and appears in the maintainer's list of removed files
>
> — `spec.md §5, AC-10, verbatim` · full text: [spec.md](../spec.md)

### AC-11 — domain invariant: a publish never removes a protected file

> **Given** a protected file is in the server folder
> **When** any publish runs
> **Then** the file is left unchanged
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)

### AC-13 — cross-context

> **Given** a file appears in the server folder that the site never published and the maintainer never reviewed, such as one added by KTH IT
> **When** the maintainer publishes
> **Then** the file is left in place, the publish goes ahead, and the file is reported to the maintainers for a keep-or-remove decision — on every publish until it is marked protected or approved for removal
>
> — `spec.md §5, AC-13, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `classify()` per the table above, protected first — `deploy/plan.ts`
- [ ] `planPublish()` happy paths for deletion off and on; `remove` is empty whenever deletion is off — `deploy/plan.ts`
- [ ] Return the first failed check slot (wired, but the guards themselves are T10) — `deploy/plan.ts`
- [ ] Unit tests: one per table row, deletion off vs on, a re-run of the same inputs gives the same plan, a protected file also named by a stale record is never removed — `tests/plan.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| First publish, no record, deletion off | plan uploads, every non-build server file listed as `unknown` |
| A protected file also in the previous record | stays protected; never removed |
| Unknown file with a newline in its name | reported `malformed: true`, never acted on, publish not blocked |
| Unknown file at a build path | overwritten; reported `uploaded` + `warning` (decided 2026-10-04) |

## Definition of Done

- [ ] `tests/plan.test.ts` covers every row of the ownership table for deletion off and on
- [ ] `planPublish()` stays pure (no `node:fs`, `node:child_process` or `Date` imports in `plan.ts`)
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
