---
status: Accepted
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-04"
feature_size: "M"
ticket: "roadmap step 1 + step 8 (starter cleanup) — docs/roadmap.md"
---

# 0002 — Plan each publish with a pure planner and a thin SSH executor

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi (maintainer, architect), with Claude during the design walk

## Context

The current publish (`appleboy/scp-action`) copies `dist/` into the server folder and never
deletes, so every starter page stays reachable. The spec commits to a guarded mirror. A publish
removes only files a previous publish recorded or the maintainer approved (AC-10, AC-01). It
never changes a protected file (AC-11), and it stops on a clash with a protected address
(AC-11b). It stops before deleting when the build lacks the front page or logo, when the folder
lacks the previous record, or when removals exceed the routine limit without an exactly matching
approved list (AC-12). It leaves unknown files in place and reports them (AC-13). Nobody knows
today what lives in the folder (spec §1), so the logic that decides must be proven before it
runs.

## Decision drivers

- Quality goal 1 (sad §1): never delete what we do not own. Routine removal limit ≤ 20 files per
  publish without a maintainer-approved list (spec §6).
- Abuse case "wrong or empty target folder" (spec §6.1): a mirror must not turn into "wipe the
  account".
- Constraint (sad §2): few dependencies, one maintainer, and a repo convention of pure functions
  with Vitest tests.
- Quality goal 4: merge to live ≤ 10 min (spec §6), so planning must be cheap.

## Considered options

1. **A pure planner plus a thin executor.** `planPublish()` is a pure TypeScript function from
   (build files, server listing, previous record, protected list, approvals, deletion switch,
   removal limit) to either a plan or the first failed check. A small executor applies the plan
   with OpenSSH (`ssh`, `scp`) on the runner.
2. **rsync with `--delete` and exclude rules.** The plan comes from parsing a `--dry-run`, and
   protected files are covered by exclude patterns.
3. **A shell script inside the workflow.** `ssh find` lists the folder, `comm` diffs the lists and
   `rm` deletes, all written in `publish.yaml`.

## Decision outcome

**Chosen:** option 1. It is the only option where every guard in AC-11 to AC-13 can be
unit-tested with fake inputs before it ever runs against the shared folder. rsync's model
(delete everything not in the source unless excluded) is the inverse of "delete only what we
own": a file KTH IT adds after the last review would be deleted unless it was already excluded,
which breaks AC-13. rsync also needs to be present on the KTH server, which is unverified.
Option 3 gives up tests entirely.

**Ownership model.** Each publish ends by writing a **publish record**, `.publish-record.json`,
in the target folder. It lists every path the publish uploaded with its SHA-256, plus the commit
and the time. The next publish reads it. A server file is **owned** if the record lists it,
**approved** if `deploy/rules/approved-removals.txt` lists it, **protected** if
`deploy/rules/protected.txt` lists it, and **unknown** otherwise. Only owned or approved files
missing from the build may be removed. Unknown files are never removed and are reported on every
publish. The deletion switch starts off, and the first publish under this engine writes the first
record. With deletion on and no record present, the AC-12 check stops the publish. The record
names only files the site published, which are public anyway.

## Consequences

**Positive**
- Every guard is a tested branch of one function, which also documents the rules for the
  security review.
- No new npm dependency and no third-party deploy action. The supply-chain surface shrinks
  because `appleboy/scp-action` is removed.
- The same planner can later drive a dry run (ADR-0001, neutral consequence).

**Negative**
- We own roughly 300 lines of deploy code (planner, executor, remote swap script) instead of
  reusing a tool.
- The executor depends on POSIX tools on the server (`find`, `tar`, `mv`). Only `tar` is
  evidenced today (sad §11).

**Neutral**
- The record format becomes a contract between successive publishes. Changing it later needs the
  planner to read both versions for one publish.

## Links

- Spec: [[../spec.md]] AC-01, AC-07, AC-10–AC-13, §6, §6.1
- SAD: [[../sad.md]] §4 choice 2, §5, §8
- Related ADR: [[0003-stage-the-build-on-the-server-then-rename-it-into-place]] (how the plan is
  applied), [[0005-gate-publishing-rules-by-review-and-main-only-server-secrets]] (who may change
  the rule files)
