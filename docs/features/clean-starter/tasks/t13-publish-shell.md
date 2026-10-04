---
id: T13
title: "Write the publish shell: list, plan, report, stage, swap, verify over SSH"
layer: "app"
deps: ["T1", "T10", "T11", "T12"]
blocks: ["T14"]
acs: ["AC-01", "AC-04", "AC-10", "AC-13"]
files_hint: ["deploy/publish.ts", "deploy/ssh.ts", "tests/publish.test.ts"]
owner: "pasichnyi"
estimate: "1d"   # the largest task; still one session
context_budget: "M"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T13 — Write the publish shell: list, plan, report, stage, swap, verify over SSH

## Place in the sequence

- **Blocked by:** T1 (`missingPlannedPages()`), T10 (complete planner), T11 (`swap.sh`), T12 (report) · **Blocks:** T14 (workflow wiring) · **Wave:** 4, where the worker branch and the navigation helper join.
- **Lane:** own lane.

## Why (user story)

> **As a** maintainer
> **I want** each publish to remove from the live site whatever I removed from the repository
> **So that** the live site stays accurate without manual server work
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task wires the pure planner to the real server in the order the SAD fixes, so nothing changes on the server until the plan is accepted and the report encrypted.

## Inlined context

> PJ->>R: Reads protected list, approved removals and deletion switch
> PJ->>S: Lists the server folder and reads the previous publish record
> PJ->>PJ: Plans from build files, listing, record and rules
> alt A check fails before any change → PJ->>RP: Writes the failed check and the listing, encrypted → PJ-->>GH: Fails the run, server untouched
> else Plan accepted → PJ->>RP: Encrypts the planned report to the maintainer keys before any upload (no key or a failed encryption stops the run here, server untouched) → PJ->>S: Uploads the build archive into the staging folder → PJ->>S: Runs the swap script → PJ->>S: Checks front page, logo, every removed and every reviewed starter address over HTTPS → PJ->>RP: Completes the report … → alt Post-publish check fails → Fails the run, no rollback, next publish repairs; else → Public summary with counts only
>
> — `sad.md §6, Critical flow 1, abridged` · full text: [sad.md](../sad.md)

> PJ->>PJ: Compares the planned entries with the built pages
> PJ-->>M: Publish summary warns which navigation entry points to a missing page
> PJ->>SF: Publishes as in Flow 1 or Flow 5, the warning does not stop it
>
> — `sad.md §6, Flow 3 steps 6–8, verbatim` · full text: [sad.md](../sad.md)

> The executor only applies an accepted plan, using OpenSSH tools already on the runner, with no new npm package and no third-party deploy action.
>
> — `sad.md §4, choice 2, abridged` · full text: [sad.md](../sad.md)

> | Merge-to-live time | ≤ 10 min | CI run duration from merge to publish complete |
>
> — `spec.md §6, NFR row, verbatim` · full text: [spec.md](../spec.md)

> **Hard rules:** never interpolate a server-side name into a command (sad §8); the listing is NUL-separated (`find . -print0`); the record and staging folder are never classified; retry 0 times automatically (sad §6 Flow 5).
>
> — `sad.md §6 + §8, abridged` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read [sad.md](../sad.md) · [data-model.md](../data-model.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes. Builds `PUBLISH_RECORD` for this publish (`version: 1`, `commit` = `GITHUB_SHA`, `publishedAt`, every uploaded path with its SHA-256) and ships it in the staging archive for `swap.sh` to move into place last. Reads the previous record over SSH.

— `data-model.md §PUBLISH_RECORD, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Inputs: env `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_TARGET_DIR`, `SITE_URL`, `GITHUB_SHA`; the reviewed starter addresses from `deploy/rules/approved-removals.txt`. Outputs: exit code, `$GITHUB_STEP_SUMMARY` (public summary), `publish-report.gpg` file for the artifact upload.

## Acceptance criteria

### AC-01 — happy path

> **Given** deletion has been switched on and the maintainer has approved the starter files for removal
> **When** the maintainer publishes
> **Then** no starter page, image or file remains reachable on the live site, and the maintainer sees the list of what was removed
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-04 — error

> **Given** a planned section's navigation entry points to a page the build does not contain (not yet written, or a mistyped address)
> **When** the maintainer publishes
> **Then** visitors are not offered that entry, the publish goes ahead, and the maintainer is told which navigation entry points to a missing page
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)

### AC-10 — happy path

> **Given** deletion is switched on
> **When** the maintainer removes a page from the repository and publishes
> **Then** the page disappears from the live site (visitors following its address get the not-found page) and appears in the maintainer's list of removed files
>
> — `spec.md §5, AC-10, verbatim` · full text: [spec.md](../spec.md)

### AC-13 — cross-context

> **Given** a file appears in the server folder that the site never published and the maintainer never reviewed, such as one added by KTH IT
> **When** the maintainer publishes
> **Then** the file is left in place, the publish goes ahead, and the file is reported to the maintainers for a keep-or-remove decision — on every publish until it is marked protected or approved for removal
>
> — `spec.md §5, AC-13, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `ssh.ts`: `run(argv, stdin)` and `upload(localFile, remotePath)` over `ssh`/`scp` with a temp key file and `StrictHostKeyChecking=accept-new`; arguments passed as argv, never a shell string — `deploy/ssh.ts`
- [ ] `publish.ts` steps in Flow 1 order: hash `dist/`, read rules, wipe staging, list (`find -print0`), read record, `planPublish()`, nav warning via `missingPlannedPages()` (public: navigation entries are public names), encrypt report, tar + upload, run `swap.sh`, verify over HTTPS, finish report and summary — `deploy/publish.ts`
- [ ] Post-publish check: front page and logo return 200; every removed address and every reviewed starter address return 404 — `deploy/publish.ts`
- [ ] Executor seam: `publish.ts` takes an executor so tests can run it against a local temp folder with no SSH — `deploy/publish.ts`
- [ ] Integration test: full run against a temp folder via the local executor, deletion off then on, with unknown and protected files and one planned section missing — `tests/publish.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Planner returns a failed check | encrypted report written, run fails, server untouched (no upload, no swap) |
| Encryption fails | run fails naming only the check, before any upload |
| Post-publish check fails | run fails; no rollback; next publish repairs from the record |
| Navigation entry with no page in `dist/` | public warning naming the entry; publish continues (AC-04) |
| Unknown file present | left in place, in the encrypted report every publish (AC-13) |

## Definition of Done

- [ ] `tests/publish.test.ts` passes end to end through the local executor
- [ ] a failed check provably makes no server-side change (executor records zero mutating calls)
- [ ] no new dependency; no command string contains a server-side name
- [ ] `npm run lint && npm test` clean
