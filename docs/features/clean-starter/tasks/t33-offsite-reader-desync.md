---
id: T33
title: "Off-site guard: reader desync (self-closing svg, foreign content, HTML whitespace)"
layer: "tests"
deps: ["T31"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-07 R6-02"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T33 — Off-site guard: reader desync

Follow-up from the sixth review, finding R6-02 ([`_review/review-2026-10-07.md`](../_review/review-2026-10-07.md), spec §8). ACs: none (spec §6 NFR: third-party requests 0).

Since T31 the `src`/`srcset`/`poster`/`<link>`/`<image>`/`<use>` checks read only the tag list from `readMarkup`
(`src/lib/offsite-requests.ts`). When the reader loses sync with the browser, a request the pre-T31 scan reported is hidden.
A self-closing `<svg …/>` raises `svgDepth` and nothing lowers it, after which `<script>`/`<textarea>`/`<title>` text is
read as markup and an odd quote swallows a later `<img src>`.

## Checklist

- [x] A self-closing start tag (`/` right before `>`, not inside an unquoted value) does not raise the SVG depth and does not start an SVG `<style>` text run.
      Repro: `<svg/><script>const t = '<span title="';</script><img src="https://tracker.example.com/pixel.png">`.
- [x] Run the reader under more than one reading of the page and union the tag lists and decoded values (the result stays additive):
      foreign content on (`<svg>`, `<math>` raise the depth) and off (HTML only), `<noscript>` as markup and as raw text (scripting on).
      Repros: `<svg><foreignObject><script>x='<span title="';</script><img src="https://t.example.com/p.png"></foreignObject></svg>`;
      `<math><desc>`-style and `<svg><p>` breakouts followed by a script with an odd quote and an `<img src>`;
      `<noscript><script>x='<a title="'</script></noscript><img src="https://t.example.com/p.png">`.
- [x] `</SVG>` in upper case ends the unterminated-`<style>` fallback (`indexOf("</svg")` is case-sensitive).
- [x] Whitespace is HTML whitespace only (tab, LF, FF, CR, space): NBSP before a quote is part of an unquoted value.
      Repro: `<a title= "><img src="https://t.example.com/p.png">` reports the image.
- [x] Keep every T29/T31 case and the review's "checked and sound" list passing; every scan stays linear (< 1 s on the existing pathological inputs, with the extra passes).

## Definition of Done

- [x] each repro above reports its URL; own-host and relative URLs, `&Colon;` and the current build still report nothing
- [x] `npm run lint && npm test` clean
