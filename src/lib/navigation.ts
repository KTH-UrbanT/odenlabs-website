import type { Section } from "../data/sections";

/** The built file that serves a section href: `/research/` → `research/index.html`. */
export function hrefToFile(href: string): string {
  return `${href.replace(/^\/+/, "")}index.html`;
}

/** Planned sections whose page is among the built files, in planned order. */
export function offeredSections<S extends Section>(
  planned: readonly S[],
  builtFiles: ReadonlySet<string>,
): S[] {
  return planned.filter((s) => builtFiles.has(hrefToFile(s.href)));
}

/** Planned sections whose page is missing from the built files. */
export function missingPlannedPages<S extends Section>(
  planned: readonly S[],
  builtFiles: ReadonlySet<string>,
): S[] {
  return planned.filter((s) => !builtFiles.has(hrefToFile(s.href)));
}

/**
 * The built file for a page under `src/pages` (path relative to that folder):
 * `index.astro` → `index.html`, `research.astro` and `research/index.astro` →
 * `research/index.html`. Dynamic routes (`[x]`) return null: their files depend
 * on data, so planned sections must be fixed-name pages.
 */
export function pageToBuiltFile(pagePath: string): string | null {
  if (pagePath.includes("[")) return null;
  const route = pagePath.replace(/\.(astro|md|html)$/, "");
  if (route === "index" || route.endsWith("/index")) return `${route}.html`;
  return `${route}/index.html`;
}

/** The set of built files for a list of page paths; dynamic routes are left out. */
export function builtPagesFrom(pagePaths: readonly string[]): Set<string> {
  const built = new Set<string>();
  for (const page of pagePaths) {
    const file = pageToBuiltFile(page);
    if (file !== null) built.add(file);
  }
  return built;
}
