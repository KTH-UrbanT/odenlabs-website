---
id: T29
title: "Off-site guard: quote-aware tag scan, legacy entities, exact-case names, linear url() scan"
layer: "tests"
deps: ["T27"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-04-4 R4-01, R4-02, R4-03, R4-04, R4-07"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T29 — Off-site guard: quote-aware tag scan, legacy entities, exact-case names, linear url() scan

Follow-up from the review: [`_review/review-2026-10-04-4.md`](../_review/review-2026-10-04-4.md). ACs: none (spec §6 NFR: third-party requests 0) — full text in [spec.md §5](../spec.md).

T27 scans tags with `"[^"<]*"|'[^'<]*'` (`src/lib/offsite-requests.ts:113`) and SVG/style tags with
`<(\/?)(svg|style)\b[^<>]*>` (`:64`). The comment at `:109-110` assumes built attribute values carry `<` as
`&lt;`. That is wrong: Astro 7 keeps `<` and `</svg>` raw in expression attributes, and Markdown raw HTML keeps
`<` raw too. Real Astro output `<div class="card" title="Jane <PI>" style="background-image:url(&quot;https://cdn.example.com/jane.jpg&quot;)"></div>`
returns `[]`; the T24 code reported it (regression). `</svg>` in an attribute ends the SVG depth early, `<` in an
`<svg>` attribute stops `:64` matching, and `/` between attributes (`<path/mask="…"/>`) is not a separator (`:115`).

## Checklist

- [ ] R4-01: replace both regex scans with one forward scan of each tag that respects quotes. After `<[a-zA-Z]` or `</`, step through characters and skip quoted runs until a `>` outside quotes. If a quote is still open at EOF, stop the whole scan, which keeps it linear. Track SVG depth and `<style>` in the same scan. Treat whitespace **and `/`** as attribute separators. Correct the comment at `:109-110`.
- [ ] R4-01 cases, each reported: the Astro card above; `<div title="1 < 2" style='background:url("https://x.example.com/a")'>`; `<svg aria-label="a</svg>b"><style>.a{fill:url(&quot;https://o.example.com/p#p&quot;)}</style></svg>`; `<svg aria-label="a<b"><style>.a{fill:url(&quot;https://s.example.com/p#p&quot;)}</style></svg>`; `<svg><path/mask="url(&quot;https://m.example.com/m#m&quot;)"/></svg>`.
- [ ] R4-02: decode the legacy names `quot`, `amp`, `lt`, `gt` (and `QUOT`, `AMP`, `LT`, `GT`) without `;`. In attribute values, follow the browser rule: do not decode when the next character is `=` or alphanumeric. In SVG `<style>`, always decode. Cases reported: `<div style="background:url(&quot https://a.example.com/x&quot)">`, `<div style="background:url(&quot//lq.example.com/x&quot)">`, `<svg><style>.a{fill:url(&quothttps://b.example.com/p#p&quot)}</style></svg>`.
- [ ] R4-03: key `NAMED` by exact name (`quot`, `QUOT`, `amp`, `AMP`, `lt`, `LT`, `gt`, `GT`, `apos`, `colon`, `sol`, `lpar`, `rpar`, `period`, `Tab`, `NewLine`) and drop `toLowerCase` (`:46`). Cases not reported: `url(&quot;https&Colon;//d.example.com/x&quot;)`, `url(&quot;https:&SOL;&SOL;e.example.com/x&quot;)`.
- [ ] R4-07: make the `url()` pattern (`:121`) linear on input with no `)`: exclude `(` from the capture class (`[^"'()]*?`) or cap its length. Test: `"url(".repeat(200000)` finishes in under 1 s.
- [ ] R4-04, cover the branches that survived mutation:
  - a hex reference without `;` (`url(&#x22https://h2.example.com/x&#x22)`), reported;
  - one case each for `&lpar;`, `&rpar;`, `&period;`, `&Tab;`, `&NewLine;`;
  - a plain `<style>…url(&quot;https://s.example.com/x&quot;)…</style>` is **not** reported, and neither is a `<style>` after a closed `</svg>`;
  - uppercase `<DIV STYLE=…>` and `<SVG><STYLE>…</STYLE></SVG>`, reported;
  - prose with a `name=`-like run (`<p>Set style=url(&quot;https://x.example.com/a&quot;) here</p>`) is **not** reported.
  - Re-run the mutants listed in the review record and check that each one now fails a test.

## Definition of Done

- [ ] every case above behaves as stated; own-host and relative encoded `url()` still not reported; the current build still passes; the new scans stay linear on the pathological inputs from the review (≈1 MB each, < 200 ms)
- [ ] `npm run lint && npm test` clean
