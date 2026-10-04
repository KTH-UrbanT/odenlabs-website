// WCAG 2.1 contrast checking for the text/background pairs declared in
// src/styles/contrast-pairs.ts. Used by tests/contrast.test.ts, so a palette
// edit that makes any declared pair unreadable fails the check job.

export type TextSize = "body" | "large" | "ui";

export interface ContrastPair {
  name: string;
  text: string;
  background: string;
  size: TextSize;
}

export interface ContrastFailure {
  name: string;
  ratio: number;
  minimum: number;
}

/** WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text and UI elements. */
export function minimumFor(size: TextSize): number {
  return size === "body" ? 4.5 : 3;
}

function parseHex(value: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!m) throw new Error(`Not a hex colour: ${value}`);
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function luminance(value: string): number {
  const [r, g, b] = parseHex(value).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Reads the custom properties of a CSS file and resolves var() aliases. */
export function resolveTokens(css: string): Map<string, string> {
  const raw = new Map<string, string>();
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (raw.has(m[1])) throw new Error(`Token defined twice: ${m[1]}`);
    raw.set(m[1], m[2].trim());
  }
  const resolved = new Map<string, string>();
  const resolve = (name: string, seen: string[]): string => {
    const known = resolved.get(name);
    if (known !== undefined) return known;
    if (seen.includes(name)) {
      throw new Error(`Token cycle: ${[...seen, name].join(" → ")}`);
    }
    const value = raw.get(name);
    if (value === undefined) throw new Error(`Unknown token: ${name}`);
    const alias = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value);
    const result = alias ? resolve(alias[1], [...seen, name]) : value;
    resolved.set(name, result);
    return result;
  };
  for (const name of raw.keys()) {
    if (raw.get(name)!.startsWith("var(")) resolve(name, []);
    else resolved.set(name, raw.get(name)!);
  }
  return resolved;
}

/** Every declared pair below its minimum, with the ratio it reaches. */
export function checkPairs(
  pairs: readonly ContrastPair[],
  tokens: ReadonlyMap<string, string>,
): ContrastFailure[] {
  const colour = (pair: ContrastPair, token: string) => {
    const value = tokens.get(token);
    if (value === undefined) {
      throw new Error(`Pair "${pair.name}" uses unknown token ${token}`);
    }
    return value;
  };
  const ratioOf = (pair: ContrastPair) => {
    try {
      return contrastRatio(
        colour(pair, pair.text),
        colour(pair, pair.background),
      );
    } catch (e) {
      const m = /^Not a hex colour: (.*)$/.exec((e as Error).message);
      if (!m) throw e;
      const bad = [pair.text, pair.background].find(
        (t) => tokens.get(t)?.trim() === m[1].trim(),
      );
      throw new Error(
        `Pair "${pair.name}": token ${bad} is not a hex colour (${m[1]})`,
      );
    }
  };
  return pairs.flatMap((pair) => {
    const ratio = ratioOf(pair);
    const minimum = minimumFor(pair.size);
    return ratio < minimum ? [{ name: pair.name, ratio, minimum }] : [];
  });
}
