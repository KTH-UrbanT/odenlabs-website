# Changelog — clean-starter

## clean-starter — guarded removal of the starter site, a not-found page, and a self-maintaining header

**What:** The site can now replace the inherited starter on `oden.abe.kth.se` without ever deleting
something it should not. A publish plans from ownership (owned, protected, approved, unknown), uploads
into a staging folder, renames it into place, and stops before changing anything if the plan looks wrong.
Visitors who follow a dead link get an on-brand "Page not found" page with a 404 status and `noindex`.
The header offers a planned section only once its page exists, so adding a page needs no navigation edit.
A colour change that breaks the readability minimum fails the test step, which runs before any deploy.

**Why:** The live server still holds the template's pages, and the folder is shared with KTH IT files
that must survive every publish ([spec](./spec.md) §1–§2). Deletion is therefore opt-in, ownership-based
and reviewed ([ADR-0002](./adr/0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor.md),
[ADR-0003](./adr/0003-stage-the-build-on-the-server-then-rename-it-into-place.md),
[ADR-0005](./adr/0005-gate-publishing-rules-by-review-and-main-only-server-secrets.md)). The report of what was
removed or left behind is a GPG-encrypted artifact ([ADR-0004](./adr/0004-deliver-the-publish-report-as-a-gpg-encrypted-artifact.md)).

**How to use:**

- Add a page to `src/pages/` and its entry in `src/data/sections.ts`; the header shows it after the next publish.
- Rules live in `deploy/rules/` (`protected.txt`, `approved-removals.txt`, `settings.json`) and are
  maintainer-only via CODEOWNERS. Full runbook: `deploy/README.md`.
- **Rollout order:** (1) publish with `deletion: "off"` and read the listing, (2) fill `protected.txt` and
  `approved-removals.txt` from it, (3) set `deletion: "on"`.

**Operational notes:**

- Migration: none.
- Config: GitHub environment secrets (server key, GPG public key) are main-only; the workflow has
  separate check and deploy jobs. `deletion` ships as `off`, so merging deletes nothing.
- Rollback: revert the commit and republish; a publish interrupted inside the rename step can leave some pages new and some old (ADR-0003, spec §8 R-07).
  The previous publish record stays on the server and is read by the next run.

**Acceptance criteria delivered:** AC-01, AC-02, AC-03, AC-04, AC-06, AC-07, AC-07b, AC-08–AC-11b, AC-12,
AC-13, AC-13b, AC-14.

**Not delivered (deferred, waiting on the maintainer):** AC-05 (identity: palette, fonts, sign-off) and
AC-15 (front-page copy), tasks T5–T7, see spec §8. Until then the site keeps the inherited tokens and a
minimal front page. Other deferrals (R3-05, R-05 to R-09, R6-01, R6-03, R6-04) have owners and due dates in §8.
