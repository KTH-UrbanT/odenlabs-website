---
id: T6
title: "Derive the palette and type from the logo, self-host the fonts, and get the before/after sign-off"
layer: "ui"
deps: ["T2", "T4", "T5"]
blocks: ["T7"]
acs: ["AC-05", "AC-06"]
files_hint: ["src/styles/tokens.css", "src/styles/global.css", "src/styles/contrast-pairs.ts", "public/fonts/"]
owner: "pasichnyi"
estimate: "M"
context_budget: "M"
status: "blocked"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T6 — Derive the palette and type from the logo, self-host the fonts, and get the before/after sign-off

## Place in the sequence

- **Blocked by:** T2 (contrast check), T4 (not-found page), T5 (front page) · **Blocks:** T7 (build guards for off-site references and font budget) · **Wave:** 2, because the sign-off screenshots both pages in their final form.
- **Lane:** shares `src/styles/contrast-pairs.ts` with T2, serialized after it.

## Why (user story)

> **As a** visitor
> **I want** every page to carry the group's own recognisable, readable look derived from its logo
> **So that** I recognise the group and can read comfortably
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task replaces the generic stock scales next to the logo's navy and grey with a palette and type that belong to the group.

## Inlined context

> Identity has a bounded definition of done — palette and type derived from the unchanged logo, readability passing, one before/after screenshot signed off — and is not a release gate.
>
> — `spec.md §1, committed approach, abridged` · full text: [spec.md](../spec.md)

> The repository … inherited blue theme has not yet been tightened around the logo: next to the logo's navy and grey sit generic stock scales that say nothing about the group.
>
> — `spec.md §1, Context, abridged` · full text: [spec.md](../spec.md)

> | Third-party requests | 0 per page — fonts, styles and scripts all served from the site itself | … |
> | Font payload | ≤ 100 KB of font files per page | build output size check |
>
> — `spec.md §6, NFR rows, abridged` · full text: [spec.md](../spec.md)

> | Fonts and assets | Everything is self-served: vendored WOFF2 fonts in `public/fonts/` (Latin subset, open licence, `font-display: swap`). … |
> | Styling and identity | Tokens only. The palette and type derived from the unchanged logo live in `src/styles/tokens.css`. The text/background pairs the site uses are declared next to it in `contrast-pairs.ts`, and a test enforces ≥ 4.5:1 / ≥ 3:1. |
>
> — `sad.md §8, two rows, abridged` · full text: [sad.md](../sad.md)

> **Hard rule:** A new or redrawn logo — decision D5 restyles around the existing logo file, it does not replace it. (Non-goal)
>
> — `spec.md §3, Non-goals, verbatim` · full text: [spec.md](../spec.md)

> **Open:** May a self-built site on an abe.kth.se address carry its own palette and type under the KTH graphic profile? Default now: yes … — owner: pasichnyi, due: 2026-10-18
>
> — `spec.md §8, open question 1, abridged` · full text: [spec.md](../spec.md)

Brand anchors today: `--color-brand: #004790` (logo navy) and `--color-brand-muted: #666666` (logo grey) in `tokens.css`. No font family is chosen yet in `docs/design-system.md`; propose one open-licence family (plus a weight for headings) and confirm it with the maintainer before vendoring.

**Fallback:** insufficient or contradicted by the code → read [spec.md](../spec.md) · [sad.md](../sad.md) · [docs/design-system.md](../../../design-system.md) in full and follow them. Do not guess.

## Data delta

No DB changes. Edits `COLOUR_TOKEN` values in `tokens.css` and the `CONTRAST_PAIR` list for any new pairing the restyle introduces (e.g. text on a brand-tinted surface).

— `data-model.md §CONTRAST_PAIR, §COLOUR_TOKEN` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-05 — happy path

> **Given** the palette and type derived from the logo are in place
> **When** a visitor opens the front page or the not-found page
> **Then** both show the unchanged logo with the group's palette and type applied consistently, matching the before/after screenshot the maintainer signed off; that sign-off is a one-time manual acceptance — it never blocks a later publish, and later palette edits may change the look
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)

### AC-06 — domain invariant: all text is readable

> **Given** a maintainer changes a colour in the palette
> **When** the change would make any text and background pairing the site uses (as declared alongside the palette) fall below the readability minimum
> **Then** publishing is blocked and the maintainer is told which pair fails the "all text is readable" rule
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Take "before" screenshots of the front page and the not-found page (phone and desktop width) from the current build
- [ ] Replace the stock primary/secondary scales with scales derived from the logo navy and grey; keep the semantic tokens (`--color-text`, `--color-link`, …) as the only names components use — `src/styles/tokens.css`
- [ ] Confirm the font family with the maintainer; vendor Latin-subset WOFF2 files and the licence text — `public/fonts/`
- [ ] Add `@font-face` with `font-display: swap` and point `--font-sans` at it, keeping the system stack as fallback — `src/styles/global.css`, `src/styles/tokens.css`
- [ ] Declare every new text/background pairing — `src/styles/contrast-pairs.ts`
- [ ] Take "after" screenshots; record the maintainer's sign-off (date and the two images) in the PR description

## Edge cases

| Case | Behaviour |
|---|---|
| A font file fails to load | the same text renders in the fallback system font, still readable (sad §6 Flow 8) |
| A derived colour fails a pair | `tests/contrast.test.ts` names the pair; adjust the colour, never the minimum |
| KTH graphic profile later forbids the palette | a `tokens.css` edit only, still gated by the contrast test (sad §11) |
| Logo file changes | out of scope: the logo stays byte-for-byte unchanged |

## Definition of Done

- [ ] `tests/contrast.test.ts` passes on the new tokens with every pairing declared
- [ ] `public/logo.svg` is unchanged (`git diff` empty for it)
- [ ] the before/after screenshots and the maintainer's sign-off are recorded in the PR
- [ ] no raw colour outside `tokens.css` (grep `#[0-9a-fA-F]{3,6}` in `src/` except `tokens.css` returns nothing)
- [ ] `npm run lint && npm test` clean
