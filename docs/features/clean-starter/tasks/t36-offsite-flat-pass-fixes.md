---
id: T36
title: "Off-site guard: linear flat pass, pre-T31 sixth member, flat-pass accuracy, mutant rows"
layer: "tests"
deps: ["T34"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-08-2 G8-01, G8-02, G8-03, G8-04"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T36 — Off-site guard: flat-pass fixes

Follow-up from the eighth review ([`_review/review-2026-10-08-2.md`](../_review/review-2026-10-08-2.md)). ACs: none (spec §6 NFR: third-party requests 0).

## Checklist

- [x] G8-01 `readFlat` is quadratic on `"<a".repeat(n)` (2 s at 100 KB, about 14 min at 1 MB). Stop the flat tag name at `<` too (a flat-only name regex, or cap the scan at the next `<`); the inner `<` gets its own iteration.
      Add to the linear-time test (1 MB each, under 1 s): `"<a".repeat(500000)`, `'<a"'.repeat(333334)`, `"<a=".repeat(333334)`, `"<svg<".repeat(200000)`.
- [x] G8-02 The flat pass cuts a tag at the first raw `>` or `<` even inside quotes, so the pre-T31 scan reports requests it loses. Add a sixth member: the pre-T31 global attribute scans (`src`/`poster`/`srcset` after whitespace, the `<link …>` and `<image|use …>` regexes) over the whole source (take them from `git show 330d079:src/lib/offsite-requests.ts`). Linear; additivity to pre-T31 then holds by construction.
      Repros (each fetched per parse5, `[]` at HEAD): `<svg><style><img alt="a > b" src="https://t.example.com/p.png"></style></svg>`;
      `<svg><style><img alt="<" src="…"></style></svg>`;
      `<svg><title><script>x='<span title="';</script><img alt="a > b" src="…"></title></svg>`;
      `<svg><style><img title="</style>" src="…"></style></svg>`;
      `<svg><title><script>x='<span title="';</script><img alt="</svg>" src="…"></title></svg>`;
      `<svg><style><!-- </style><a title=" --></style></svg><img alt="a<b>" src="…">`.
- [x] G8-03 Flat-pass accuracy: (a) count `svg` and `math` separately and take `selfClosing` from `readAttributes` (so `<svg data-x=a/>` opens an SVG); (b) end the flat style run at the first `</style` or `</svg`/`</math`, as `readMarkup` does (`<svg><style>.a{}</svg><p>url(&quot;https://x.example.com/a.png&quot;)</p>` reports nothing); (c) widen the trade-off wording to "text the browser doesn't parse as tags: comments, script/style/textarea/title text, attribute values holding markup" in the code comment, the module header (`src/lib/offsite-requests.ts:1-3`) and spec §8 R6-02.
      Repro for (a): `<svg><p><script>x='<span title="';</script></math><svg></math><style>.a{background:url(&quot;https://t.example.com/p.png&quot;)}</style></svg>`.
- [x] G8-04 One isolating test row per surviving mutant (each input is fetched per parse5, reported at HEAD, `[]` under the mutant):
      63-character tag-name limit: `<` + `"a".repeat(70)` + `='><img alt=">" src="https://t.example.com/p.png">` through `readMarkup(html, foreignOn)`;
      `noStyleEnd` always true in `readMarkup`: `<svg><style>.a{}</style><title><img alt=">" src="…"></title></svg>` through `readMarkup(html, foreignOn)`;
      `styleDone = html.length`: `<svg><style>.a{}</style></svg><svg><p><script>x='<span title="';</script><svg><style>.a{background:url(&quot;…&quot;)}</style></svg>`;
      case-sensitive `style` in `readFlat`: the same with `<STYLE>…</STYLE>`;
      `foreign > 1`: `<div><svg><path d="M0"></div><script>x='<span title="';</script></svg><svg><style>.a{background:url(&quot;…&quot;)}</style></svg>`;
      decoded values from the first reading only: `<noscript><p title="</noscript><div title='<' style="background:url(&quot;https://t.example.com/p.png&quot;)"></div>` through `findOffSiteRequests`.
      Re-run the mutant check; none may survive (R6-03's known survivors excepted).
- [x] Keep every T29/T31/T33/T34 case passing.

## Definition of Done

- [x] each repro above reports its URL; own-host and relative URLs, `&Colon;`, escaped page text, a plain `<style>` with `&quot;` and text after a closed SVG still report nothing; the current build reports nothing
- [x] no mutant in the T36 list survives; the slowest 1 MB input is under 1 s
- [x] `npm run lint && npm test` clean
