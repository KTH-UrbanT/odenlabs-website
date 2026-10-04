---
status: Accepted
owner: "pasichnyi"
reviewers: []
updated_at: "2026-10-04"
feature_size: "n/a (foundation)"
ticket: "roadmap D6"
---

# 0002 — Keep all content as typed Markdown/YAML files in git, identified by file name

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi, with Claude during `survey`

## Context

The site needs research themes, people and projects that link to each other, plus imported publications later. Somewhere has to hold that content, and the choice decides how edits happen, how links are checked, and what the deploy depends on.

## Decision drivers

- One maintainer, no accounts or login-based editing (idea-brief §5).
- A real update must take minutes (idea-brief §7).
- Static hosting at KTH: nothing runs at request time.
- Links between themes, people and projects must not silently break.

## Considered options

1. **Typed files in git** — Astro content collections (Markdown/YAML) with Zod schemas and `reference()` links; file name is the ID.
2. **Headless CMS** (hosted or git-based like Decap) — editing UI, but adds an account, a service or an admin app to secure and maintain.
3. **Database** — needs a server-side runtime the static host does not have; ruled out by the hosting constraint, listed for completeness.

## Decision outcome

**Chosen:** typed files in git. It matches the single-maintainer, no-accounts scope, keeps the full history in git, and the schema check turns broken links into build errors.

## Consequences

**Positive**
- No database, no CMS service, no migrations; backup is the git repo.
- `astro check` / `astro build` validate every entry and every cross-reference.

**Negative**
- Editing means changing files and pushing; members can't edit their own profiles (accepted, idea-brief §5).
- Renaming a file changes its ID and URL, so every reference to it must be updated (the build reports each one).

**Neutral**
- Publications (step 7) will be generated into a data file by a script or CI job; the source is still open (roadmap D2).

## Links

- Roadmap: [[../roadmap.md]] steps 3, 5, 6, 7
- Architecture map: [[../architecture-map.md]] §Datastores
- Related ADR: [[0001-build-the-site-with-astro-as-a-static-site]]
