---
id: T8
title: "Define the publish model: path normaliser, rules/settings/record parsers and the initial rules files"
layer: "domain"
deps: []
blocks: ["T9", "T11", "T12"]
acs: ["AC-07b", "AC-12"]
files_hint: ["deploy/plan.ts", "deploy/rules/", "tests/plan.test.ts", "tests/fixtures/publish.ts"]
owner: "pasichnyi"
estimate: "M"
context_budget: "M"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T8 — Define the publish model: path normaliser, rules/settings/record parsers and the initial rules files

## Place in the sequence

- **Blocked by:** none · **Blocks:** T9 (planner classification), T11 (swap script writes the record), T12 (report types) · **Wave:** 1, the root of the worker branch, parallel to the site tasks.
- **Lane:** shares `deploy/plan.ts` and `tests/plan.test.ts` with T9 and T10, so they are serialized.

## Why (user story)

> **As a** maintainer
> **I want** to see what is in the server folder and mark protected files before any publish deletes anything
> **So that** nothing others rely on is lost
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task fixes the shapes every later worker task reads, and makes a malformed rules file fail the check job before any publish.

## Inlined context

> **Rule files.** `deploy/rules/protected.txt` (one path per line), `deploy/rules/approved-removals.txt` (one path per line; for a publish above the routine limit it must equal the planned removal set exactly, AC-12) and `deploy/rules/settings.json` (`deletion: "off" | "on"`, `removalLimit: 20`). The planner rejects unknown keys and malformed paths, which fails the check before any publish.
>
> — `adr/0005, Decision outcome, verbatim` · full text: [ADR-0005](../adr/0005-gate-publishing-rules-by-review-and-main-only-server-secrets.md)

> | ID strategy | … Server files are identified by their path relative to the target folder, normalised: no leading `/`, no `..`, no control or newline characters. The planner stops only when a path it would act on (a build, owned, approved or protected path) breaks this. A malformed name on an **unknown** file is reported in the encrypted report and never touched … |
>
> — `sad.md §8, ID strategy, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** No new npm package (ADR-0002); `deploy/` is run as `node deploy/publish.ts` on Node 24, so use erasable TypeScript only (no `enum`, no parameter properties) and `.ts` import extensions.
>
> — `adr/0002, Consequences` + `sad.md §7`, abridged · full text: [ADR-0002](../adr/0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor.md)

**Fallback:** insufficient or contradicted by the code → read [data-model.md](../data-model.md) · [sad.md](../sad.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes. File entities this task defines (types + parsers):

| Entity | Shape | Key constraints |
|---|---|---|
| server path | `string` | relative, `/` separators, no leading `/`, no `.`/`..`/empty segment, no control char; case-sensitive byte compare |
| `PROTECTED_ENTRY` / `APPROVED_REMOVAL` | one path per line | blank lines ignored; `#` line = comment; no globs; duplicate or malformed line → fails check job |
| rules conflict | — | a path in both files → check fails `rules-conflict`, naming the path |
| `PUBLISH_SETTINGS` | `{ deletion: "on" \| "off", removalLimit: 20 }` | both required, `removalLimit` literal 20, unknown keys rejected; starts `"off"` |
| `PUBLISH_RECORD` | `{ version: 1, commit, publishedAt, files: [{ path, sha256 }] }` | commit 40 hex; ISO 8601 UTC; files non-empty, unique, sorted, include `index.html` and `logo.svg`; sha256 64 lowercase hex |
| unreadable record | — | invalid JSON / unknown version / bad field → treated as **no matching record** |
| never classified | — | `.publish-record.json` and `.publish-staging/**` |

— `data-model.md §Shared rule, §PUBLISH_RECORD, §PROTECTED_ENTRY, §APPROVED_REMOVAL, §PUBLISH_SETTINGS, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Exports from `deploy/plan.ts`: `normalisePath()`, `parseRuleList()`, `parseSettings()`, `parseRecord()` (returns the record or `null` for unreadable), and the shared types.

## Acceptance criteria

### AC-07b — happy path

> **Given** deletion is switched on
> **When** a maintainer switches it off and publishes
> **Then** the publish behaves as in AC-07: the build is uploaded, nothing is deleted and the listing is produced
>
> — `spec.md §5, AC-07b, verbatim` · full text: [spec.md](../spec.md)

### AC-12 — error

> **Given** the build is missing the front page or the logo, or the target folder does not contain the previous publish's record together with the front page and logo that record lists, or the publish would remove more files than the routine removal limit without the maintainer having approved that exact list (an approval of a list that differs by even one file does not count)
> **When** the maintainer publishes
> **Then** the publish stops before deleting anything and tells the maintainer which check failed
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

(This task covers the record-validity part of AC-12 and the switch parsing of AC-07b; T9/T10 apply them.)

## Checklist

- [ ] Types and `normalisePath()` — `deploy/plan.ts`
- [ ] `parseRuleList()`, `parseSettings()`, `parseRecord()` — `deploy/plan.ts`
- [ ] Initial rules files: `protected.txt` and `approved-removals.txt` with a `#` header comment only; `settings.json` = `{ "deletion": "off", "removalLimit": 20 }` — `deploy/rules/`
- [ ] Fixture builders `buildFiles`, `publishRecord`, `serverListing`, `rules`, `starterFiles` per data-model §Test fixtures (neutral paths, no PII) — `tests/fixtures/publish.ts`
- [ ] Unit tests for each parser and the normaliser; one test that parses the **real** `deploy/rules/*` so a bad rules PR fails the check job — `tests/plan.test.ts`
- [ ] Confirm `astro check` type-checks `deploy/` (tsconfig includes `**/*`) and `.ts` imports are accepted

## Edge cases

| Case | Behaviour |
|---|---|
| `settings.json` with `"deleteion"` typo | rejected (unknown key) → check job fails |
| `removalLimit: 25` | rejected: the limit is a spec §6 number |
| Path `../etc/x`, `/abs`, `a//b`, `a\nb` | `normalisePath()` returns malformed |
| Record with `version: 2` | `parseRecord()` → `null` (no matching record) |
| Record missing `logo.svg` | parses, but flagged so T10 stops with `record-without-front-page-or-logo` |

## Definition of Done

- [ ] `tests/plan.test.ts` parser and normaliser cases pass; the real rules files parse
- [ ] a deliberately broken `settings.json` makes `npm test` fail with a named error
- [ ] no new dependency in `package.json`
- [ ] `npm run lint && npm test` clean
