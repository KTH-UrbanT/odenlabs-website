---
id: T38
title: "Off-site guard: legacy scan after bare attributes, mutant rows, module header, stable time budget"
layer: "tests"
deps: ["T36"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-09 H9-01, H9-02, H9-03, H9-04"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T38 — Off-site guard: legacy scan and tests

Follow-up from the ninth review ([`_review/review-2026-10-09.md`](../_review/review-2026-10-09.md)). ACs: none (spec §6 NFR: third-party requests 0).

## Checklist

- [x] H9-01 `legacyUrls` counts `src`/`poster`/`srcset` only right after a closing quote (`(?<=["'])\s+`, `src/lib/offsite-requests.ts:409`). A bare or unquoted attribute before it hides it. Also accept a match whose preceding whitespace follows an attribute-like token (a bare name, or `name=value` with no `&`, `;`, `<` or quote, itself preceded by whitespace): check it in code after a `(?:^|\s)src…` match so the look-back is bounded by that token and the scan stays linear. Escaped page text (`&lt;img src="…"&gt;`) stays unreported.
      Repros (parse5 fetches the URL; `[]` at HEAD; pre-T31 reports it):
      `<svg><style><img alt="a > b" hidden src="https://t.example.com/p.png"></style></svg>`;
      `<svg><style><img alt="a < b" class=x src="…"></style></svg>`;
      `<svg><style><img alt='a > b' width=10 srcset="… 2x"></style></svg>`;
      `<svg><title><script>x='<span title="';</script><img alt="a > b" hidden src="…"></title></svg>`;
      `<svg><style><img alt="a > b" data-x src="…"></style></svg>`; `<svg><style><video title="a > b" controls poster="…"></video></style></svg>`.
      Correct the comment at `:396-401` ("no region, quote or `>` before it can hide it", "Astro quotes every attribute") and name what stays uncovered: a quoted `>` before a `<link>`/`<image>`/`<use>` rel/href, and a `style` attribute after a quoted `>` in a misread page (pre-T31 missed both).
- [x] H9-02 One isolating test row per surviving mutant (each input is fetched per parse5, reported at HEAD, `[]` under the mutant); use `legacyUrls` directly:
      the cached `>` never refreshed (`if (gt === -1)`): `<link rel="icon" href="/favicon.svg"><svg><style><image alt="a<b" href="https://t.example.com/p.png"/></style></svg>`;
      reading only the last start of a group: `<svg><style><image alt="a<b" href="https://t.example.com/p.png" title="<use "/></style></svg>`;
      attributes capped at 64 characters: `<svg><style><image alt="a<b" class="icon icon-large decorative" width="24" height="24" href="https://t.example.com/p.png"/></style></svg>`;
      a single space for `\s+`: `<svg><style><img alt="a > b"` + newline + `     src="https://t.example.com/p.png"></style></svg>`;
      lookahead dropped from `</(?:style|svg|math)`: `<svg><title><script>x='<span title="';</script></title><style>.a{} </svgx> .b{background:url(&quot;https://t.example.com/p.png&quot;)}</svg>`.
      Replace the two union rows that use `<svg><style><link …>` (the `<link>` is in the SVG namespace; nothing is fetched) with `<svg><title><script>x='<span title="';</script><link alt="a<b" rel="stylesheet" href="https://t.example.com/p.png"></title></svg>`.
      Re-run the mutant check; none may survive (R6-03's known survivors excepted).
- [x] H9-03 Widen the module header (`src/lib/offsite-requests.ts:3-5`) to the spec §8 R6-02 trade-off list: comments, script/style/textarea/title text, attribute values holding markup, and a quoted `"x" src="…"` in page text, with Markdown inline code (`` `<img alt="x" src="https://…">` ``, rendered with raw quotes) named as the likeliest case and a hint on what to do (the build test names the offending file; wrap or move the example).
- [x] H9-04 Raise the wall-clock budget of every linear-time test (`tests/offsite-requests.test.ts`, the T33, T34 and T36 blocks) from 1000 ms to 4000 ms, keep the 1 MB inputs, and say why in a comment (a quadratic path takes minutes). Update the DoD wording of T34 and T36 to the measured bound.
- [x] Keep every T29/T31/T33/T34/T36 case passing.

## Definition of Done

- [x] each repro above reports its URL; own-host and relative URLs, `&Colon;`, escaped page text, a plain `<style>` with `&quot;` and text after a closed SVG still report nothing; the current build reports nothing
- [x] no mutant in the T38 list survives; `npm test` passes five times in a row
- [x] `npm run lint && npm test` clean
