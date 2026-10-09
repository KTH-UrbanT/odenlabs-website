---
status: Accepted
owner: "pasichnyi"
reviewers: []
updated_at: "2026-10-04"
feature_size: "n/a (foundation)"
ticket: "roadmap D6"
---

# 0001 — Build the site with Astro as a fully static site

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi, with Claude during `survey`

## Context

The first attempt used the HugoBlox (Wowchemy) research-group starter on Hugo and stalled at an unmodified install; tooling friction was one of the named reasons (idea-brief §2). The starter is being removed entirely, so the generator is open again (roadmap D6). The site must be static: it is copied over SSH to a KTH server that only serves files.

## Decision drivers

- Single maintainer: low upkeep, few dependencies (idea-brief §6).
- The site is organised around research themes that pull in people, projects and publications, so one edit updates several pages (idea-brief §7).
- The existing logo and theme are restyled (roadmap D5), so styling must be easy to own.
- Static output deployable by file copy (`.github/workflows/publish.yaml`).

## Considered options

1. **Astro** — static output by default, typed content collections with cross-references, plain HTML/CSS components.
2. **Hugo with an own small theme** — single binary and fastest builds, but Go templates are clunkier and cross-linking content needs more template code.
3. **Hugo with HugoBlox** — publications import and people pages built in, but heavy, pinned to old module snapshots, and hard to restyle; the stack that stalled before.
4. **Eleventy** — minimal and flexible, but fewer conventions, so more structure decisions to make and keep.

## Decision outcome

**Chosen:** Astro. Content collections with `reference()` give the theme → people/projects spine with build-time validation, and `.astro` components with scoped CSS make the restyle straightforward, while output stays plain static files for the existing deploy.

## Consequences

**Positive**
- Broken content (missing field, dangling theme reference) fails the build instead of shipping.
- Zero client-side JavaScript by default; fast pages on a plain file server.
- Large ecosystem and good documentation, so AI-assisted edits are reliable.

**Negative**
- Needs Node and an npm dependency tree, unlike Hugo's single binary; dependency updates are a recurring chore.
- Astro major versions arrive roughly yearly and can need small migrations.

**Neutral**
- Moving to another generator later means rewriting templates; content files (Markdown/YAML) carry over largely as-is.

## Links

- Roadmap: [[../roadmap.md]] D6
- Architecture map: [[../architecture-map.md]] §Stack
- Related ADR: [[0002-keep-content-as-typed-files-in-git]], [[0003-style-with-plain-css-custom-properties]]
