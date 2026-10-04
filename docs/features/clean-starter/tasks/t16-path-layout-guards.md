---
id: T16
title: "Stop a publish when the server's folder layout conflicts with the build"
layer: "domain"
deps: ["T10", "T11"]
acs: ["AC-11", "AC-13"]
files_hint:
  [
    "deploy/plan.ts",
    "deploy/remote/swap.sh",
    "tests/plan.test.ts",
    "tests/swap.test.ts",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-01"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T16 — Stop a publish when the server's folder layout conflicts with the build

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-01. ACs: AC-11, AC-13 — full text in [spec.md §5](../spec.md).

The protected-clash check in `deploy/plan.ts` (around line 334) only compares exact paths, and `deploy/remote/swap.sh` runs `mkdir -p` + `mv -f` without looking at what is already at the address. Reproduced: (1) a protected `x/x` on the server and build file `x` → `mv` writes into the folder, the protected file is overwritten; (2) server symlink `_astro -> ../outside` and build `_astro/a.css` → the file lands outside the site folder; (3) a file `a` on the server and build `a/b.html` → `mkdir -p` fails midway through the renames.

## Checklist

- [ ] Planner stop-guard (new failed check, e.g. `layout-clash`, added to the closed set): stop before any change when a build path is a strict parent folder of a listed path, or a listed path is a strict parent folder of a build path. `detail` names paths only for the encrypted report — `deploy/plan.ts`
- [ ] `swap.sh`: before each rename, refuse (exit non-zero, `layout-clash: <p>` on stderr, before anything moves if possible — check all targets first, then rename) when the target is a directory, or any parent component of the target is a symlink — `deploy/remote/swap.sh`
- [ ] Tests: plan.test cases for both parent/child directions (protected, unknown, owned listed paths); swap.test cases for a folder at a file address and a symlinked parent, asserting nothing outside the site folder changes and the protected file keeps its bytes — `tests/plan.test.ts`, `tests/swap.test.ts`

## Edge cases

| Case                                                        | Behaviour                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Listed path `a/b` and build path `a/b` (same file)          | not a layout clash — normal classification applies                                           |
| Build `a/index.html`, listed `a` (a file)                   | layout clash, stop                                                                           |
| A symlink that is itself a listed _file_ at a build address | existing behaviour (replaced by rename) unless protected — protected-clash already covers it |

## Definition of Done

- [ ] planner stops with a named check on any parent/child clash; swap.sh refuses a folder target or a symlinked parent; new plan.test and swap.test cases fail before the fix and pass after
- [ ] `npm run lint && npm test` clean
