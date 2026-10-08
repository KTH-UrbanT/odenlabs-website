---
id: T34
title: "Off-site guard: region-free tag pass, split svg/math depth, pin T33 fixes with tests, linear SVG style run"
layer: "tests"
deps: ["T33"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-08 F7-01, F7-02, F7-03"
status: "todo"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T34 — Off-site guard: region-free tag pass and test adequacy

Follow-up from the seventh review ([`_review/review-2026-10-08.md`](../_review/review-2026-10-08.md)). ACs: none (spec §6 NFR: third-party requests 0).

T33 reads the page under four readings, but each reading covers the whole page. A page that needs different readings in
different places loses sync in all four, and the comment at `src/lib/offsite-requests.ts:250-251` ("can only hide a request
from itself") is then false. Every input below was checked against parse5 (the browser fetches the image) and returns `[]` at HEAD.

## Checklist

- [ ] F7-01 Add a fifth, region-free pass unioned with the four readings: for every `<name`, read the attributes only up to the next `>` (the pre-T31 shape), with no quote or region state carried between tags. Result stays additive.
      Repros: `<svg><title><script>x='<span title="';</script><img src="https://t.example.com/p.png"></title></svg>`;
      `<svg><style><img src="https://t.example.com/p.png"></style></svg>`;
      `<div><svg><path d="M0"></div><script>x='<span title="';</script><svg><style/></svg><img src="https://t.example.com/p.png">`;
      `<svg><p><script>x='<span title="';</script><svg><style>.a{background:url(&quot;https://t.example.com/p.png&quot;)}</style></svg>`;
      `<svg><style><!-- </style><a title=" --></style></svg><img src="https://t.example.com/p.png">` and the `<![CDATA[ … ]]>` form.
- [ ] F7-01 Count `svg` and `math` depth separately and lower a count only on its own end tag. Repro: `<svg></math><script><img src="https://t.example.com/p.png"></script></svg>`.
- [ ] F7-01 Match the tag head (`src/lib/offsite-requests.ts:160`) with a sticky regex and no 64-character limit. Repro: `<` + `"a".repeat(70)` + `='><img src="https://t.example.com/p.png">`.
- [ ] F7-01 Correct the comment at `:250-251` and the closure wording at spec §8 so they state what the union guarantees.
- [ ] F7-02 One isolating test row per surviving mutant (each input is reported by the original, missed by the mutant, and fetched per parse5):
      `<svg/><script>x='<span title="';</script><svg><title><img src="https://t.example.com/p.png"></title></svg>` (the `<svg/>` guard);
      `<svg data-x=a/><title><img src="…"></title></svg>` (`j > separators`);
      `<svg><style>.a{}</SVG><img src="…">` (case-insensitive `</svg`);
      `<img\tsrc="…">` and `<img\fsrc="…">` (HTML whitespace); `<script ><img src="…">` (head regex);
      `<a title=x ="><img src="…">` (unquoted value end); `<math><title><img src="…"></title></math>`;
      `<svg><style/><image href="…"/></svg>` (`selfClosing` skip);
      `<svg><p><script>x='<span title="';</script><div style="background:url(&quot;…&quot;)"></div>` (decoded values from every reading).
      Re-run the 26-mutant check on a copy; none may survive.
- [ ] F7-03 Make the SVG `<style>` end search linear: remember the last `</style`/`</svg` position, or that none exists after it, and reuse it. Add `"<svg><style></SVG".repeat(n)` and `"<svg><style></svg>".repeat(n)` (1 MB) to the linear-time test; each stays under 1 s.
- [ ] Keep every T29/T31/T33 case and the "checked and sound" lists of the 6th and 7th reviews passing.

## Definition of Done

- [ ] each repro above reports its URL; own-host and relative URLs, `&Colon;` and the current build still report nothing
- [ ] no mutant in the T34 list survives; the slowest 1 MB input is under 1 s
- [ ] `npm run lint && npm test` clean
