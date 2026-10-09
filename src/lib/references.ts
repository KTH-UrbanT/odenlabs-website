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

/** Returns one message per reference that points at a missing entry. */
export function findDanglingReferences(entries: Entry[]): string[] {
  const known = new Set(entries.map((e) => `${e.collection}/${e.id}`));
  const problems: string[] = [];
  for (const entry of entries) {
    const refs: [string, Ref][] = [];
    collectRefs(entry.data, "", refs);
    for (const [path, ref] of refs) {
      if (!known.has(`${ref.collection}/${ref.id}`)) {
        problems.push(
          `${entry.collection}/${entry.id} (${path}) → missing ${ref.collection}/${ref.id}`,
        );
      }
    }
  }
  return problems;
}
