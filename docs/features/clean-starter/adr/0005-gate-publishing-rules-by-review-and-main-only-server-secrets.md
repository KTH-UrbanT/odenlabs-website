---
status: Accepted
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-04"
feature_size: "M"
ticket: "roadmap step 1 + step 8 (starter cleanup) — docs/roadmap.md"
---

# 0005 — Gate publishing rules by review and main-only server secrets

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi (maintainer, architect), with Claude during the design walk

## Context

Only maintainers may change the protected-file list, approve removals or switch deletion on.
Anyone else's proposal must take effect only after a maintainer accepts it (AC-08, spec §6.1).
The spec places these rules in the public repository as reviewed changes. The server's SSH key,
which can delete files on a shared university server, is today a **repository** secret. A
workflow run started by a pull request from a branch in this repository (as opposed to a fork)
can read repository secrets. Anyone with write access but no merge rights could therefore change
the workflow on a branch and reach the server without review.

## Decision drivers

- AC-08 and the abuse case "a contribution from a non-maintainer that changes the publishing
  rules … checks run on proposed changes without access to the server" (spec §6.1).
- Quality goal 1 (sad §1): safety of the shared server folder.
- Constraint (sad §2): one maintainer today. A maintainer may approve their own change (spec
  §6.1).

## Considered options

1. **Rules in the repo, plus server secrets limited to `main`.** The rule files sit under
   `deploy/rules/`. `main` is protected and requires a reviewed pull request. CODEOWNERS makes
   maintainers the owners of `deploy/` and `.github/`. The four SSH secrets move into a GitHub
   environment, `kth-server`, whose deployment-branch rule allows only `main`.
2. **Rules in the repo, secrets stay repository-level.** Same files and branch protection,
   relying on fork pull requests getting no secrets.

## Decision outcome

**Chosen:** option 1. Limiting the environment to `main` closes the branch-PR path to the key
regardless of who has write access, so the rule "only the maintainer has write access" no longer
has to hold forever to keep the server safe. PR checks still run the planner against fixtures
with no server access, which is exactly the spec's abuse-case mitigation. Option 2 is safe only
while nobody but the maintainer ever has write access, and that rule is easy to break by giving a
group member push rights.

**Rule files.** `deploy/rules/protected.txt` (one path per line), `deploy/rules/approved-removals.txt`
(one path per line; for a publish above the routine limit it must equal the planned removal set
exactly, AC-12) and `deploy/rules/settings.json` (`deletion: "off" | "on"`, `removalLimit: 20`).
The planner rejects unknown keys and malformed paths, which fails the check before any publish.

## Consequences

**Positive**
- AC-08 holds structurally: nothing reaches `main`, and so nothing reaches the server, without a
  maintainer's review. No unmerged code can reach the key.
- The rules have a full, public, reviewable history in git, as spec §6.1 intends.

**Negative**
- Repository settings outside git (branch protection, environment, CODEOWNERS enforcement) must
  be configured by hand and can drift. sad §11 adds a one-time check to the setup.
- With one maintainer, GitHub cannot require a second reviewer. Self-approval is allowed by spec
  §6.1 but means review is a discipline, not a lock, until there are two maintainers.

**Neutral**
- Adding required reviewers on the `kth-server` environment later (a manual go per publish) is a
  settings change, if publishing should ever need a second human gate.

## Notes

- **2026-10-04 (review, T19/T26):** the decision stands; its CODEOWNERS scope is widened. Code
  owners now cover every file the deploy step loads while `SSH_PRIVATE_KEY` is in its
  environment, not only `deploy/` and `.github/`. Today that adds `src/data/sections.ts` and
  `src/lib/navigation.ts`. `tests/workflow.test.ts` walks the imports from `deploy/publish.ts`
  and fails when a loaded file has no code owner.

## Links

- Spec: [[../spec.md]] AC-08, §6.1
- SAD: [[../sad.md]] §4 choice 5, §8
- Related ADR: [[0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor]],
  [[0004-deliver-the-publish-report-as-a-gpg-encrypted-artifact]]
