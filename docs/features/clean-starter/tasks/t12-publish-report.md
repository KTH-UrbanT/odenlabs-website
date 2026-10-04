---
id: T12
title: "Build the publish report: public counts summary and the GPG-encrypted full report"
layer: "infra"
deps: ["T8"]
blocks: ["T13"]
acs: ["AC-07", "AC-09"]
files_hint: ["deploy/report.ts", "deploy/maintainers/", "tests/report.test.ts"]
owner: "pasichnyi"
estimate: "M"
context_budget: "M"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T12 — Build the publish report: public counts summary and the GPG-encrypted full report

## Place in the sequence

- **Blocked by:** T8 (report entry types) · **Blocks:** T13 (publish shell) · **Wave:** 2, parallel to T9 and T11.
- **Lane:** own lane.

## Why (user story)

> **As a** maintainer
> **I want** to see what is in the server folder and mark protected files before any publish deletes anything
> **So that** nothing others rely on is lost
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task is the maintainer-only route: the listing reaches maintainers and nobody else.

## Inlined context

> **What is public and what is private.** The public log and job summary carry counts, check names, and file names that are already public: build paths, protected-list entries and navigation entries. Anything that names a server file the site did not publish goes into the encrypted report only. If there is no maintainer key, or encryption fails, the publish stops before uploading, so a listing never leaks in the clear.
>
> — `adr/0004, Decision outcome, verbatim` · full text: [ADR-0004](../adr/0004-deliver-the-publish-report-as-a-gpg-encrypted-artifact.md)

> GPG is preinstalled on GitHub's Ubuntu runners, so this needs no new service, secret or package. … Adding or removing a maintainer is a reviewed change to `deploy/maintainers/`.
>
> — `adr/0004, Decision outcome, abridged` · full text: [ADR-0004](../adr/0004-deliver-the-publish-report-as-a-gpg-encrypted-artifact.md)

> PJ->>RP: Encrypts the report to every maintainer's public key … PJ->>GH: Writes the public log and summary with counts and check names only … O->>O: Cannot decrypt it without a maintainer's private key
>
> — `sad.md §6, Flow 7, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** the public summary carries only counts (uploaded, removed, unknown, warnings) and the failed check name.
>
> — `sad.md §7 Monitoring, Job summary, abridged` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read [data-model.md](../data-model.md) · [sad.md](../sad.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes.

| Entity · field | Type | Notes |
|---|---|---|
| `PUBLISH_REPORT.commit` / `startedAt` / `deletion` | `string` / ISO 8601 / `"on" \| "off"` | |
| `.outcome` | `"published" \| "stopped" \| "post-check-failed"` | |
| `.failedCheck` | closed `FailedCheck` set or `null` | public by name |
| `.entries` | `ReportEntry[]` | private: encrypted only |
| `.swapSeconds` | `number \| null` | |
| `MAINTAINER_KEY` | `deploy/maintainers/<id>.asc`, `id` kebab-case; `fingerprint` read at load | ≥ 1 usable key, else stop `no-maintainer-key` |

— `data-model.md §PUBLISH_REPORT, §MAINTAINER_KEY, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Exports: `publicSummary(report)` → Markdown with counts and check name only; `encryptReport(report, keysDir, outFile)` → throws `no-maintainer-key` / `encryption-failed`. Uses the runner's `gpg` via `execFile` with a temporary `GNUPGHOME`, `--trust-model always`, one `--recipient` per key fingerprint.

## Acceptance criteria

### AC-07 — happy path

> **Given** deletion has not yet been switched on
> **When** the maintainer publishes
> **Then** the build is uploaded, nothing on the server is deleted, and the maintainers receive, through a maintainer-only route, a listing of every server-folder file the build does not contain, to mark each as protected or approve it for removal
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

### AC-09 — authorization

> **Given** a server-folder listing has been produced
> **When** a visitor or another non-maintainer looks at the project's public pages, records and publish logs
> **Then** they cannot see the listing; only maintainers can, because it reveals the layout of a shared university server
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `publicSummary()` and the readable full-report format (grouped by `kind`, protected/approved/unknown sections for the review) — `deploy/report.ts`
- [ ] `encryptReport()` with an isolated keyring; fail closed — `deploy/report.ts`
- [ ] Add the maintainer's public key, or a `README` noting it must be added before the first publish (rollout step 1) — `deploy/maintainers/`
- [ ] Tests: summary contains no entry path (assert with an unknown-file fixture name); round-trip encrypt/decrypt with a throwaway key `Test Maintainer <maintainer@example.test>`; no keys → `no-maintainer-key`; `gpg` failure → `encryption-failed` — `tests/report.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| No `.asc` in `deploy/maintainers/` | stop `no-maintainer-key` before any upload |
| An expired or unusable key among several | stop `encryption-failed`; never encrypt to a subset silently |
| Unknown file name with control characters | appears only inside the encrypted report, escaped |
| `gpg` not on the machine running tests | test is skipped with a named reason locally; it must run in CI |

## Definition of Done

- [ ] `tests/report.test.ts` passes in CI, including the round-trip and the "summary leaks no path" case
- [ ] no new dependency in `package.json`
- [ ] `npm run lint && npm test` clean
