---
id: T19
title: "Put all code that runs with the server key under Code Owner review and narrow the job token"
layer: "wiring"
deps: ["T14"]
acs: ["AC-08"]
files_hint:
  [
    ".github/CODEOWNERS",
    ".github/workflows/publish.yaml",
    "deploy/README.md",
    "tests/workflow.test.ts",
  ]
owner: "pasichnyi"
source: "review-2026-10-04 F-04"
status: "done"
---

<!-- To the executing agent: work from what is inlined here. If a slice is insufficient,
ambiguous, or contradicts the code in front of you, open the named file and follow it. Do not
invent the missing part. -->

# T19 — Put all code that runs with the server key under Code Owner review and narrow the job token

Follow-up from the review: [`_review/review-2026-10-04.md`](../_review/review-2026-10-04.md), finding F-04. ACs: AC-08 — full text in [spec.md §5](../spec.md).

`deploy/publish.ts` imports `src/data/sections.ts` and `src/lib/navigation.ts` while `SSH_PRIVATE_KEY` is in the environment; `.github/CODEOWNERS` covers only `/deploy/` and `/.github/` (ADR-0005).

## Checklist

- [ ] Add `/src/data/sections.ts` and `/src/lib/navigation.ts` to CODEOWNERS — `.github/CODEOWNERS`
- [ ] Workflow: top-level `permissions: contents: read`; `persist-credentials: false` on the deploy job's checkout — `.github/workflows/publish.yaml`
- [ ] `tests/workflow.test.ts`: assert the permissions block, `persist-credentials: false` on the deploy checkout, and that every relative import reachable from `deploy/publish.ts` is covered by a CODEOWNERS pattern (walk imports with a simple regex).
- [ ] `deploy/README.md`: explain how a sole maintainer merges a Code-Owner-gated change (GitHub does not let an author approve their own PR: either admin bypass of the rule, or required approvals = 0 with Code Owner review still requested when a second maintainer exists).

## Definition of Done

- [ ] CODEOWNERS covers every file the deploy step imports; workflow has read-only permissions and no persisted credentials in the deploy job; workflow.test asserts both
- [ ] `npm run lint && npm test` clean
