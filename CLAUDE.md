# CLAUDE.md

Static website for the Oden Lab research group at KTH, built with Astro and deployed
to `oden.abe.kth.se`. English only, one maintainer. Architecture and the reasoning
behind it: `docs/architecture-map.md` and `docs/adr/`.

## Commands

- `npm run dev` — local dev server
- `npm run build` — static build into `dist/`
- `npm test` — Vitest: unit tests + the build smoke test (`tests/build.test.ts`)
- `npm run lint` — `astro check` (types + content schema) and `prettier --check .`
- `npm run format` — apply Prettier

Node version is pinned in `.nvmrc`. Run `npm run lint && npm test` before pushing.

## Structure

- `src/content/{themes,people,projects}/` — one Markdown file per entry; each folder's
  `README.md` documents the fields
- `src/content.config.ts` — Zod schemas and cross-references between collections
- `src/pages/` — file-based routes; dynamic routes via `getStaticPaths`
- `src/layouts/Base.astro` — the one layout: head, header/nav, footer
- `src/components/` — reusable `.astro` components
- `src/styles/tokens.css` — design tokens; `global.css` imports them and is loaded once
  in `Base.astro`
- `src/lib/` — pure helpers, each with a Vitest test in `tests/`
- `public/` — served as-is (logo, favicon)

## Conventions

- **IDs are file names.** `people/jane-doe.md` has ID `jane-doe`; cross-links use
  `reference()` to these IDs.
- **Bad content fails the build, never the visitor.** Schema errors fail `astro check`
  and `astro build`; dangling references fail the build through
  `assertContentIntegrity()` in `Base.astro`. No runtime error paths.
- **Styling uses tokens only.** Component styles go in scoped `<style>` blocks and use
  custom properties from `tokens.css`; never write raw colours outside that file. No
  Tailwind, no UI kit. Restyling means editing `tokens.css`.
- **No runtime.** All data is resolved at build time; no client-side JS unless a feature
  needs it. External data (e.g. publications) arrives as a generated file in `src/data/`.
- **New things go where their kind lives:** a content type is a collection plus list
  and detail pages in `src/pages/<type>/`; a page is `src/pages/<name>.astro` on
  `Base.astro`; cross-entity logic is a function in `src/lib/` with a test.
- **Few dependencies.** Every new dependency needs a reason.
- Formatting: Prettier with `prettier-plugin-astro`; `.editorconfig` (2 spaces, LF).
