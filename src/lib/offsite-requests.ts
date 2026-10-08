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

// Elements whose text the browser does not parse as tags: raw text (`script`,
// `style`, `xmp`, `iframe`, `noembed`, `noframes`) and RCDATA (`textarea`,
// `title`). `noscript` is raw text only with scripting on (see `Reading`).
const RAW_TEXT = new Set([
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
]);

// HTML whitespace. Not `\s`: NBSP and the other Unicode spaces are ordinary
// characters in a tag, so reading them as separators would lose sync.
const WS = /[ \t\n\f\r]/;

// One way of reading a page. The browser's reading depends on things the text
// alone doesn't settle (is scripting on, which tags end foreign content), so
// `findOffSiteRequests` reads the page under each combination and unions them.
interface Reading {
  // `<svg>` and `<math>` start foreign content: `<script>`, `<title>`… are then
  // ordinary elements, and an SVG `<style>` is parsed as markup.
  foreign: boolean;
  // `<noscript>` is raw text (scripting on) rather than markup (scripting off).
  noscriptRaw: boolean;
}

interface Tag {
  name: string;
  attrs: [name: string, value: string][];
}

// Reads `html` once, the way the browser does, and returns what the scans in
// `findOffSiteRequests` need:
//   - `tags`: every start tag with its attribute names (lower case) and decoded
//     values, so `src`, `srcset`, `poster`, `<link>` and `<image>`/`<use>` are
//     all read by one attribute parser;
//   - `decoded`: every decoded attribute value (`style`, but also SVG `mask`,
//     `filter`, `fill`…) and the decoded text of a `<style>` inside inline
//     SVG, which the browser parses as markup. It is added to the source, never
//     substituted for it, so a wrong reading here can only add a report.
// Page text, comments and raw-text elements are not decoded: the browser doesn't
// decode them, and decoding prose would report it as requests.
//
// One forward pass per reading. A tag runs to the first `>` outside quotes, so a raw `<`,
// `>` or `</svg>` inside a value (Astro keeps all three raw in expression
// attributes) does not end it. A quote still open at the end of the input stops
// the scan, and every search moves forward, so a malformed page can't make it
// quadratic.
function readMarkup(
  html: string,
  { foreign, noscriptRaw }: Reading,
): { tags: Tag[]; decoded: string[] } {
  const tags: Tag[] = [];
  const decoded: string[] = [];
  let i = 0;
  let svgDepth = 0;
  // First match of `pattern` (a global regex) at or after `from`, or -1.
  const find = (pattern: RegExp, from: number) => {
    pattern.lastIndex = from;
    const m = pattern.exec(html);
    return m ? m.index + m[0].length : -1;
  };
  const endOfComment = (from: number) => {
    if (html.startsWith(">", from)) return from + 1; // <!-->
    if (html.startsWith("->", from)) return from + 2; // <!--->
    const end = find(/--!?>/g, from);
    return end === -1 ? html.length : end;
  };
  const afterNext = (char: string, from: number) => {
    const at = html.indexOf(char, from);
    return at === -1 ? html.length : at + 1;
  };
  for (;;) {
    const lt = html.indexOf("<", i);
    if (lt === -1) break;
    i = lt;
    if (html.startsWith("<!--", i)) {
      i = endOfComment(i + 4);
      continue;
    }
    if (html.startsWith("<![CDATA[", i) && svgDepth > 0) {
      const end = find(/\]\]>/g, i + 9);
      i = end === -1 ? html.length : end;
      continue;
    }
    // A bogus comment (`<!…`, `<?…`, `</` + a non-letter) ends at the next `>`.
    if (/^<(?:[!?]|\/(?![a-z]))/i.test(html.slice(i, i + 3))) {
      i = afterNext(">", i + 2);
      continue;
    }
    const head = /^<(\/?)([a-z][^ \t\n\f\r/>]*)/i.exec(html.slice(i, i + 64));
    if (!head) {
      i += 1;
      continue;
    }
    const [, closing, rawName] = head;
    const name = rawName.toLowerCase();
    const attrs: [string, string][] = [];
    let j = i + head[0].length;
    let selfClosing = false;
    // Attributes, separated by whitespace or `/`, up to `>`.
    for (;;) {
      const separators = j;
      while (j < html.length && (WS.test(html[j]) || html[j] === "/")) j++;
      if (j >= html.length) break;
      if (html[j] === ">") {
        selfClosing = j > separators && html[j - 1] === "/";
        break;
      }
      const nameStart = j;
      while (j < html.length && !WS.test(html[j]) && !/[/>=]/.test(html[j]))
        j++;
      if (j === nameStart) j++; // a stray `=` where a name starts
      const attrName = html.slice(nameStart, j).toLowerCase();
      let k = j;
      while (k < html.length && WS.test(html[k])) k++;
      if (html[k] !== "=") {
        attrs.push([attrName, ""]);
        continue;
      }
      k++;
      while (k < html.length && WS.test(html[k])) k++;
      let valueEnd: number;
      let raw: string;
      if (html[k] === '"' || html[k] === "'") {
        const close = html.indexOf(html[k], k + 1);
        if (close === -1) return { tags, decoded };
        raw = html.slice(k + 1, close);
        valueEnd = close + 1;
      } else {
        valueEnd = k;
        while (
          valueEnd < html.length &&
          !WS.test(html[valueEnd]) &&
          html[valueEnd] !== ">"
        )
          valueEnd++;
        raw = html.slice(k, valueEnd);
      }
      const value = decodeEntities(raw, true);
      attrs.push([attrName, value]);
      decoded.push(value);
      j = valueEnd;
    }
    i = Math.min(j + 1, html.length);
    if (!closing) tags.push({ name, attrs });
    if (foreign && (name === "svg" || name === "math")) {
      // A self-closing `<svg/>` opens nothing.
      if (closing || !selfClosing)
        svgDepth = Math.max(0, svgDepth + (closing ? -1 : 1));
      continue;
    }
    if (closing) continue;
    if (svgDepth > 0 && name === "style") {
      if (selfClosing) continue;
      // The text runs to `</style`, or, with none, to the end of the SVG.
      let end = find(/<\/style(?=[ \t\n\f\r/>])/gi, i);
      if (end !== -1) end -= "</style".length;
      else end = find(/<\/svg/gi, i) - "</svg".length;
      if (end < 0) end = html.length;
      decoded.push(decodeEntities(html.slice(i, end), false));
      i = end;
    } else if (
      svgDepth === 0 &&
      (RAW_TEXT.has(name) || (noscriptRaw && name === "noscript"))
    ) {
      const end = find(new RegExp(`</${name}(?=[ \\t\\n\\f\\r/>])`, "gi"), i);
      i = end === -1 ? html.length : end - `</${name}`.length;
    }
  }
  return { tags, decoded };
}

/** Every off-site URL that `source` (HTML or CSS) makes the browser request. */
export function findOffSiteRequests(source: string, ownHost: string): string[] {
  const found = new Set<string>();
  const add = (url: string) => {
    if (isOffSite(url, ownHost)) found.add(url.trim());
  };

  // The union of every reading: a reading that loses sync with the browser can
  // only hide a request from itself, not from the others.
  const tags: Tag[] = [];
  const decoded: string[] = [];
  for (const foreign of [true, false]) {
    for (const noscriptRaw of [false, true]) {
      const read = readMarkup(source, { foreign, noscriptRaw });
      // Not `push(...)`: a page with 100k tags would overflow the call stack.
      for (const tag of read.tags) tags.push(tag);
      for (const text of read.decoded) decoded.push(text);
    }
  }
  for (const { name, attrs } of tags) {
    const get = (...names: string[]) =>
      attrs.filter(([n]) => names.includes(n)).map(([, v]) => v);
    for (const v of get("src", "poster")) add(v);
    for (const v of get("srcset")) {
      for (const candidate of v.split(","))
        add(candidate.trim().split(/\s+/)[0]);
    }
    if (name === "link" && get("rel").some((v) => FETCHING_REL.test(v))) {
      for (const v of get("href")) add(v);
    }
    // `href` on SVG <image> and <use> loads a resource.
    if (name === "image" || name === "use") {
      for (const v of get("href", "xlink:href")) add(v);
    }
  }

  // The source as written (CSS, a plain `<style>`) plus the decoded values.
  const text = `${source}\n${decoded.join("\n")}`;
  // A quoted or unquoted url(), `\` escapes included; no part can match the
  // same text twice, so a malformed page can't make the scan quadratic.
  for (const [, dq, sq, bare] of text.matchAll(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|((?:[^"'()\s\\]|\\.)+))\s*\)/gi,
  )) {
    add(dq ?? sq ?? bare);
  }
  for (const [, url] of text.matchAll(/@import\s+["']([^"']+)["']/gi)) {
    add(url);
  }
  return [...found];
}
