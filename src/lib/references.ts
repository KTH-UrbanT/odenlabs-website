// Astro's content layer only logs dangling `reference()` IDs; it does not fail
// the build. This check makes a bad cross-link a build error instead.

export interface Ref {
  collection: string;
  id: string;
}

export interface Entry {
  collection: string;
  id: string;
  data: unknown;
  /** The raw Markdown body, when the loader provides it. */
  body?: string;
}

const isRef = (value: unknown): value is Ref =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Ref).collection === "string" &&
  typeof (value as Ref).id === "string" &&
  Object.keys(value).length === 2;

function collectRefs(value: unknown, path: string, out: [string, Ref][]) {
  if (isRef(value)) {
    out.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collectRefs(item, `${path}[${i}]`, out));
  } else if (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date)
  ) {
    for (const [key, item] of Object.entries(value)) {
      collectRefs(item, path ? `${path}.${key}` : key, out);
    }
  }
}

/** Every reference in an entry's data, with its path (`people[0]`). */
export function refsOf(data: unknown): [string, Ref][] {
  const refs: [string, Ref][] = [];
  collectRefs(data, "", refs);
  return refs;
}

/** Returns one message per reference that points at a missing entry. */
export function findDanglingReferences(entries: Entry[]): string[] {
  const known = new Set(entries.map((e) => `${e.collection}/${e.id}`));
  const problems: string[] = [];
  for (const entry of entries) {
    for (const [path, ref] of refsOf(entry.data)) {
      if (!known.has(`${ref.collection}/${ref.id}`)) {
        problems.push(
          `${entry.collection}/${entry.id} (${path}) → missing ${ref.collection}/${ref.id}`,
        );
      }
    }
  }
  return problems;
}
