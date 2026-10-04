---
id: T1
title: "Add the ordered planned-sections list and the pure offered-sections helpers"
layer: "domain"
deps: []
blocks: ["T3", "T13"]
acs: ["AC-03", "AC-04"]
files_hint: ["src/data/sections.ts", "src/lib/navigation.ts", "tests/navigation.test.ts"]
owner: "pasichnyi"
estimate: "S"
context_budget: "M"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T1 — Add the ordered planned-sections list and the pure offered-sections helpers

## Place in the sequence

- **Blocked by:** none · **Blocks:** T3 (Header renders only offered sections), T13 (publish shell uses the missing-page check for the AC-04 warning) · **Wave:** 1, a pure helper with no inputs from other tasks.
- **Lane:** own lane.

## Why (user story)

> **As a** visitor
> **I want** the navigation to offer exactly the sections that exist, including new ones as soon as they are published
> **So that** every link I click leads somewhere
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

This task holds the single list of planned sections and the one rule that decides whether a section's page exists, at build time (header) and at publish time (warning).

## Inlined context

> | Navigation | The ordered planned sections live in `src/data/sections.ts`. The header offers the ones whose page exists in `src/pages`, via `offeredSections()`. The publish summary warns about any planned entry whose page is missing from `dist/` (AC-04). |
>
> — `sad.md §8, Navigation row, verbatim` · full text: [sad.md](../sad.md)

> ```
> ├── data/sections.ts                   # ordered planned sections {label, href} — Research, People, Join/Contact
> ├── lib/navigation.ts                  # offeredSections(planned, builtRoutes) — pure (AC-03)
> ```
>
> — `sad.md §5, internal decomposition, abridged` · full text: [sad.md](../sad.md)

> **How verify:** `tests/navigation.test.ts` covers `offeredSections()` for all-present, none-present and a mistyped href.
>
> — `sad.md §10, QG-2 How verify, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** cross-entity logic is a pure function in `src/lib/` with a Vitest test.
>
> — `sad.md §2, Conventions, abridged` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) in full and follow them. Do not guess.

## Data delta

No DB changes. File entity introduced:

| Field | Type | Constraints | Change |
|---|---|---|---|
| (position) | array index | | planned order (AC-03) |
| `label` | `string` | non-empty, unique | added |
| `href` | `string` | starts and ends with `/`, unique, internal only | added |

Initial value, moved unchanged out of `src/components/Header.astro`: `Research → /research/`, `People → /people/`, `Join/Contact → /join/`. An offered section is a planned section whose `href` resolves to a page: `src/pages` at build time, `dist/<href>index.html` at publish time. Both checks use the same href→file rule, defined once in `src/lib/navigation.ts`.

— `data-model.md §PLANNED_SECTION, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. Module exports (this task defines them): `sections` (readonly array of `{ label, href }`), `offeredSections(planned, builtFiles)` and `missingPlannedPages(planned, builtFiles)`, where `builtFiles` is a set of built file paths relative to `dist/` (e.g. `research/index.html`).

## Acceptance criteria

### AC-03 — happy path

> **Given** a section is on the site's ordered list of planned sections and its page has been published
> **When** a visitor opens any page
> **Then** the navigation offers that section, in the planned order and with its planned label, without a separate navigation edit, and planned sections without a page are not offered
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)

### AC-04 — error

> **Given** a planned section's navigation entry points to a page the build does not contain (not yet written, or a mistyped address)
> **When** the maintainer publishes
> **Then** visitors are not offered that entry, the publish goes ahead, and the maintainer is told which navigation entry points to a missing page
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Create `src/data/sections.ts` with the three planned sections, in order — `src/data/sections.ts`
- [ ] Write `hrefToFile(href)` (`/research/` → `research/index.html`), `offeredSections()` and `missingPlannedPages()` as pure functions — `src/lib/navigation.ts`
- [ ] Unit tests: all present, none present, one present, mistyped href, order preserved, labels preserved — `tests/navigation.test.ts`
- [ ] Add a test that the real `sections` list satisfies the field constraints (unique label/href, slashes) — `tests/navigation.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| No planned section has a page | `offeredSections()` returns `[]`; navigation renders empty, the logo still links home |
| Mistyped href (`/reserch/`) | not offered; `missingPlannedPages()` returns that entry with its label and href |
| Href without trailing slash | fails the constraint test (check job), never reaches a publish |
| Duplicate label or href | fails the constraint test |

## Definition of Done

- [ ] `tests/navigation.test.ts` passes, covering all-present, none-present and mistyped href (sad §10 QG-2)
- [ ] `offeredSections()` and `missingPlannedPages()` are pure: no file system, no Astro imports
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
