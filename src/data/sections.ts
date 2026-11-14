// The site's ordered list of planned sections. The header offers a section
// only once its page exists (see src/lib/navigation.ts), so adding a page is
// enough to make it appear; no navigation edit is needed.
export interface Section {
  label: string;
  href: string;
  /**
   * For a section backed by content: the collection whose published entries
   * make the section exist. Its pages are generated only when there is
   * something to show, so the header offers the section on the same rule.
   */
  requires?: "themes" | "people" | "projects";
}

export const sections: readonly Section[] = [
  { label: "Research", href: "/research/", requires: "themes" },
  { label: "People", href: "/people/", requires: "people" },
  { label: "Join/Contact", href: "/join/" },
];
