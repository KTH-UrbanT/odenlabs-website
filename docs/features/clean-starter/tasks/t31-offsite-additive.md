---
id: T31
title: "Off-site guard: additive decoding, one attribute reader, browser-accurate regions"
layer: "tests"
deps: ["T29"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-05-5 F5-01, F5-02, F5-03, F5-04, F5-05"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T31 — Off-site guard: additive decoding, one attribute reader, browser-accurate regions

Follow-up from the review: [`_review/review-2026-10-05-5.md`](../_review/review-2026-10-05-5.md). ACs: none (spec §6 NFR: third-party requests 0) — full text in [spec.md §5](../spec.md).

T29's `decodeMarkup` (`src/lib/offsite-requests.ts:98-172`) **replaces** the source with a rebuilt copy. Each tag is
rebuilt with separators dropped (`:127`), so the `url()`/`@import` scans (`:198-208`), which read only the rebuilt
text, miss anything the rebuild mangles. It also runs over built `.css` (`tests/build.test.ts:173-176`), where a
minified range query `@media (40rem<width<60rem)` starts a "tag" that eats the `//` of every later URL. The
`<link>` (`:181`) and `<image|use>` (`:187`) scans still use `[^>]*` and `attr()` (`:68-70`), so a raw `>` in an
earlier quoted value (Astro emits it raw in expression attributes) or a `/` separator hides the `href`. These scans are
quadratic when no `>` follows.

## Checklist

- [ ] F5-01: make decoding additive. `decodeMarkup` returns only the decoded attribute values and decoded SVG `<style>`
      text; run the `url()`/`@import` scans over `source + "\n" + decoded`. Fix the comment at `:87-92` (it is given CSS too).
      Cases reported: `@media (40rem<width<60rem){.b{color:red}}.hero{background:url(//cdn.example.com/hero.jpg)}`;
      the same with `@import "https://fonts.example.com/a.css";`; `@container (40rem<width<60rem){}.b{background:url(https://x.example.com/b)}.c>.d{}`;
      `.f:before{content:"<b"}.g{background:url(https://cdn.example.com/g.png)}`.
- [ ] F5-02/F5-03: have the tag reader collect each tag's name and decoded attributes, and run the `src`, `srcset`,
      `poster`, `<link rel/href>` and `<image>`/`<use>` `href` checks over that list instead of the whole-source regexes
      (one attribute parser). Cases reported: `<link title="Jane > PI" rel="stylesheet" href="https://c.example.com/x.css">`;
      `<svg><image title="Jane > PI" href="https://d.example.com/x.png"/></svg>`; `<img/src="https://x.example.com/a.png">`;
      `<link/rel="stylesheet"/href="https://x.example.com/a.css">`; `<svg><image/href="https://x.example.com/a.png"/></svg>`.
      Linear-time tests: `"<link ".repeat(200000)`, `"<use ".repeat(200000)`, `"<image ".repeat(200000)` each under 1 s.
      Fix the comment at `:94-96`.
- [ ] F5-04: end regions where the browser does. `D` = `<div style="background:url(&quot;https://x.example.com/a&quot;)"></div>`; each reported:
  - drop `noscript` from `RAW_TEXT` (`:75-85`): `<noscript>D</noscript>`;
  - comments end at `<!-->`, `<!--->` and `--!>`: `<!--> D <!-- c -->`, `<!---> D`, `<!-- a --!> D`;
  - `<!` (not `<!--`), `<?` and `</` + non-letter are bogus comments ending at the next `>`: `<![CDATA[ <a title=" ]]> D`, `</ <a title="> D`;
    inside SVG, CDATA ends at `]]>`: `<svg><![CDATA[ <a title=" ]]></svg>D`;
  - end tags need `[\s/>]` after the name (raw-text and SVG `</style`): `<script>a="</scripts>";b='<a title="'</script>D`;
  - an SVG `<style>` without `</style` decodes up to the next `</svg` (or EOF) and the scan continues: `<svg><style>.a{}</svg>D`;
  - escapes in an unquoted `url()` (`:202`, e.g. `((?:[^"'()\s\\]|\\.)+)`): `url(https://ep.example.com/a\(b)`.
- [ ] F5-05: one test row per mutant that hid a request in the review: whitespace before `=` (`<div style ="…">`) and after
      (`<div style= "…">`); `</svg><svg><style>.a{fill:url(&quot;https://x.example.com/a&quot;)}</style></svg>` (svgDepth clamp);
      `<SCRIPT>if (a<b) s = 'x</SCRIPT>` + `D`; `<textarea><a title="</textarea>` + `D` (and one per remaining `RAW_TEXT` entry);
      legacy rule `&quot=` / `&quot1` not decoded in an attribute. Fix the comment at `:74` (`title`/`textarea` are RCDATA:
      "whose text the browser does not parse as tags").
- [ ] Keep every T29 case, the R4 repros and the "checked and sound" list in the review record passing; re-run the mutants
      from the review and record survivors.

## Definition of Done

- [ ] every case above behaves as stated; own-host and relative URLs still not reported; R4-03 `&Colon;` still not reported; the current build still passes; every scan stays linear on the review's ≈1 MB pathological inputs (< 200 ms, link/use/image < 1 s for 200k)
- [ ] `npm run lint && npm test` clean
