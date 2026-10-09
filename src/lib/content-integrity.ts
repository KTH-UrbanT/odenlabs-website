import { getCollection } from "astro:content";
import { findDanglingReferences, type Entry } from "./references";

let checked: Promise<void> | undefined;

/** Throws (failing the build) if any content entry references a missing one. */
export function assertContentIntegrity(): Promise<void> {
  checked ??= (async () => {
    const entries: Entry[] = (
      await Promise.all([
        getCollection("themes"),
        getCollection("people"),
        getCollection("projects"),
      ])
    ).flat();
    const problems = findDanglingReferences(entries);
    if (problems.length > 0) {
      throw new Error(`Dangling content references:\n${problems.join("\n")}`);
    }
  })();
  return checked;
}
