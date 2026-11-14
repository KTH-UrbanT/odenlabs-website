// People are listed by surname. The surname is the last word of the name, so a
// compound surname with a particle ("van Dijk") sorts under its last word; use
// the `order` field of an entry to place such a person by hand.
const collator = new Intl.Collator("sv", { sensitivity: "base" });

/** The last word of a name: "Kateryna Pereverza" → "Pereverza". */
export function surname(name: string): string {
  const words = name.trim().split(/\s+/);
  return words[words.length - 1] ?? "";
}

/** Compares two full names by surname, then by the whole name. */
export function compareBySurname(a: string, b: string): number {
  return collator.compare(surname(a), surname(b)) || collator.compare(a, b);
}
