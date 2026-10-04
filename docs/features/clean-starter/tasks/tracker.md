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
| T27 | Off-site guard: decode every attribute value, remaining entity forms (review F-2, R3-01/02/04) | tests  | pasichnyi | S        | T24                 | todo    |
| T28 | Docs sync: AC-13b in ux-flows, AC-13b scope, traceability (review F-1, F-3, F-4)             | docs   | pasichnyi | S        | —                   | todo    |

**Total:** 28 tasks, ~12.6 person-days (S ≈ 0.3 d, M ≈ 0.7 d, 1d = 1 d).

**Blocked (2026-10-04):** T5 waits for the front-page copy (who-we-are paragraph and
contact route, spec §8). T6 waits for T5 and for the maintainer's font choice and
before/after sign-off. T7 waits for T6.

**Review follow-ups (2026-10-04):** T16–T23 done; deferrals and new due dates in spec §8.

**Review follow-ups, 2nd pass (2026-10-04):** T24–T26 done; R-05–R-09 deferred in spec §8.

**Review follow-ups, 3rd pass (2026-10-04):** T27–T28 open; R3-05 deferred and R3-03 dismissed (spec §8, review record).
