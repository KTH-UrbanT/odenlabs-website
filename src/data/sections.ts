// The site's ordered list of planned sections. The header offers a section
// only once its page exists (see src/lib/navigation.ts), so adding a page is
// enough to make it appear; no navigation edit is needed.
export interface Section {
  label: string;
  href: string;
}

export const sections: readonly Section[] = [
  { label: "Research", href: "/research/" },
  { label: "People", href: "/people/" },
  { label: "Join/Contact", href: "/join/" },
];
