---
id: T21
title: "Harden rule parsing, the swap timer, approved-in-build and the removal-limit report"
layer: "domain"
deps: ["T18"]
acs: ["AC-11", "AC-12"]
files_hint:
  [
    "deploy/plan.ts",
    "deploy/remote/swap.sh",
    "deploy/publish.ts",
    "tests/plan.test.ts",
    "tests/swap.test.ts",
    "tests/publish.test.ts",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-06 (code items)"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T21 — Harden rule parsing, the swap timer, approved-in-build and the removal-limit report

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-06 (code items). ACs: AC-11, AC-12 — full text in [spec.md §5](../spec.md).

## Checklist

- [ ] `deploy/remote/swap.sh` line ~78: run the awk under `LC_ALL=C`; tighten `tests/swap.test.ts` to `/swap-seconds=\d+\.\d{3}/` (and run the swap with `LC_ALL=sv_SE.UTF-8`/`LC_NUMERIC` set in one case if the locale exists, else skip that case).
- [ ] `deploy/plan.ts` (~74-77): a rules line with leading or trailing whitespace is a `malformed-path` (stop), not a silently different path. Test protected `.htaccess ` (trailing space).
- [ ] An approved path that is also in the build: the planner stops (or warns — pick stop with a named check, e.g. `approved-in-build`, consistent with fail-before-change) so the HTTPS check doesn't fail forever (`deploy/publish.ts` ~284-286). Test it.
- [ ] Removal-limit stop (`deploy/plan.ts` ~363-374): `detail` lists planned-not-approved and approved-not-planned paths (encrypted report only — confirm the public summary carries counts only), as `deploy/README.md:86` promises. Test it.

## Definition of Done

- [ ] each item has a test that failed before and passes after
- [ ] `npm run lint && npm test` clean
