---
id: T14
title: "Wire the deploy job to the publish worker in the main-only environment and add CODEOWNERS"
layer: "wiring"
deps: ["T13"]
blocks: ["T15"]
acs: ["AC-08", "AC-09"]
files_hint: [".github/workflows/publish.yaml", ".github/CODEOWNERS"]
owner: "pasichnyi"
estimate: "S"
context_budget: "M"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T14 — Wire the deploy job to the publish worker in the main-only environment and add CODEOWNERS

## Place in the sequence

- **Blocked by:** T13 (publish shell) · **Blocks:** T15 (rollout runbook) · **Wave:** 5.
- **Lane:** own lane.

## Why (user story)

> **As a** maintainer
> **I want** to see what is in the server folder and mark protected files before any publish deletes anything
> **So that** nothing others rely on is lost
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task closes the path from an unreviewed change to the server key and replaces the upload-only `scp-action`.

## Inlined context

> A **deploy** job (`main` only, via a push or a manual run; `needs: check`; environment `kth-server`; the existing `deploy-kth` concurrency group with no cancellation, so two publishes never overlap) runs `node deploy/publish.ts`. It replaces `appleboy/scp-action`. **The workflow-level concurrency rule must change too.** Today it sets `cancel-in-progress: true` for every ref, so a second merge cancels a running publish, possibly mid-swap. It becomes `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`, which still cancels superseded pull-request checks but never a publish.
>
> — `sad.md §7, verbatim` · full text: [sad.md](../sad.md)

> **Chosen:** option 1. Limiting the environment to `main` closes the branch-PR path to the key regardless of who has write access … PR checks still run the planner against fixtures with no server access.
>
> — `adr/0005, Decision outcome, abridged` · full text: [ADR-0005](../adr/0005-gate-publishing-rules-by-review-and-main-only-server-secrets.md)

> ├── workflows/publish.yaml             # check job (all PRs + main); deploy job (main, environment kth-server)
> └── CODEOWNERS                         # maintainers own deploy/ and .github/ (ADR-0005)
>
> — `sad.md §5, internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> | Logging and disclosure | The public Actions log and job summary carry counts, check names and names that are already public … Any name of a server file the site did not publish goes **only** into the encrypted report. |
>
> — `sad.md §8, abridged` · full text: [sad.md](../sad.md)

Today the deploy job downloads the `site` artifact and runs `appleboy/scp-action@v0.1.7` with the four `SSH_*` secrets at repository level; the top-level `concurrency` has `cancel-in-progress: true`.

**Fallback:** insufficient or contradicted by the code → read [sad.md](../sad.md) · [adr/](../adr/) in full and follow them. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface. Workflow contract: deploy job env passes the four `SSH_*` secrets plus `SITE_URL` to `node deploy/publish.ts`; uploads `publish-report.gpg` as artifact `publish-report` with `if: always()`.

## Acceptance criteria

### AC-08 — authorization

> **Given** a person who is not a maintainer, such as a group member or an outside contributor
> **When** they propose a change to the protected-file list, the removal approvals or the deletion switch
> **Then** nothing on the live site changes until a maintainer accepts the change, because only maintainers may decide what is removed from a shared university server
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)

### AC-09 — authorization

> **Given** a server-folder listing has been produced
> **When** a visitor or another non-maintainer looks at the project's public pages, records and publish logs
> **Then** they cannot see the listing; only maintainers can, because it reveals the layout of a shared university server
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Top-level concurrency: `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` — `.github/workflows/publish.yaml`
- [ ] Deploy job: `environment: kth-server`; checkout (for `deploy/`), setup-node from `.nvmrc`, download `site` into `dist/`, run `node deploy/publish.ts`; remove the `scp-action` step — `.github/workflows/publish.yaml`
- [ ] Upload `publish-report.gpg` as an artifact with `if: always()`; never `cat` it or echo entries to the log — `.github/workflows/publish.yaml`
- [ ] `CODEOWNERS`: maintainers own `/deploy/` and `/.github/` — `.github/CODEOWNERS`

## Edge cases

| Case | Behaviour |
|---|---|
| A PR run tries to use the secrets | environment refuses them outside `main`; the job fails without reaching the server (Flow 6) |
| Two merges in quick succession | second publish waits (`deploy-kth`, no cancellation) |
| Secrets not yet moved into `kth-server` | deploy fails loudly on missing env (sad §11 mitigation) |

## Definition of Done

- [ ] `publish.yaml` passes `prettier --check`; a PR run shows check only, no deploy
- [ ] grep: no `appleboy/scp-action` left in `.github/`
- [ ] `CODEOWNERS` lists `/deploy/` and `/.github/`
- [ ] `npm run lint && npm test` clean
