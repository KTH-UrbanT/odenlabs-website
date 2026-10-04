---
id: T15
title: "Document the publishing rules and rollout, and confirm the repository is free of starter files"
layer: "docs"
deps: ["T14"]
blocks: []
acs: ["AC-08", "AC-14"]
files_hint: ["deploy/README.md", "README.md"]
owner: "pasichnyi"
estimate: "S"
context_budget: "M"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T15 — Document the publishing rules and rollout, and confirm the repository is free of starter files

## Place in the sequence

- **Blocked by:** T14 (workflow wiring) · **Blocks:** none · **Wave:** 6, last, because it documents what exists.
- **Lane:** own lane.

## Why (user story)

> **As a** maintainer
> **I want** the repository to carry no starter files or template notices
> **So that** it represents only the group's own work
>
> — `spec.md §4, US-07, verbatim` · full text: [spec.md](../spec.md)

This task leaves the maintainer a runbook for the guarded rollout and confirms the repository part of the cleanup.

## Inlined context

> **Rollout order** (deletion stays off until the last step):
> 1. Repository settings: protect `main`, add `CODEOWNERS`, move the SSH secrets into the `kth-server` environment restricted to `main`, and add the maintainer's public key (ADR-0005, ADR-0004).
> 2. Probe publish with deletion off. It confirms `find`/`tar`/`mv` exist on the server, writes the first record and delivers the first listing (AC-07).
> 3. The maintainer marks protected files and approves the starter files in one reviewed change.
> 4. A reviewed change sets `deletion: "on"`. The next publish is the first starter cleanup (AC-01). It needs the exact approved list, since it exceeds the 20-file routine limit.
>
> — `sad.md §7, Rollout order, verbatim` · full text: [sad.md](../sad.md)

> | Repository settings drift … | Medium | The deploy job declares `environment: kth-server`, so missing secrets fail loudly. Re-check the three settings as part of every change that sets `deletion: "on"`. |
> | The maintainer loses their GPG private key … | Medium | Keep an offline backup of the key. … Deletion stays off while no maintainer can read the report. |
>
> — `sad.md §11, two risk rows, abridged` · full text: [sad.md](../sad.md)

> - [ ] Who besides the maintainer writes to the server folder (KTH IT, certificate renewal, verification files)? … — owner: pasichnyi, due: before deletion is switched on
>
> — `spec.md §8, open question 2, abridged` · full text: [spec.md](../spec.md)

State today: no `LICENSE*` file exists; a repo-wide search outside `docs/` finds no HugoBlox / template references; `README.md` already describes the Astro site. The architecture map still lists the starter deletion as pending (sad §11), so recommend a `/sdd:survey` re-run.

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) in full and follow them. Do not guess.

## Data delta

No DB changes. Documents the rules-file grammar from `data-model.md §PROTECTED_ENTRY` (one path per line, `#` comments, no globs) and how to read the report (`gpg -d`).

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-08 — authorization

> **Given** a person who is not a maintainer, such as a group member or an outside contributor
> **When** they propose a change to the protected-file list, the removal approvals or the deletion switch
> **Then** nothing on the live site changes until a maintainer accepts the change, because only maintainers may decide what is removed from a shared university server
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)

### AC-14 — happy path

> **Given** this feature is complete
> **When** anyone looks through the repository's current files
> **Then** no starter files or template notices remain and there is no licence file; documents that recount the project's history may still name the old template
>
> — `spec.md §5, AC-14, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Runbook: the four rollout steps with the exact GitHub settings to change (branch protection, `kth-server` environment restricted to `main`, secrets moved, CODEOWNERS review required), how to read the report, how to mark files, how to switch deletion on/off — `deploy/README.md`
- [ ] Add a short "Publishing" section linking the runbook — `README.md`
- [ ] Sweep: search tracked files outside `docs/` for template names, licence files and starter paths listed in `architecture-map.md` §Constraints; record the result in the PR

## Edge cases

| Case | Behaviour |
|---|---|
| A starter remnant is found | remove it in this task |
| `docs/` names the old template | allowed: history documents (AC-14) |
| Repository settings cannot be changed by the agent | listed as maintainer actions in the runbook, not faked |

## Definition of Done

- [ ] `deploy/README.md` covers all four rollout steps and the deletion off/on switch
- [ ] the sweep finds no starter files, template notices or licence file outside `docs/`
- [ ] `npm run lint && npm test` clean
