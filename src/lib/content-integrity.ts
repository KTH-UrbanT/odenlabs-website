import { getCollection } from "astro:content";
import { findDraftReferences, findPublishedPlaceholders } from "./drafts";
import { findDanglingReferences, type Entry } from "./references";

let checked: Promise<void> | undefined;

/**
 * Throws (failing the build) if a content entry references a missing one, a
 * published entry still holds a TODO placeholder, or one points at a draft.
 */
export function assertContentIntegrity(): Promise<void> {
  checked ??= (async () => {
    const entries: Entry[] = (
      await Promise.all([
        getCollection("themes"),
        getCollection("people"),
        getCollection("projects"),
      ])
    ).flat();
    const dangling = findDanglingReferences(entries);
    if (dangling.length > 0) {
      throw new Error(`Dangling content references:\n${dangling.join("\n")}`);
    }
    const unfinished = [
      ...findPublishedPlaceholders(entries),
      ...findDraftReferences(entries),
    ];
    if (unfinished.length > 0) {
      throw new Error(
        `Unfinished content is published:\n${unfinished.join("\n")}`,
      );
    }
  })();
  return checked;
}
