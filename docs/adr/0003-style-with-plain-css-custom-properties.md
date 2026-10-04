---
status: Accepted
owner: "pasichnyi"
reviewers: []
updated_at: "2026-10-04"
feature_size: "n/a (foundation)"
ticket: "roadmap D5"
---

# 0003 — Style with plain CSS custom properties from one tokens file, no Tailwind

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi, with Claude during `survey`

## Context

The existing logo (navy `#004790`, grey `#666`) and blue/cyan theme are restyled, not replaced (roadmap D5). The site is small (around six page types) and has one maintainer, and the look is expected to change as it is restyled.

## Decision drivers

- Restyling must be cheap: change colours, type and spacing in one place.
- Few dependencies to maintain (single maintainer; tooling friction stalled the first attempt).
- Markup should stay readable when edited by hand.

## Considered options

1. **Plain CSS custom properties** — tokens in `src/styles/tokens.css`, scoped `<style>` in components that use only tokens.
2. **Tailwind CSS** — utility classes in markup; consistent scales and fast per-element changes, but global restyles mean editing many class strings, and it adds a dependency and config.

## Decision outcome

**Chosen:** plain CSS custom properties. A restyle is an edit to one tokens file, with no extra build dependency. Tailwind's benefits pay off on larger, multi-author UI codebases, and Astro can add it later with one command if that changes.

## Consequences

**Positive**
- One file controls the look; restyle is fast and low-risk.
- No styling dependency; markup stays clean.

**Negative**
- No built-in design scale; consistency depends on the convention "components use tokens, never raw values".
- More hand-written CSS than with utilities.

**Neutral**
- Switching to Tailwind later is possible; the tokens map onto a Tailwind theme.

## Links

- Roadmap: [[../roadmap.md]] D5, step 1
- Architecture map: [[../architecture-map.md]] §Frontend / UI foundation
- Related ADR: [[0001-build-the-site-with-astro-as-a-static-site]]
