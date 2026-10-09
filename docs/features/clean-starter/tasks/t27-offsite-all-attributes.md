---
id: T27
title: "Off-site guard: decode every attribute value and the remaining entity forms"
layer: "tests"
deps: ["T24"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-04-3 F-2, R3-01, R3-02, R3-04"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T27 — Off-site guard: decode every attribute value and the remaining entity forms

Follow-up from the review: [`_review/review-2026-10-04-3.md`](../_review/review-2026-10-04-3.md). ACs: none (spec §6 NFR: third-party requests 0) — full text in [spec.md §5](../spec.md).

T24 decodes entities only inside `style` attributes (`src/lib/offsite-requests.ts:75-82`). Astro 7 also writes
CSS values into other attributes with encoded quotes, e.g. `<path mask={'url("https://m.example.com/m.svg#m")'}>`
builds to `mask="url(&quot;https://m.example.com/m.svg#m&quot;)"` (same for `filter`, `fill`, `clip-path`), and
`findOffSiteRequests` returns `[]`. A `<style>` inside an inline `<svg>` is foreign content, so the browser decodes
its entities too. The decoder (`:31`) also needs a closing `;` and knows five named entities; browsers decode
`&#34https…` and `&colon;`/`&sol;`. Unquoted `style=` values are not decoded (`:76`).

## Checklist

- [x] Decode every attribute value — double-quoted, single-quoted and unquoted — before the `url()` / `@import` pass, not only `style`. Text nodes stay undecoded (the prose test at `tests/offsite-requests.test.ts:89-93` must keep passing).
- [x] Decode the text of `<style>` elements inside `<svg>`.
- [x] Numeric entities match with an optional `;` (`&#(\d+);?`, `&#x([0-9a-f]+);?`); add `colon`, `sol`, `lpar`, `rpar`, `period`, `Tab`, `NewLine` to the named set. No double decoding (`&amp;quot;` stays `&quot;`); invalid code points don't throw.
- [x] Unit cases, each reported: Astro's exact `mask="url(&quot;https://m.example.com/m.svg#m&quot;)"`; `<svg><style>…url(&quot;https://…&quot;)</style></svg>`; `url(&#34https://d.example.com/x&#34)`; `url(&quot;https&colon;&sol;&sol;e.example.com/x&quot;)`; an unquoted `style=background:url(&quot;https://c.example.com/x&quot;)`.
- [x] R3-04: a single-quoted `style='background:url(&quot;https://b.example.com/x&quot;)'` case and a hex `url(&#x22;https://h.example.com/x&#x22;)` case, both reported. Check that removing either decode branch now fails a test.

## Definition of Done

- [x] every case above is reported; own-host and relative encoded `url()` still not reported; the current build still passes
- [x] `npm run lint && npm test` clean
