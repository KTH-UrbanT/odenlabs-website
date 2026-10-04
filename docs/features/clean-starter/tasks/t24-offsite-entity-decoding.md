---
id: T24
title: "Catch entity-encoded url() in style attributes"
layer: "tests"
deps: ["T17"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-04-2 R-01"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T24 — Catch entity-encoded url() in style attributes

Follow-up from the review: [`_review/review-2026-10-04-2.md`](../_review/review-2026-10-04-2.md). ACs: none (spec §6 NFR: third-party requests 0) — full text in [spec.md §5](../spec.md).

Astro writes the quotes inside a `style` attribute as `&quot;`, so the built page carries
`style="background-image:url(&quot;https://bg.example.com/z.jpg&quot;)"`. The `url()` pattern at
`src/lib/offsite-requests.ts:49-53` captures `&quot;https://…&quot;`, which fails the `^(https?:)?//` test in
`isOffSite` (line 11), so the guard returns `[]` for a live third-party request.

## Checklist

- [x] Decode HTML entities in attribute values and inline style text before matching (at least `&quot;`, `&#34;`, `&#39;`, `&apos;`, `&amp;`).
- [x] Unit test in `tests/offsite-requests.test.ts` with the exact string Astro emits (above); it must be reported.
- [x] Unit test that an entity-encoded own-host or relative `url()` is not reported.

## Definition of Done

- [x] a unit case with Astro's exact `url(&quot;https://…&quot;)` output is reported; current build still passes
- [x] `npm run lint && npm test` clean
