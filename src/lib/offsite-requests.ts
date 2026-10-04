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

// HTML character references that can appear in attribute values. Astro
// writes quotes inside an attribute as `&quot;`, so `url(&quot;https://…&quot;)`
// must be read as `url("https://…")`. Browsers also decode numeric references
// without the `;`, the named punctuation below (names are case-sensitive), and
// the legacy `&quot` `&amp` `&lt` `&gt` without the `;`, except, in an
// attribute value, before a letter, digit or `=`. One pass only, as in the
// browser: `&amp;quot;` reads as `&quot;`, not `"`.
const NAMED = new Map(
  Object.entries({
    quot: '"',
    QUOT: '"',
    apos: "'",
    amp: "&",
    AMP: "&",
    lt: "<",
    LT: "<",
    gt: ">",
    GT: ">",
    colon: ":",
    sol: "/",
    lpar: "(",
    rpar: ")",
    period: ".",
    Tab: "\t",
    NewLine: "\n",
  }),
);
const LEGACY = /^(?:quot|amp|lt|gt|QUOT|AMP|LT|GT)/;

function decodeEntities(text: string, inAttribute: boolean): string {
  return text.replace(
    /&(?:#(\d+);?|#x([0-9a-f]+);?|([a-z]+)(;?))/gi,
    (ref, dec?: string, hex?: string, name?: string, semi?: string, at = 0) => {
      if (dec || hex) {
        const code = dec ? Number(dec) : parseInt(hex!, 16);
        return code <= 0x10ffff ? String.fromCodePoint(code) : ref;
      }
      if (semi && NAMED.has(name!)) return NAMED.get(name!)!;
      const legacy = LEGACY.exec(name!)?.[0];
      if (legacy === undefined) return ref;
      const rest = ref.slice(1 + legacy.length);
      const next = rest[0] ?? text[at + ref.length] ?? "";
      if (inAttribute && /[a-z0-9=]/i.test(next)) return ref;
      return NAMED.get(legacy)! + rest;
    },
  );
}

// One attribute value, double-quoted, single-quoted or unquoted.
const value = String.raw`\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))`;
const attr = (name: string, flags = "i") =>
  new RegExp(String.raw`(?:^|\s)${name}` + value, flags);
const valueOf = (m: RegExpMatchArray) =>
  decodeEntities(m[1] ?? m[2] ?? m[3], true);

// Elements whose text the browser reads as written, outside SVG.
const RAW_TEXT = new Set([
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
]);

// Rewrites `html` the way the browser reads it for requests: every attribute
// value is decoded (`style`, but also SVG `mask`, `filter`, `fill`…), and so
// is the text of a `<style>` inside inline SVG, which the browser parses as
// markup. Page text, comments and raw-text elements (plain `<style>`,
// `<script>`) are left as written: the browser doesn't decode them, and
// decoding prose would report it as requests.
//
// One forward pass. A tag runs to the first `>` outside quotes, so a raw `<`
// or `</svg>` inside a value (Astro keeps both raw in expression attributes)
// does not end it. A quote still open at the end of the input stops the scan,
// and every search moves forward, so a malformed page can't make it quadratic.
function decodeMarkup(html: string): string {
  const lower = html.toLowerCase();
  let out = "";
  let i = 0;
  let svgDepth = 0;
  const copyTo = (end: number) => {
    out += html.slice(i, end);
    i = end;
  };
  for (;;) {
    const lt = html.indexOf("<", i);
    if (lt === -1) break;
    copyTo(lt);
    if (html.startsWith("<!--", i)) {
      const close = html.indexOf("-->", i + 4);
      copyTo(close === -1 ? html.length : close + 3);
      continue;
    }
    const head = /^<(\/?)([a-z][^\s/>]*)/i.exec(html.slice(i, i + 64));
    if (!head) {
      copyTo(i + 1);
      continue;
    }
    const [, closing, rawName] = head;
    const name = rawName.toLowerCase();
    let tag = head[0];
    let j = i + tag.length;
    // Attributes, separated by whitespace or `/`, up to `>`.
    for (;;) {
      while (j < html.length && /[\s/]/.test(html[j])) j++;
      if (j >= html.length || html[j] === ">") break;
      const nameStart = j;
      while (j < html.length && !/[\s/>=]/.test(html[j])) j++;
      if (j === nameStart) j++; // a stray `=` where a name starts
      tag += ` ${html.slice(nameStart, j)}`;
      let k = j;
      while (k < html.length && /\s/.test(html[k])) k++;
      if (html[k] !== "=") continue;
      k++;
      while (k < html.length && /\s/.test(html[k])) k++;
      let valueEnd: number;
      let raw: string;
      if (html[k] === '"' || html[k] === "'") {
        const close = html.indexOf(html[k], k + 1);
        if (close === -1) return out + html.slice(i);
        raw = html.slice(k + 1, close);
        valueEnd = close + 1;
      } else {
        valueEnd = k;
        while (valueEnd < html.length && !/[\s>]/.test(html[valueEnd]))
          valueEnd++;
        raw = html.slice(k, valueEnd);
      }
      tag += `="${decodeEntities(raw, true)}"`;
      j = valueEnd;
    }
    out += tag + ">";
    i = Math.min(j + 1, html.length);
    if (name === "svg") {
      svgDepth = Math.max(0, svgDepth + (closing ? -1 : 1));
      continue;
    }
    if (closing) continue;
    if (svgDepth > 0 && name === "style") {
      const end = lower.indexOf("</style", i);
      if (end === -1) break;
      out += decodeEntities(html.slice(i, end), false);
      i = end;
    } else if (svgDepth === 0 && RAW_TEXT.has(name)) {
      const end = lower.indexOf(`</${name}`, i);
      copyTo(end === -1 ? html.length : end);
    }
  }
  return out + html.slice(i);
}

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
  const text = decodeMarkup(source);
  // A quoted or unquoted url(); no part can match the same text twice, so a
  // malformed page can't make the scan quadratic.
  for (const [, dq, sq, bare] of text.matchAll(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^"'()\s]+))\s*\)/gi,
  )) {
    add(dq ?? sq ?? bare);
  }
  for (const [, url] of text.matchAll(/@import\s+["']([^"']+)["']/gi)) {
    add(url);
  }
  return found;
}
