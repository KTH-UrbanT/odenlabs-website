---
id: T5
title: "Write the minimal who-we-are front page from the maintainer's copy"
layer: "ui"
deps: []
blocks: ["T6"]
acs: ["AC-15"]
files_hint: ["src/pages/index.astro", "tests/build.test.ts"]
owner: "pasichnyi"
estimate: "S"
context_budget: "S"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T5 — Write the minimal who-we-are front page from the maintainer's copy

## Place in the sequence

- **Blocked by:** no task, but **needs the maintainer's front-page copy as input** (spec §8) · **Blocks:** T6 (identity sign-off screenshots this page) · **Wave:** 1.
- **Lane:** shares `tests/build.test.ts` with T3, T4 and T7, so they are serialized.

## Why (user story)

> **As a** visitor
> **I want** the front page to say who the group is, where it sits at KTH and how to get in touch
> **So that** I learn the basics even before the full site exists
>
> — `spec.md §4, US-08, verbatim` · full text: [spec.md](../spec.md)

This task fills SCR-01 with the four required elements and nothing more.

## Inlined context

> - [ ] Front-page copy: the who-we-are paragraph and the contact route (US-08). Default now: none — the maintainer writes it. — owner: pasichnyi, due: before sdd:implement
>
> — `spec.md §8, open question 5, verbatim` · full text: [spec.md](../spec.md)

> | Front-page copy not yet supplied … | Low | AC-15 cannot pass without it. `implement` treats the copy as an input, not something it invents. |
>
> — `sad.md §11, risk row, abridged` · full text: [sad.md](../sad.md)

> - **Front-page contact leaves the site** (e.g. an email link); there is no contact form in this feature.
>
> — `ux-flows.md §Platform decisions, verbatim` · full text: [ux-flows.md](../ux-flows.md)

> - The full front page with equal paths to Research, People and Join/Contact — that stays roadmap step 2; this feature pulls forward only a minimal who-we-are front page (US-08).
>
> — `spec.md §3, Non-goals, verbatim` · full text: [spec.md](../spec.md)

Reuse: `Base.astro`, tokens only, no new component.

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [ux-flows.md](../ux-flows.md) in full and follow them. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface. The contact route is a `mailto:` link (or other address) supplied by the maintainer.

## Acceptance criteria

### AC-15 — happy path

> **Given** the maintainer has supplied the front-page copy
> **When** a visitor opens the front page
> **Then** they see the group name, a short who-we-are paragraph, the KTH affiliation and a way to get in touch
>
> — `spec.md §5, AC-15, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Ask the maintainer for the who-we-are paragraph and the contact route; stop if not supplied — never write placeholder copy
- [ ] Add the paragraph, the KTH affiliation (school/department as given) and the contact link to the front page — `src/pages/index.astro`
- [ ] Set a `description` for the page from the first sentence of the copy — `src/pages/index.astro`
- [ ] Build test: `dist/index.html` contains the group name, the KTH affiliation and a contact link (`a[href^="mailto:"]` or the supplied route) — `tests/build.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Copy not supplied | task stays `blocked`; no placeholder text is committed |
| Contact is a personal address | publish only what the maintainer supplied deliberately (spec §6.1) |

## Definition of Done

- [ ] the front-page assertion in `tests/build.test.ts` passes, and the paragraph is the maintainer's copy word for word
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint && npm test` clean
