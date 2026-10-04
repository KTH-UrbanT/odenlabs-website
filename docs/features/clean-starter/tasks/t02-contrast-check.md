---
id: T2
title: "Add the WCAG contrast check over the declared text/background pairs"
layer: "domain"
deps: []
blocks: ["T6"]
acs: ["AC-06"]
files_hint: ["src/lib/contrast.ts", "src/styles/contrast-pairs.ts", "tests/contrast.test.ts"]
owner: "pasichnyi"
estimate: "S"
context_budget: "S"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T2 — Add the WCAG contrast check over the declared text/background pairs

## Place in the sequence

- **Blocked by:** none · **Blocks:** T6 (identity palette, which must pass this check) · **Wave:** 1, pure and independent.
- **Lane:** shares `src/styles/contrast-pairs.ts` with T6, so the two are serialized.

## Why (user story)

> **As a** visitor
> **I want** every page to carry the group's own recognisable, readable look derived from its logo
> **So that** I recognise the group and can read comfortably
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task makes "readable" enforceable: a palette edit that breaks a declared pair fails the check job, so it never publishes.

## Inlined context

> | Text readability | ≥ 4.5:1 contrast for body text; ≥ 3:1 for large text and UI elements (WCAG 2.1 AA) | automated check, in the test suite, of every text/background pairing the site uses, as declared alongside the palette |
>
> — `spec.md §6, Text readability row, verbatim` · full text: [spec.md](../spec.md)

> `tests/contrast.test.ts` resolves every pair in `contrast-pairs.ts` against `tokens.css` and fails with the pair's name.
>
> — `sad.md §10, QG-3 How verify, abridged` · full text: [sad.md](../sad.md)

> CJ->>CJ: Computes each pair's contrast against its minimum, 4.5 to 1 for body text and 3 to 1 for large text and UI
> alt A pair falls below its minimum → CJ-->>GH: Fails the check, naming the failing pair and its ratio … the publish job never starts and the live site keeps its previous look
>
> — `sad.md §6, Flow 4 steps 5–7, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** Styling uses tokens only … never write raw colours outside [`tokens.css`].
>
> — `CLAUDE.md, Conventions, abridged` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) in full and follow them. Do not guess.

## Data delta

No DB changes. File entities:

| Entity · field | Type | Constraints | Change |
|---|---|---|---|
| `CONTRAST_PAIR.name` | `string` | unique | added, named in the failure message |
| `CONTRAST_PAIR.text` / `.background` | token name | must resolve in `tokens.css` | added |
| `CONTRAST_PAIR.size` | `"body" \| "large" \| "ui"` | required | added; body 4.5:1, large and ui 3:1 |
| `COLOUR_TOKEN.value` | `string` | hex, or `var(--color-*)` resolving to one | read-only; aliases chain today (`--color-text-muted: var(--color-brand-muted)`), so resolve `var()` recursively and fail on a cycle or missing target |

— `data-model.md §CONTRAST_PAIR, §COLOUR_TOKEN, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Exports: `contrastRatio(hexA, hexB)`, `resolveTokens(css)` → `Map<name, hex>`, `checkPairs(pairs, tokens)` → list of failures `{ name, ratio, minimum }`.

## Acceptance criteria

### AC-06 — domain invariant: all text is readable

> **Given** a maintainer changes a colour in the palette
> **When** the change would make any text and background pairing the site uses (as declared alongside the palette) fall below the readability minimum
> **Then** publishing is blocked and the maintainer is told which pair fails the "all text is readable" rule
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] WCAG 2.1 relative luminance and contrast ratio, plus hex parsing (`#rgb`, `#rrggbb`) — `src/lib/contrast.ts`
- [ ] `resolveTokens()` parses the `:root` custom properties of `tokens.css` and resolves `var()` chains — `src/lib/contrast.ts`
- [ ] Declare the pairs the site uses **today**: `--color-text`/`--color-bg` (body), `--color-text-muted`/`--color-bg` (body), `--color-link`/`--color-bg` (body), `--color-link-hover`/`--color-bg` (body), `--color-text`/`--color-surface` (body) — `src/styles/contrast-pairs.ts`
- [ ] Unit tests: known ratios (black/white = 21), threshold boundaries (4.49 fails body, 3.0 passes large), alias resolution, cycle, missing token — `tests/contrast.test.ts`
- [ ] Integration test: every declared pair against the real `tokens.css`, failure message names pair, ratio and minimum — `tests/contrast.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Pair names a token that does not exist | test fails naming the pair and the token |
| `var()` cycle | test fails naming the cycle |
| Today's tokens fail a pair | not expected: by hand every pair listed above is ≥ 4.5:1. If one fails, stop and raise it. Never loosen a minimum to go green |
| Colour with alpha or a non-hex value | unsupported: test fails naming the token (no silent pass) |

## Definition of Done

- [ ] `tests/contrast.test.ts` passes on the unit cases and fails on a deliberately broken fixture pair, naming it
- [ ] the first run's result on today's tokens is noted in the PR description (spec §7 baseline)
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
