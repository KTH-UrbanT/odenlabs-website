// Finds requests a built page or stylesheet would make to another host
// (spec §6 NFR: third-party requests 0). Plain `<a href>` links and `mailto:`
// are navigation, not requests, and are not reported.

// `<link>` relations that make the browser fetch the target.
const FETCHING_REL =
  /\b(stylesheet|preload|prefetch|modulepreload|icon|apple-touch-icon|manifest|preconnect|dns-prefetch)\b/i;

function isOffSite(url: string, ownHost: string): boolean {
  const u = url.trim();
  if (!/^(https?:)?\/\//i.test(u)) return false;
  try {
    return new URL(u, "https://placeholder.invalid").host !== ownHost;
  } catch {
    return true;
  }
}

// HTML character references that can appear in attribute values and inline
// style text. Astro writes the quotes inside a `style` attribute as `&quot;`,
// so `url(&quot;https://…&quot;)` must be read as `url("https://…")`.
const NAMED: Record<string, string> = {
  quot: '"',
  apos: "'",
  amp: "&",
  lt: "<",
  gt: ">",
};
function decodeEntities(text: string): string {
  return text.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
    (ref, dec?: string, hex?: string, name?: string) => {
      if (dec || hex) {
        const code = dec ? Number(dec) : parseInt(hex!, 16);
        return code <= 0x10ffff ? String.fromCodePoint(code) : ref;
      }
      return NAMED[name!.toLowerCase()] ?? ref;
    },
  );
}

// One attribute value, double-quoted, single-quoted or unquoted.
const value = String.raw`\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))`;
const attr = (name: string, flags = "i") =>
  new RegExp(String.raw`(?:^|\s)${name}` + value, flags);
const valueOf = (m: RegExpMatchArray) => decodeEntities(m[1] ?? m[2] ?? m[3]);

/** Every off-site URL that `source` (HTML or CSS) makes the browser request. */
export function findOffSiteRequests(source: string, ownHost: string): string[] {
  const found: string[] = [];
  const add = (url: string) => {
    if (isOffSite(url, ownHost)) found.push(url.trim());
  };

  for (const [, attrs] of source.matchAll(/<link\s([^>]*)>/gi)) {
    const rel = attrs.match(attr("rel"));
    const href = attrs.match(attr("href"));
    if (href && FETCHING_REL.test(rel ? valueOf(rel) : "")) add(valueOf(href));
  }
  // `href` on SVG <image> and <use> loads a resource.
  for (const [, attrs] of source.matchAll(/<(?:image|use)\s([^>]*)>/gi)) {
    const href = attrs.match(attr("(?:xlink:)?href"));
    if (href) add(valueOf(href));
  }
  for (const name of ["src", "poster"]) {
    for (const m of source.matchAll(attr(name, "gi"))) add(valueOf(m));
  }
  for (const m of source.matchAll(attr("srcset", "gi"))) {
    for (const candidate of valueOf(m).split(","))
      add(candidate.trim().split(/\s+/)[0]);
  }
  // Only `style` attribute values are decoded, so their entity-encoded quotes
  // read as quotes; `<style>` blocks and CSS files are never entity-encoded,
  // and decoding page text would report prose as requests.
  const text = source.replace(
    /(\sstyle\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi,
    (_, lead: string, dq?: string, sq?: string) =>
      `${lead}"${decodeEntities(dq ?? sq ?? "")}"`,
  );
  for (const [, url] of text.matchAll(/url\(\s*["']?([^"')]*?)["']?\s*\)/gi)) {
    add(url);
  }
  for (const [, url] of text.matchAll(/@import\s+["']([^"']+)["']/gi)) {
    add(url);
  }
  return found;
}
