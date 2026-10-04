---
status: Draft
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-04"
feature_size: "M"
---

# Spec — clean-starter

> **Glossary:** [CONTEXT](./CONTEXT.md) (feature terms: protected file, starter) · [root CONTEXT](../../../CONTEXT.md) (roles: maintainer, visitor)
> **Reference module / docs / channels used:** None — only the interview + CONTEXT, plus the repo's own `docs/idea-brief.md`, `docs/roadmap.md`, `docs/architecture-map.md` and `.github/workflows/publish.yaml`.

## 1. Context

The group's address, oden.abe.kth.se, still serves the starter from the first attempt: demo posts, sample publications and events, and invented awards under the group's name. The new skeleton has replaced the starter in the repository, but publishing today only adds and overwrites files on the server and never removes any, so every starter page stays reachable at its old address even after the next publish. The repository still carries the template author's licence, and the inherited blue theme has not yet been tightened around the logo: next to the logo's navy and grey sit generic stock scales that say nothing about the group. A visitor — a prospective student, funder or peer — who lands on the site sees either template demo content or, once the skeleton is published, navigation links that lead nowhere.

There is no external deadline. The trigger is that the skeleton exists (roadmap step 1 is the first wave and unlocks steps 2, 3, 4, 6 and 8) and that the next merge to the main line publishes it. The idea brief names stalling as the main risk, so this feature ships live rather than waiting for a complete site. It covers roadmap step 1, the starter-cleanup half of step 8 and a minimal slice of step 2, which is why it is sized M.

Committed approach: go live now with a minimal, honest front page in the group's own identity, and make the live site mirror what the maintainer publishes — behind guardrails. The first publish only lists the server folder; the maintainer marks protected files and approves the starter files for removal; after that a publish removes only files the site itself published or the maintainer approved, and stops before deleting anything when the build or the target folder looks wrong; any removal above the routine limit, including the first starter cleanup, needs the maintainer to approve that exact list. Identity has a bounded definition of done — palette and type derived from the unchanged logo, readability passing, one before/after screenshot signed off — and is not a release gate. This follows the research finding that standard safe-deletion practice assumes you already know what lives on the server (here nobody does), the sharpest failure mode found (a wrong or empty target folder turning "mirror" into "wipe the account"), and the brief's success test: live, accurate, and an update takes minutes.

Traceability: KTH requires its websites to follow its accessibility, GDPR and online-publication guidelines ("Create a website at KTH", intra.kth.se); whether a self-built site on an abe.kth.se address may carry its own palette and type under the KTH graphic profile is not confirmed (see §8).

## 2. Goals

- No starter content is reachable on the live site or present in the repository's current files.
- The live site stays an exact, trustworthy reflection of what the maintainer publishes — removing something from the repository removes it from the live site — without ever endangering files that others rely on in the shared server folder.
- Every page carries the group's own readable identity, derived from its logo, and no visitor reaches a dead end.

## 3. Non-goals

- A final, polished identity — it is not a release gate; later refinement is an edit to the design tokens, and stalling on it would keep the demo live.
- A new or redrawn logo — decision D5 restyles around the existing logo file, it does not replace it.
- Redirecting old starter addresses to new pages — demo content has no successor page, so the not-found page is the honest answer.
- The full front page with equal paths to Research, People and Join/Contact — that stays roadmap step 2; this feature pulls forward only a minimal who-we-are front page (US-08).
- Real content for Research, People and Join/Contact — those are roadmap steps 3–6; this feature only makes the navigation honest about what exists.
- Choosing the final domain — roadmap decision D3.

## 4. User stories

### US-01: See only real group content

**As a** visitor
**I want** every address on the group's site to show only the group's real content
**So that** I never mistake template demo material for the group's work

### US-02: Land safely on a missing page

**As a** visitor following an old or mistyped link
**I want** a page in the group's look that says the page doesn't exist and leads me back
**So that** I don't conclude the site is broken

### US-03: Navigate only to real sections

**As a** visitor
**I want** the navigation to offer exactly the sections that exist, including new ones as soon as they are published
**So that** every link I click leads somewhere

### US-04: Recognise the group's identity

**As a** visitor
**I want** every page to carry the group's own recognisable, readable look derived from its logo
**So that** I recognise the group and can read comfortably

### US-05: Review the server before deletion

**As a** maintainer
**I want** to see what is in the server folder and mark protected files before any publish deletes anything
**So that** nothing others rely on is lost

### US-06: Publish mirrors the repository

**As a** maintainer
**I want** each publish to remove from the live site whatever I removed from the repository
**So that** the live site stays accurate without manual server work

### US-07: Repository free of starter notices

**As a** maintainer
**I want** the repository to carry no starter files or template notices
**So that** it represents only the group's own work

### US-08: Learn the basics from the front page

**As a** visitor
**I want** the front page to say who the group is, where it sits at KTH and how to get in touch
**So that** I learn the basics even before the full site exists

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** deletion has been switched on and the maintainer has approved the starter files for removal
**When** the maintainer publishes
**Then** no starter page, image or file remains reachable on the live site, and the maintainer sees the list of what was removed

### AC-02 (US-02) — happy path

**Given** a visitor follows an address the site does not have (an old starter link or a typo)
**When** the page opens
**Then** the visitor sees a page in the group's look stating that the page does not exist, with the site navigation and a link to the front page, and search engines are told the page is not found rather than given a normal page

### AC-03 (US-03) — happy path

**Given** a section's page has been published
**When** a visitor opens any page
**Then** the navigation offers that section without a separate navigation edit, and sections without a page are not offered

### AC-04 (US-03) — error

**Given** a maintainer adds a navigation entry for a section that has no page
**When** they try to publish
**Then** publishing is blocked and the maintainer is told which navigation entry points to a missing page

### AC-05 (US-04) — happy path

**Given** the palette and type derived from the logo are in place
**When** a visitor opens the front page or the not-found page
**Then** both show the unchanged logo with the group's palette and type applied consistently, matching the before/after screenshot the maintainer signed off

### AC-06 (US-04) — domain invariant: all text is readable

**Given** a maintainer changes a colour in the palette
**When** the change would make any text and background pair fall below the readability minimum
**Then** publishing is blocked and the maintainer is told which pair fails the "all text is readable" rule

### AC-07 (US-05) — happy path

**Given** deletion has not yet been switched on
**When** the maintainer publishes
**Then** nothing on the server is deleted, and the maintainer receives a listing of every server-folder file the build does not contain, to mark each as protected or approve it for removal

### AC-08 (US-05) — authorization

**Given** a person who is not a maintainer, such as a group member or an outside contributor
**When** they propose a change to the protected-file list, the removal approvals or the deletion switch
**Then** nothing on the live site changes until a maintainer accepts the change, because only maintainers may decide what is removed from a shared university server

### AC-09 (US-05) — authorization

**Given** a server-folder listing has been produced
**When** a visitor or another non-maintainer looks at the project's public pages and records
**Then** they cannot see the listing; only maintainers can, because it reveals the layout of a shared university server

### AC-10 (US-06) — happy path

**Given** deletion is switched on
**When** the maintainer removes a page from the repository and publishes
**Then** the page disappears from the live site (visitors following its address get the not-found page) and appears in the maintainer's list of removed files

### AC-11 (US-06) — domain invariant: a publish never removes a protected file

**Given** a protected file is in the server folder
**When** any publish runs
**Then** the file is left unchanged

### AC-12 (US-06) — error

**Given** the build is missing the front page or the logo, or the target folder does not contain the site's previously published files, or the publish would remove more files than the routine removal limit without the maintainer having approved that exact list
**When** the maintainer publishes
**Then** the publish stops before deleting anything and tells the maintainer which check failed

### AC-13 (US-06) — cross-context

**Given** a file appears in the server folder that the site never published and the maintainer never reviewed, such as one added by KTH IT
**When** the maintainer publishes
**Then** the file is left in place and reported to the maintainer for a keep-or-remove decision

### AC-14 (US-07) — happy path

**Given** this feature is complete
**When** anyone looks through the repository's current files
**Then** no starter files or template notices remain and there is no licence file; documents that recount the project's history may still name the old template

### AC-15 (US-08) — happy path

**Given** the maintainer has supplied the front-page copy
**When** a visitor opens the front page
**Then** they see the group name, a short who-we-are paragraph, the KTH affiliation and a way to get in touch

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Text readability | ≥ 4.5:1 contrast for body text; ≥ 3:1 for large text and UI elements (WCAG 2.1 AA) | automated check of every text/background token pair in the test suite |
| Third-party requests | 0 per page — fonts, styles and scripts all served from the site itself | build-time scan of built pages for off-site asset references |
| Merge-to-live time | ≤ 10 min | CI run duration from merge to publish complete |
| Mixed-version window | ≤ 5 s in which a visitor can receive a mix of old and new files; an interrupted publish leaves the previous version fully served | publish log timestamps + post-publish check of front page and logo |
| Routine removal limit | ≤ 20 files removed per publish without a maintainer-approved list | publish guard; count shown in the removal report |
| Old starter addresses | 100% of the reviewed starter addresses show the not-found page and signal not-found | post-publish check against the reviewed listing |
| Font payload | ≤ 100 KB of font files per page | build output size check |

## 6.1 Security / privacy

- **Data classification:** public — everything published is meant for any visitor; the server-folder listing and the protected-file list are internal, because they describe a shared university server.
- **Personal data touched:** the front-page contact route (a group or maintainer contact, published deliberately). No visitor data is collected; serving fonts from the site itself keeps visitors' addresses away from third parties.
- **AuthZ/AuthN impact:** only maintainers may change the protected-file list, approve removals or switch deletion on; the server-folder listing is readable only by maintainers. Proposed changes from anyone else take effect only after a maintainer accepts them.
- **Abuse cases:**
  - Wrong or empty target folder (misconfigured publish destination): the publish refuses to delete when the folder does not contain the site's previously published files, and never removes more than the routine limit without an approved list — blast radius capped before anything is lost.
  - Protected-list drift (files added to the folder after the review, e.g. certificate renewal or access rules): unknown files are never deleted silently; they are reported for a keep-or-remove decision.
  - Listing leak through public project records: the listing is delivered only to maintainers, never into publicly readable output.
  - A contribution from a non-maintainer that changes the publishing rules: it takes effect only after a maintainer accepts it, and checks run on proposed changes without access to the server.
  - Visitor tracking through third-party fonts or assets: zero third-party requests per page.
- **Security review:** Required — this is the first time a publish deletes files on a shared university server.

## 7. Metrics / KPIs

- **Starter files on the live server** — baseline: count from the first server listing (AC-07); target: 0 within 7 days of switching deletion on.
- **Dead navigation links on the live site** — baseline: 3 (Research, People, Join/Contact in the skeleton header); target: 0 at launch and after every publish.
- **Manual server fixes** — baseline: n/a (the server has never been cleaned); target: 0 in the first 3 months after deletion is switched on, counted in the maintainer's publish notes.
- **False-alarm publish stops** — baseline: 0; target: ≤ 1 per month (more means the guards are too tight).
- **Palette readability failures** — baseline: result of the first run of the readability check on today's tokens; target: 0 at launch.

## 8. Open questions

- [ ] May a self-built site on an abe.kth.se address carry its own palette and type under the KTH graphic profile? Default now: yes — the logo is kept and the site follows KTH accessibility and GDPR rules; ask grafiskprofil@kth.se and the ABE webmaster. — owner: pasichnyi, due: 2026-10-18
- [ ] Does the KTH server show the site's own not-found page and signal not-found for missing addresses? Default now: assume yes; if not, ask KTH IT to enable it. — owner: pasichnyi, due: before sdd:design
- [ ] Who besides the maintainer writes to the server folder (KTH IT, certificate renewal, verification files)? Default now: nobody — the first listing (AC-07) is the evidence. — owner: pasichnyi, due: before deletion is switched on
- [ ] Who holds the rights to the repository's code and content once the licence file is gone (the maintainer, the group, KTH)? Default now: all rights reserved, held by the group. — owner: pasichnyi, due: 2026-10-31
- [ ] Front-page copy: the who-we-are paragraph and the contact route (US-08). Default now: none — the maintainer writes it. — owner: pasichnyi, due: before sdd:implement
