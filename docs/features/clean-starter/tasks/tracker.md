# Tracker — clean-starter

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| #   | Task                                                                                          | Layer  | Owner     | Estimate | Blocked by          | Status  |
| --- | --------------------------------------------------------------------------------------------- | ------ | --------- | -------- | ------------------- | ------- |
| T1  | Planned sections + offered-sections helpers                                                   | domain | pasichnyi | S        | —                   | done    |
| T2  | WCAG contrast check over declared pairs                                                       | domain | pasichnyi | S        | —                   | done    |
| T3  | Header renders only offered sections                                                          | ui     | pasichnyi | S        | T1                  | done    |
| T4  | Not-found page                                                                                | ui     | pasichnyi | S        | —                   | done    |
| T5  | Minimal front page                                                                            | ui     | pasichnyi | S        | — (maintainer copy) | blocked |
| T6  | Identity: palette, type, fonts, sign-off                                                      | ui     | pasichnyi | M        | T2, T4, T5          | blocked |
| T7  | Build guard: font budget (off-site half split to T17)                                         | tests  | pasichnyi | S        | T6                  | blocked |
| T8  | Publish model + rules files                                                                   | domain | pasichnyi | M        | —                   | done    |
| T9  | Planner classification and plan                                                               | domain | pasichnyi | M        | T8                  | done    |
| T10 | Planner stop-guards                                                                           | domain | pasichnyi | M        | T9                  | done    |
| T11 | Remote swap script                                                                            | infra  | pasichnyi | M        | T8                  | done    |
| T12 | Publish report (public + encrypted)                                                           | infra  | pasichnyi | M        | T8                  | done    |
| T13 | Publish shell over SSH                                                                        | app    | pasichnyi | 1d       | T1, T10, T11, T12   | done    |
| T14 | Workflow + CODEOWNERS                                                                         | wiring | pasichnyi | S        | T13                 | done    |
| T15 | Runbook + repository sweep                                                                    | docs   | pasichnyi | S        | T14                 | done    |
| T16 | Planner + swap: folder-layout clash guards (review F-01)                                      | domain | pasichnyi | M        | T10, T11            | done    |
| T17 | Build guard: zero off-site requests (split from T7, review F-02)                              | tests  | pasichnyi | S        | T4                  | done    |
| T18 | Worker failure paths, record and listing reporting (review F-03)                              | app    | pasichnyi | M        | T16                 | done    |
| T19 | Secrets boundary: CODEOWNERS + token scope (review F-04)                                      | wiring | pasichnyi | S        | T14                 | done    |
| T20 | Site checks: page rule helper, heading pair, threshold tests (review F-05)                    | ui     | pasichnyi | M        | T2, T3              | done    |
| T21 | Worker hardening: rules whitespace, timer locale, approved-in-build, limit diff (review F-06) | domain | pasichnyi | S        | T18                 | done    |
| T22 | Carry leftover owned files in the record (review F-07)                                        | app    | pasichnyi | S        | T21                 | done    |
| T23 | Docs sync after review (review F-06)                                                          | docs   | pasichnyi | S        | T16–T22             | done    |
| T24 | Off-site guard: entity-encoded `url()` in style attributes (review R-01)                   | tests  | pasichnyi | S        | T17                 | done    |
| T25 | AC-03 build test against a real section page (review R-02)                                   | tests  | pasichnyi | S        | T20                 | done    |
| T26 | Docs sync: AC-13b, ownership table, CODEOWNERS rule, failure outcomes (review R-03, R-04)    | docs   | pasichnyi | S        | T24, T25            | done    |
| T27 | Off-site guard: decode every attribute value, remaining entity forms (review F-2, R3-01/02/04) | tests  | pasichnyi | S        | T24                 | done    |
| T28 | Docs sync: AC-13b in ux-flows, AC-13b scope, traceability (review F-1, F-3, F-4)             | docs   | pasichnyi | S        | —                   | done    |
| T29 | Off-site guard: quote-aware tag scan, legacy entities, linear url() (review R4-01–04, R4-07)  | tests  | pasichnyi | M        | T27                 | done    |
| T30 | US-06 check order in ux-flows, AC-13b approved case (review R4-05, R4-06)                    | docs   | pasichnyi | S        | —                   | done    |
| T31 | Off-site guard: additive decoding, one attribute reader, regions (review F5-01–F5-05)         | tests  | pasichnyi | M        | T29                 | done    |
| T32 | US-06 malformed-path, sad Flow 5 deletion-off stops (review F5-06)                            | docs   | pasichnyi | S        | —                   | done    |
| T33 | Off-site guard: reader desync (review R6-02)                                                  | tests  | pasichnyi | M        | T31                 | done    |
| T34 | Off-site guard: region-free pass, svg/math depth, pin T33 fixes (review F7-01–F7-03)           | tests  | pasichnyi | M        | T33                 | done    |
| T35 | T33 bookkeeping and ship drafts (review F7-04)                                                | docs   | pasichnyi | S        | T34                 | done    |
| T36 | Off-site guard: flat-pass fixes, pre-T31 sixth member, mutant rows (review G8-01–G8-04)       | tests  | pasichnyi | M        | T34                 | done    |
| T37 | T35 status, tracker total, R6-02 wording (review G8-04)                                       | docs   | pasichnyi | S        | T36                 | done    |
| T38 | Off-site guard: legacy scan after bare attributes, mutant rows, header, time budget (H9-01–H9-04) | tests  | pasichnyi | M        | T36                 | done    |
| T39 | Bookkeeping after T38 (review H9-01, H9-04)                                                   | docs   | pasichnyi | S        | T38                 | done    |
| T40 | Off-site guard: legacy scan whitespace, wording, mutant rows (review J10-01–J10-04)           | tests  | pasichnyi | M        | T38                 | done    |
| T41 | Bookkeeping after T40 (review J10-03)                                                         | docs   | pasichnyi | S        | T40                 | done    |

**Total:** 41 tasks, ~19.4 person-days (S ≈ 0.3 d, M ≈ 0.7 d, 1d = 1 d).

**Blocked (2026-10-04):** T5 waits for the front-page copy (who-we-are paragraph and
contact route, spec §8). T6 waits for T5 and for the maintainer's font choice and
before/after sign-off. T7 waits for T6.

**Review follow-ups (2026-10-04):** T16–T23 done; deferrals and new due dates in spec §8.

**Review follow-ups, 2nd pass (2026-10-04):** T24–T26 done; R-05–R-09 deferred in spec §8.

**Review follow-ups, 3rd pass (2026-10-04):** T27–T28 done; R3-05 deferred and R3-03 dismissed (spec §8, review record).

**Review follow-ups, 4th pass (2026-10-04):** T29–T30 done; the embedded tab/newline case joins R-09 in spec §8.

**Review follow-ups, 5th pass (2026-10-05):** T31–T32 done; F5-01 to F5-06 closed pending the sixth pass.

**Review follow-ups, 6th pass (2026-10-07):** T33 done; R6-01, R6-03, R6-04 deferred.

**Review follow-ups, 7th pass (2026-10-08):** T34–T35 done (F7-01 to F7-04 fixed); F7-01 reopened R6-02 and T34 closes it. Re-review pending.

**Review follow-ups, 8th pass (2026-10-08):** T36–T37 done (G8-01 to G8-04 fixed); R6-02 closed again by T36. Re-review pending.

**Review follow-ups, 9th pass (2026-10-09):** T38–T39 done (H9-01 to H9-04 fixed); R6-02 closed again by T38. Re-review pending.

**Review follow-ups, 10th pass (2026-10-09):** T40–T41 done (J10-01 to J10-04 fixed); R6-02 closed again by T40. Re-review pending.
