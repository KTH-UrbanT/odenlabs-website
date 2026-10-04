---
status: Living
updated_at: "2026-10-04"
---

# Domain Context — clean-starter

<!--
CONTEXT.md is the domain glossary — not a spec and not a scratch pad. NO implementation
detail here (no datastore/broker/framework names, no API contracts) — only domain words
and the boundaries between them. Implementation choices live in the SAD and ADRs; behaviour
lives in spec.md.

Terms get fixed inline, the moment they surface in an interview / spec / review — never
batched «I'll consolidate later». Empty H2 → prune before commit; keep only the sections
that carry real content. ## Glossary is mandatory; the other two are optional.
-->

## Glossary

- protected file — a file in the live site's server folder that the site does not build but that must survive every deploy, because something else (e.g. KTH IT, domain verification) relies on it; a maintainer names each one explicitly. NOT a starter file (starter files are what the cleanup removes) and NOT a site page (pages come from the build).
- section — a top-level area of the site with its own page, offered in the main navigation from the site's ordered, labelled list of planned sections (today Research, People, Join/Contact). NOT the front page, and NOT an entry page (one person's, one project's or one theme's page).
- starter — the template site from the first attempt: its demo pages (sample posts, publications, events, authors), its generated files and its template notices (e.g. the template author's licence). NOT the group's own assets carried over from that attempt (logo, icon, brand colours), which are kept.
