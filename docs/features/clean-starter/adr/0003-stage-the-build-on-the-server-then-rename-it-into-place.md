---
status: Accepted
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-04"
feature_size: "M"
ticket: "roadmap step 1 + step 8 (starter cleanup) — docs/roadmap.md"
---

# 0003 — Stage the build on the server, then rename it into place

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** pasichnyi (maintainer, architect), with Claude during the design walk

## Context

Spec §6 targets a mixed-version window of ≤ 5 s, in which a visitor can receive a mix of old and
new files, and says an interrupted publish leaves the previous version fully served. Spec §8
asked, before design, whether the KTH server can switch versions in a single step and whether
protected files may be carried into a new version. Uploading over the network from a GitHub
runner to KTH can take much longer than 5 s. Protected files live in the same folder the site is
served from and must stay untouched (AC-11).

## Decision drivers

- Quality goal 4 (sad §1): mixed-version window ≤ 5 s; merge to live ≤ 10 min (spec §6).
- Quality goal 1: protected files are never changed (AC-11). Default from spec §8: they stay
  untouched rather than being carried into a new version.
- Constraint (sad §2): we control only the contents of one shared folder, not how KTH maps it to
  the web, and SSH shell access with `tar` is all that is evidenced.

## Considered options

1. **Stage, then rename.** Upload one archive into a hidden staging folder inside the target
   folder (`.publish-staging/`), unpack it there, then run one remote script that renames files
   into place (content-hashed assets first, then pages), applies removals, and writes the publish
   record last.
2. **Symlink swap between version folders.** Each publish goes into `releases/<id>/`, and a
   symlink the web server follows is flipped atomically.
3. **Ordered in-place copy.** Upload assets, then pages, then remove, directly into the live
   folder.

## Decision outcome

**Chosen:** option 1. The slow part, the network upload, touches nothing that is served. The
swap is local renames on one disk, which is well under 5 s for a site of this size. Protected
files are never moved or copied. Option 2 is truly atomic, but it needs KTH to serve our folder
through a symlink we control (unknown, and unlikely on a shared server), and it would carry
protected files into every version. Option 3 makes the mixed window the whole upload time,
missing the ≤ 5 s target, and an interrupted upload leaves a half-updated site.

**Interruption semantics.** An interruption before the rename step (during upload or unpack)
leaves the previous version fully served. The staging folder is wiped at the start of the next
publish. An interruption inside the sub-second rename step can leave some pages new and some old.
Every page still renders, because removals run last and old content-hashed assets stay until
then. The previous record is still in place, so the next publish recomputes and repairs. A failed
post-publish check (front page and logo reachable; every removed address and every reviewed
starter address not found, per spec §6's "100% of the reviewed starter addresses") fails the run
without automatic rollback.

## Consequences

**Positive**
- Meets ≤ 5 s without needing any server feature beyond `tar` and `mv`.
- Protected files are outside the swap entirely, which also answers the spec §8 question: no
  carrying-over is needed.

**Negative**
- The spec's "interrupted publish leaves the previous version fully served" holds for every
  interruption except one inside the sub-second rename step. There, the guarantee weakens to
  "every page still renders; the next publish repairs" (sad §11 accepted debt).
- `.publish-staging/` sits inside the served folder, so it is briefly reachable over HTTPS. It
  only ever holds the site's own public build.

**Neutral**
- Switching to option 2 later, if KTH confirms symlink serving, changes only the executor's swap
  step. The planner and record are unaffected.

## Links

- Spec: [[../spec.md]] §6 (mixed-version window, merge-to-live), §8 (single-step switch
  question), AC-11
- SAD: [[../sad.md]] §4 choice 3, §6, §7
- Related ADR: [[0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor]]
