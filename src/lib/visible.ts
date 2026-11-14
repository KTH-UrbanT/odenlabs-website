import { getCollection } from "astro:content";
import { visibleEntries } from "./drafts";

/**
 * Drafts are shown only when SHOW_DRAFTS=1, which `npm run dev` sets. It is an
 * explicit opt-in on purpose: `import.meta.env.DEV` is true in any build run
 * with NODE_ENV other than "production" (the test runner sets it to "test"),
 * and a build must never include a draft.
 */
const previewDrafts = process.env.SHOW_DRAFTS === "1";

/**
 * The entries of a collection that pages may show: published ones, plus drafts
 * while previewing with `npm run dev`.
 */
export async function getVisible<C extends "themes" | "people" | "projects">(
  name: C,
) {
  return visibleEntries(await getCollection(name), previewDrafts);
}
