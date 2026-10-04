---
status: Accepted
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-04"
feature_size: "M"
ticket: "roadmap step 1 + step 8 (starter cleanup) — docs/roadmap.md"
---

# 0001 — Build a static web frontend and a separate publish worker

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi (maintainer, architect), with Claude during the design walk

## Context

clean-starter changes two different runnable things. One is the visitor-facing static site: the
front page, the not-found page, honest navigation and the identity from the logo. The other is
publishing, which until now only uploaded `dist/` and never deleted anything. Publishing now
has to mirror the repository into a **shared** KTH server folder behind guards: never touch
protected or unknown files, and stop when the build or folder looks wrong (spec AC-07 to AC-13).
Every downstream stage (sequences, tasks, plan-tests, review) generates its work and test tiers
from the declared surfaces, so the declaration decides whether the deletion guards get their own
layer and tests.

## Decision drivers

- Quality goal 1 (sad §1): safety of the shared server folder. The deletion guards must be
  provable before they run against a real university server (spec §6.1: security review
  required).
- The spec's §5 splits cleanly into visitor stories (US-01 to US-04, US-08) and maintainer
  publishing stories (US-05, US-06), whose actors never meet on a screen (ux-flows: "Two
  surfaces, two audiences").
- Constraint (sad §2): the KTH server runs no code, so the site cannot carry any publishing
  logic. Publishing runs only in CI.

## Considered options

1. **`[web-frontend, worker]`**. The publish is an event-started job (a merge to `main`) with no
   request/response surface, whose output is a report.
2. **`[web-frontend, cli]`**. The publish is a command-line program a maintainer could also run by
   hand (for example a local dry run).
3. **`[web-frontend]` only**. The publish is treated as CI configuration, not a surface.

## Decision outcome

**Chosen:** option 1, `[web-frontend, worker]`. The publish has no human-facing request or
response, and the spec never asks for a local run. A CLI would put the server's SSH key on a
maintainer's machine, which the "only CI deletes" posture of spec §6.1 does not need. Folding
the publish into CI configuration (option 3) would leave the riskiest logic in the feature
without a layer of its own, and without the unit tests the safety goal needs.

## Consequences

**Positive**
- The deletion guards get domain and infra layers and unit and integration test tiers in
  `tasks` and `plan-tests`.
- Site code stays free of server concerns. Visitor pages and the publish can be tested and
  changed independently.

**Negative**
- More artifacts. `api` produces an events contract for the worker (trigger: merge to `main`;
  output: report), and `sequences` draws service flows alongside UI flows.
- There is no supported local dry run against the real server. The maintainer sees the plan
  only through a CI run.

**Neutral**
- Adding a `cli` surface later (a local dry run against a recorded listing) is additive: the
  planner it would call already exists (ADR-0002).

## Links

- Spec: [[../spec.md]] US-01–US-08, §6.1
- SAD: [[../sad.md]] §4 choice 1, §5
- Related ADR: [[0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor]]
