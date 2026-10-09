---
status: Living
tool: figma
figma_file: "https://www.figma.com/design/Rei8HZjvQBbVk5zfxjF23h"
pen_file: ""
updated_at: "2026-10-04"
---

# Design system — odenlabs-website

> The project's **design canon**, produced once per repo by `design-system` and read by
> `ux-flows` / `screens` / `implement` / `review`. It is committed, so the tool choice and the
> inventory are shared by everyone who works on the repo. `architecture-map.md` §Frontend / UI
> foundation stays the inventory of the **code**. This file holds the **design side**: tool,
> posture, tokens, component inventory and cross-screen conventions. Refresh it with
> `/sdd:design-system` when the foundation changes.

## Platform posture

- **Posture:** responsive-both. Visitor pages must work equally well on phone and desktop:
  prospective students often arrive on a phone, while funders and peers read on a laptop. This
  was first set in `docs/features/clean-starter/ux-flows.md`.
- **Breakpoints / device classes:** none fixed yet. Layout is fluid up to
  `--content-width` (64rem, `src/styles/tokens.css:74`). The header wraps its nav at narrow
  widths (`flex-wrap`, `src/components/Header.astro:29`). Named breakpoints become tokens in
  `tokens.css` when a screen first needs one.

## Design tool

- **Tool:** figma. Screens are drawn in Figma through the Figma MCP. The code stays the source
  of truth for tokens (see below); Figma is where layouts and states are explored before
  `implement`.
- **Library location:** [Oden Lab — design system](https://www.figma.com/design/Rei8HZjvQBbVk5zfxjF23h)
  (team UrbanT). Reference frames and nodes in `screens.md` by the file URL plus a `?node-id=` parameter. The
  file was created empty: tokens and the primitives below have not been mirrored into it yet.

## Token source

`src/styles/tokens.css` is the single source of tokens. Figma variables, once created, mirror
it; they never lead it. A screen never declares a raw value inline. To restyle (roadmap D5),
edit this file.

- **Colors:** `src/styles/tokens.css:8-45` holds the brand navy/grey (`--color-brand`,
  `--color-brand-muted`), the blue primary and cyan secondary scales (50–950), and the semantic
  roles (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-link`,
  `--color-link-hover`, `--color-border`).
- **Spacing / sizing:** `src/styles/tokens.css:63-75` holds `--space-1` … `--space-16`,
  `--content-width` and `--radius`.
- **Typography:** `src/styles/tokens.css:47-61` holds `--font-sans`, `--font-mono`, the
  `--text-sm` … `--text-3xl` scale, the leading values and the weights. Global element defaults
  (headings in brand navy, link colors) live in `src/styles/global.css:32-45`.

## Component inventory

| Component | Source (`file:line` / node / URL) | States it supports | Notes |
|---|---|---|---|
| Base (layout) | `src/layouts/Base.astro:7-36` | default | Every page uses it. Props: `title` (required), `description` (optional). Renders head, `Header`, `<main>` slot and `Footer`. Runs `assertContentIntegrity()` at build time. |
| Header | `src/components/Header.astro:1-56` | default / link hover / wrapped (narrow width) | Logo plus the main nav (Research · People · Join/Contact). The nav items are a static list at `:2-6`. |
| Footer | `src/components/Footer.astro:1-19` | default | Copyright line with the build year, in muted small text. |

No Figma nodes exist for these yet. Add a node URL to each row when its component is drawn.
`screens.md` may only use these names. A screen that needs something else declares
`NEW: ComponentName` with a reason no existing primitive fits; `implement` then registers it here.

## Interaction & writing conventions

- **Errors:** no runtime error UI. Bad content fails the build, never the visitor
  (CLAUDE.md). The only visitor-facing error is a static 404 page. It does not exist yet and will use `Base`.
- **Empty states:** plain text inside the section, such as "No projects under this theme yet."
  There is no illustration and no CTA unless the spec asks for one.
- **Loading:** none. Every page is pre-rendered static HTML, and images carry `width`/`height`
  to avoid layout shift.
- **Validation:** none. The site has no forms; contact happens through links. If a form is ever
  added, it needs a spec and an entry here.
- **Microcopy tone:** plain, factual academic English with no marketing voice. Address
  prospective students directly ("you") on Join/Contact.
