---
id: T40
title: "Off-site guard: one whitespace rule in the legacy scan, no swallowed values, true comments, mutant rows"
layer: "tests"
deps: ["T38"]
acs: []
files_hint: ["src/lib/offsite-requests.ts", "tests/offsite-requests.test.ts"]
owner: "pasichnyi"
source: "review-2026-10-09-2 J10-01, J10-02, J10-03, J10-04"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T40 — Off-site guard: legacy scan whitespace, wording, mutant rows

Follow-up from the tenth review ([`_review/review-2026-10-09-2.md`](../_review/review-2026-10-09-2.md)). ACs: none (spec §6 NFR: third-party requests 0).

## Checklist

- [x] J10-01 `attrPattern` starts a match at `\s` (`src/lib/offsite-requests.ts:418`), which includes NBSP, `\v` and U+3000, but `followsAttribute` walks back over HTML whitespace (`WS`) only (`:425-433`). Every match then rescans the run back to the last HTML whitespace, and a quote behind an NBSP lands inside the "token" and rejects a request pre-T31 reported.
      Start matches at HTML whitespace only (`(?:^|[ \t\n\f\r])`: the browser never reads NBSP or `\v` as an attribute separator, so this drops only over-reports) and walk back over `\s` in `followsAttribute` (whitespace run and token boundary). Keep both on one rule.
      Repros: `<svg><style><img alt="a > b"` + U+00A0 + ` src="https://t.example.com/p.png"></style></svg>` reports its URL (parse5 fetches it; pre-T31 and pre-T38 report it).
      Add to the linear-time test (each under `LINEAR_BUDGET_MS`): `" src=x".repeat(170000)`, `"\vsrc=x".repeat(170000)`, `"　src=x".repeat(130000)`, `"word src=x ".repeat(90000)`.
- [x] J10-02 A rejected candidate still uses up its value, so a stray `src='` inside a quoted value of the other quote type swallows the real attribute. Put the value in a lookahead (`(?:start)name(?=VALUE)`, capture groups inside it) so a match consumes only the name.
      Repros: `<svg><style><img alt='a > src="b' src="https://t.example.com/p.png"></style></svg>`; `<svg><style><img alt="a > b it's src='x" src="https://t.example.com/p.png"></style></svg><p>it's</p>`.
      Re-run the 4 MB adversarial quote runs: still linear.
- [x] J10-03 Make the comments true. Module header (`:5-13`): drop "so that no misreading of the page can hide a request"; add the false-positive class "a word or boolean attribute before `src=`/`poster=`/`srcset=` in page text or inline code" (`<iframe hidden src="https://…">`, `<video controls poster=…>`, `<img loading=lazy src=https://…>` in Markdown inline code). `legacyUrls` comment (`:405-415`) and spec §8 R6-02: list the residuals — a quoted `>` before the `rel`/`href` of `<link>`/`<image>`/`<use>`, a `style` attribute after a quoted `>`, and `src`/`poster`/`srcset` after a `/` separator or after an unquoted value holding `&`, `;` or a quote (pre-T31 caught the last group) — and say the whitespace rule drops NBSP/`\v` directly before the name.
- [x] J10-04 One isolating row per surviving mutant (each input is fetched per parse5, reported at HEAD, `[]` under the mutant):
      `/` added to the forbidden set: `<svg><style><img alt="a > b" data-path=/a/b src="https://t.example.com/p.png"></style></svg>`;
      token boundary only at a space: `<svg><style><img alt="a > b"` + newline + `hidden src="https://t.example.com/p.png"></style></svg>`;
      tokens capped at 16 characters: `<svg><style><img alt="a > b" data-decorative-image src="https://t.example.com/p.png"></style></svg>`;
      legacy scan flag `gi` → `g`: `<svg><style><IMG ALT="a > b" SRC="https://t.example.com/p.png"></style></svg>`;
      `attrPattern` default flag `i` → none: `<svg><title><script>x='<span title="';</script><LINK alt="a<b" REL="stylesheet" HREF="https://t.example.com/p.png"></title></svg>`;
      no `\s*` before `=`: `<svg><style><img alt="a > b" src = "https://t.example.com/p.png"></style></svg>`.
      Replace the `<svg><style><video … poster>` row (`<video>` stays in the SVG namespace; nothing is fetched) with `<svg><title><script>const t = '<span title="';</script><video title="a > b" controls poster="https://t.example.com/p.png"></video></title></svg>`.
      Re-run the mutant check; none may survive that hides a request (the forbidden-character checks are individually redundant and only add reports).
- [x] Keep every T29/T31/T33/T34/T36/T38 case passing.

## Definition of Done

- [x] each repro above reports its URL; own-host and relative URLs, `&Colon;`, escaped page text (`&lt;img src="…"&gt;`), a plain `<style>` with `&quot;` and text after a closed SVG still report nothing; the current build reports nothing
- [x] no mutant in the T40 list survives; the new linear-time inputs stay under 4 s (expected under 0.1 s); `npm test` passes three times in a row
- [x] `npm run lint && npm test` clean
