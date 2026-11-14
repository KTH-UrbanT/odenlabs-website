// Unfinished content stays out of the site. An entry is a draft when its front
// matter says `draft: true`; pages list only published entries. Publishing
// something that still holds a `TODO(...)` placeholder, or that points at a
// draft, is a build error, so a half-written entry can never reach a visitor.
import { refsOf, type Entry } from "./references";

const PLACEHOLDER = /TODO\(/;

export const isDraft = (entry: { data: unknown }): boolean =>
  (entry.data as { draft?: boolean }).draft === true;

/** The entries visitors may see. Every list and page goes through this. */
export function publishedOnly<T extends { data: unknown }>(entries: T[]): T[] {
  return entries.filter((entry) => !isDraft(entry));
}

/**
 * What a page may show: published entries, plus drafts while previewing
 * locally (`npm run dev`, see visible.ts). A build never includes a draft.
 */
export function visibleEntries<T extends { data: unknown }>(
  entries: T[],
  previewDrafts: boolean,
): T[] {
  return previewDrafts ? entries : publishedOnly(entries);
}

/** True when the text still holds a `TODO(...)` placeholder. */
export const hasPlaceholder = (text: string): boolean => PLACEHOLDER.test(text);

/** One message per published entry that still holds a placeholder. */
export function findPublishedPlaceholders(entries: Entry[]): string[] {
  return publishedOnly(entries)
    .filter((e) => hasPlaceholder(`${JSON.stringify(e.data)}\n${e.body ?? ""}`))
    .map(
      (e) =>
        `${e.collection}/${e.id} holds a TODO placeholder: finish it or set draft: true`,
    );
}

/** One message per published entry that references a draft. */
export function findDraftReferences(entries: Entry[]): string[] {
  const drafts = new Set(
    entries.filter(isDraft).map((e) => `${e.collection}/${e.id}`),
  );
  const problems: string[] = [];
  for (const entry of publishedOnly(entries)) {
    for (const [path, ref] of refsOf(entry.data)) {
      if (drafts.has(`${ref.collection}/${ref.id}`)) {
        problems.push(
          `${entry.collection}/${entry.id} (${path}) → draft ${ref.collection}/${ref.id}: publish it too or drop the reference`,
        );
      }
    }
  }
  return problems;
}
