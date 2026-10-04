---
id: T4
title: "Add the not-found page with navigation, a link home and noindex"
layer: "ui"
deps: []
blocks: ["T6"]
acs: ["AC-02"]
files_hint: ["src/pages/404.astro", "src/layouts/Base.astro", "tests/build.test.ts"]
owner: "pasichnyi"
estimate: "S"
context_budget: "S"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T4 — Add the not-found page with navigation, a link home and noindex

## Place in the sequence

- **Blocked by:** none · **Blocks:** T6 (identity, whose screenshot sign-off covers this page) · **Wave:** 1.
- **Lane:** shares `tests/build.test.ts` with T3, T5 and T7, so they are serialized.

## Why (user story)

> **As a** visitor following an old or mistyped link
> **I want** a page in the group's look that says the page doesn't exist and leads me back
> **So that** I don't conclude the site is broken
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)

This task builds SCR-02, the landing spot for every address the site does not have.

## Inlined context

> The not-found page is a static `404.html` that the KTH server already serves for missing addresses.
>
> — `sad.md §4, choice 1 UI architecture, abridged` · full text: [sad.md](../sad.md)

> └── pages/404.astro                    # not-found page — Base layout, nav, link home, noindex (AC-02)
>
> — `sad.md §5, internal decomposition, verbatim` · full text: [sad.md](../sad.md)

> `tests/build.test.ts` asserts that `dist/404.html` exists with `noindex`.
>
> — `sad.md §10, QG-2 How verify, abridged` · full text: [sad.md](../sad.md)

> | SCR-02 | Not-found page | Says the page does not exist, in the group's look, and leads back (AC-02) | any address the site does not have: old starter link, removed page, typo | front page (SCR-01), a section via navigation (SCR-03) |
>
> — `ux-flows.md §Screen inventory, SCR-02, verbatim` · full text: [ux-flows.md](../ux-flows.md)

The "not found" status for search engines comes from the KTH server returning `404.html` with a 404 status (confirmed in clarify, sad §2). The page itself adds `<meta name="robots" content="noindex">` and omits the canonical link. Reuse: `Base.astro` (add an optional `noindex` prop), `Header`, `Footer`, tokens only.

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) · [ux-flows.md](../ux-flows.md) in full and follow them. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-02 — happy path

> **Given** a visitor follows an address the site does not have (an old starter link or a typo)
> **When** the page opens
> **Then** the visitor sees a page in the group's look stating that the page does not exist, with the site navigation and a link to the front page, and search engines are told the page is not found rather than given a normal page
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Add an optional `noindex` prop to `Base.astro`: when set, emit the robots meta and skip the canonical link — `src/layouts/Base.astro`
- [ ] Create the page: heading saying the page does not exist, one sentence, a link to `/` — `src/pages/404.astro`
- [ ] Build test: `dist/404.html` exists, contains `noindex`, the header, and a link to `/`; it has no canonical link — `tests/build.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Visitor arrives from a deep path (`/post/demo/x/`) | links are root-relative (`/`, `/logo.svg`), so the page renders correctly at any depth |
| Search engine crawls a removed address | gets status 404 (server) plus `noindex` (page) |

## Definition of Done

- [ ] `tests/build.test.ts` 404 assertions pass
- [ ] `npm run preview` shows the page at an unknown path with header, footer and link home
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
