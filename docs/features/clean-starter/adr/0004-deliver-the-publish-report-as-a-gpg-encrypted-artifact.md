---
status: Accepted
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-04"
feature_size: "M"
ticket: "roadmap step 1 + step 8 (starter cleanup) — docs/roadmap.md"
---

# 0004 — Deliver the publish report as a GPG-encrypted artifact

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi (maintainer, architect), with Claude during the design walk

## Context

Every publish produces a report for the maintainers: the server-folder listing when deletion is
off (AC-07), unknown files (AC-13), removed files (AC-01, AC-10), the check that stopped a
publish (AC-11b, AC-12) and warnings (AC-04, AC-06). The listing and the unknown files describe a
shared university server, so they must reach maintainers only and never appear in public records
(AC-09, spec §6.1). The repository is public. Its Actions logs are public, and its workflow
artifacts can be downloaded by any signed-in GitHub user.

## Decision drivers

- AC-09 and the abuse case "listing leak through public project records" (spec §6.1).
- Constraint (sad §2): few dependencies and no new services for one maintainer to run.
- Listings go to every maintainer (spec §6.1), and a maintainer is anyone with merge rights.

## Considered options

1. **GPG-encrypted artifact.** The report is encrypted on the runner to every key in
   `deploy/maintainers/*.asc` and attached to the run. The public summary shows counts and
   failed-check names only.
2. **Email.** The run sends the report through an SMTP account stored as a secret.
3. **A file on the server outside the web folder.** The report is written to a non-served
   location that the maintainer reads over SSH.

## Decision outcome

**Chosen:** option 1. GPG is preinstalled on GitHub's Ubuntu runners, so this needs no new
service, secret or package. The artifact can be public because only maintainers' private keys
open it. Adding or removing a maintainer is a reviewed change to `deploy/maintainers/`, under
the same CODEOWNERS rule as the publishing rules (ADR-0005). Email adds an account, a secret and a
third-party sending action, and it leaves plaintext on mail servers. A server-side file assumes a
writable non-public location and personal SSH access, and neither is verified.

**What is public and what is private.** The public log and job summary carry counts, check names,
and file names that are already public: build paths, protected-list entries and navigation
entries. Anything that names a server file the site did not publish goes into the encrypted
report only. If there is no maintainer key, or encryption fails, the publish stops before
uploading, so a listing never leaks in the clear.

## Consequences

**Positive**
- AC-09 is met with tools already on the runner. Nothing new needs rotating.
- A stopped publish fails the run, and GitHub already notifies the person who merged, so no
  extra alerting channel is needed.

**Negative**
- Reading a report takes one local command (`gpg -d`) and a downloaded artifact. This is a small
  but real step for a single maintainer.
- Artifacts expire after the repository's retention period (90 days by default). Older listings
  are lost, which is acceptable because every publish lists again.

**Neutral**
- Switching to email later replaces only the delivery step. The report content stays the same.

## Links

- Spec: [[../spec.md]] AC-07, AC-09, AC-13, §6.1
- SAD: [[../sad.md]] §4 choice 4, §8
- Related ADR: [[0005-gate-publishing-rules-by-review-and-main-only-server-secrets]]
