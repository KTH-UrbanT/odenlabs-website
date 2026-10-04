# Tracker — clean-starter

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Planned sections + offered-sections helpers | domain | pasichnyi | S | — | done |
| T2 | WCAG contrast check over declared pairs | domain | pasichnyi | S | — | done |
| T3 | Header renders only offered sections | ui | pasichnyi | S | T1 | todo |
| T4 | Not-found page | ui | pasichnyi | S | — | todo |
| T5 | Minimal front page | ui | pasichnyi | S | — (maintainer copy) | todo |
| T6 | Identity: palette, type, fonts, sign-off | ui | pasichnyi | M | T2, T4, T5 | todo |
| T7 | Build guards: off-site refs, font budget | tests | pasichnyi | S | T6 | todo |
| T8 | Publish model + rules files | domain | pasichnyi | M | — | todo |
| T9 | Planner classification and plan | domain | pasichnyi | M | T8 | todo |
| T10 | Planner stop-guards | domain | pasichnyi | M | T9 | todo |
| T11 | Remote swap script | infra | pasichnyi | M | T8 | todo |
| T12 | Publish report (public + encrypted) | infra | pasichnyi | M | T8 | todo |
| T13 | Publish shell over SSH | app | pasichnyi | 1d | T1, T10, T11, T12 | todo |
| T14 | Workflow + CODEOWNERS | wiring | pasichnyi | S | T13 | todo |
| T15 | Runbook + repository sweep | docs | pasichnyi | S | T14 | todo |

**Total:** 15 tasks, ~8 person-days (S ≈ 0.3 d, M ≈ 0.7 d, 1d = 1 d).
