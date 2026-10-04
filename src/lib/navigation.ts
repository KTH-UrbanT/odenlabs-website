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
