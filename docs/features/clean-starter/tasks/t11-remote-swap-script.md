---
id: T11
title: "Write the remote swap script and its integration test against a temp folder"
layer: "infra"
deps: ["T8"]
blocks: ["T13"]
acs: ["AC-10", "AC-11"]
files_hint: ["deploy/remote/swap.sh", "tests/swap.test.ts"]
owner: "pasichnyi"
estimate: "M"
context_budget: "M"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T11 — Write the remote swap script and its integration test against a temp folder

## Place in the sequence

- **Blocked by:** T8 (record format) · **Blocks:** T13 (publish shell runs it) · **Wave:** 2, parallel to T9 and T12.
- **Lane:** own lane.

## Why (user story)

> **As a** maintainer
> **I want** each publish to remove from the live site whatever I removed from the repository
> **So that** the live site stays accurate without manual server work
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task applies an accepted plan on the server: rename the staged build into place, remove only the listed files, write the record last.

## Inlined context

> **Chosen:** option 1. … Upload one archive into a hidden staging folder inside the target folder (`.publish-staging/`), unpack it there, then run one remote script that renames files into place (content-hashed assets first, then pages), applies removals, and writes the publish record last. … Protected files are never moved or copied.
>
> — `adr/0003, Considered option 1 + Decision outcome, abridged` · full text: [ADR-0003](../adr/0003-stage-the-build-on-the-server-then-rename-it-into-place.md)

> **Interruption semantics.** An interruption before the rename step (during upload or unpack) leaves the previous version fully served. The staging folder is wiped at the start of the next publish. … removals run last and old content-hashed assets stay until then.
>
> — `adr/0003, Decision outcome, abridged` · full text: [ADR-0003](../adr/0003-stage-the-build-on-the-server-then-rename-it-into-place.md)

> | Remote command safety | `swap.sh` reads its rename and removal lists as NUL-separated input and never builds a shell command from a file name. The executor never interpolates server-side names into commands. |
>
> — `sad.md §8, verbatim` · full text: [sad.md](../sad.md)

> `tests/swap.test.ts` runs `swap.sh` against a temp folder seeded with protected and unknown files, then asserts their bytes and timestamps are unchanged. … kills the swap before the rename step and asserts that the temp folder still holds the previous version byte for byte.
>
> — `sad.md §10, QG-1 + QG-4 How verify, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** POSIX `sh` only; the server is assumed to have `find`, `tar`, `mv` (only `tar` is evidenced). Swap duration (first rename to record written) is logged; target ≤ 5 s.
>
> — `sad.md §2 + §7 Monitoring + §11 risk 1, abridged` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read [sad.md](../sad.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes. Writes `PUBLISH_RECORD` (`.publish-record.json`) as the last step, via write-to-temp-then-rename, so an interruption leaves the previous record intact. The record content is produced by the runner (T13) and shipped inside the staging folder; `swap.sh` only moves it into place.

— `data-model.md §PUBLISH_RECORD, Invariants, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Invocation: `sh swap.sh <target-dir>` with NUL-separated stdin sections: rename list (assets first, then pages), then removal list. Prints `swap-seconds=<n>` on success; non-zero exit names the failing step.

## Acceptance criteria

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

## Checklist

- [ ] `command -v find tar mv` preflight; exit with `remote-tools-missing` if absent — `deploy/remote/swap.sh`
- [ ] Read NUL-separated lists; `mkdir -p` parents; `mv -f` each staged file into place; remove listed files; move the record into place last; remove now-empty directories that only held removed files; wipe staging — `deploy/remote/swap.sh`
- [ ] Integration test in a temp dir: protected and unknown files keep bytes and mtime; listed removals are gone; record written last; names with spaces, leading `-` and newlines are handled — `tests/swap.test.ts`
- [ ] Interruption test: kill before the rename step → previous version byte for byte — `tests/swap.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| A removal path no longer exists | skipped, no error |
| A file name starting with `-` | handled (`--` or `./` prefix), never parsed as an option |
| Staging left over from a crashed publish | wiped at the start of the next publish (by T13 before upload) |
| Interruption inside the rename step | accepted debt: mixed pages, next publish repairs (sad §11) |

## Definition of Done

- [ ] `tests/swap.test.ts` passes on the runner and locally (macOS and Linux `sh`)
- [ ] no command in `swap.sh` is built from a file name
- [ ] `npm run lint && npm test` clean
