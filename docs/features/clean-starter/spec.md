---
status: Draft
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-10-09"
feature_size: "M"
---

# Spec — clean-starter

> **Glossary:** [CONTEXT](./CONTEXT.md) (feature terms: protected file, section, starter) · [root CONTEXT](../../../CONTEXT.md) (roles: maintainer, visitor)
> **Reference module / docs / channels used:** None — only the interview + CONTEXT, plus the repo's own `docs/idea-brief.md`, `docs/roadmap.md`, `docs/architecture-map.md` and `.github/workflows/publish.yaml`.

## 1. Context

The group's address, oden.abe.kth.se, still serves the starter from the first attempt: demo posts, sample publications and events, and invented awards under the group's name. The new skeleton has replaced the starter in the repository, but publishing today only adds and overwrites files on the server and never removes any, so every starter page stays reachable at its old address even after the next publish. The repository still carries the template author's licence, and the inherited blue theme has not yet been tightened around the logo: next to the logo's navy and grey sit generic stock scales that say nothing about the group. A visitor — a prospective student, funder or peer — who lands on the site sees either template demo content or, once the skeleton is published, navigation links that lead nowhere.

There is no external deadline. The trigger is that the skeleton exists (roadmap step 1 is the first wave and unlocks steps 2, 3, 4, 6 and 8) and that the next merge to the main line publishes it. The idea brief names stalling as the main risk, so this feature ships live rather than waiting for a complete site. It covers roadmap step 1, the starter-cleanup half of step 8 and a minimal slice of step 2, which is why it is sized M.

Committed approach: go live now with a minimal, honest front page in the group's own identity, and make the live site mirror what the maintainer publishes — behind guardrails. Every publish uploads the build and keeps a record of the files it uploaded; until deletion is switched on, a publish also lists the server folder and deletes nothing. On that listing the maintainer marks protected files and approves the starter files for removal, and those marks are the approved list for the first cleanup — there is no second sign-off. After that a publish removes only files a previous publish recorded or the maintainer approved, and stops before deleting anything when the build or the target folder looks wrong; any removal above the routine limit, including the first starter cleanup, needs the maintainer to approve that exact list. The maintainer can switch deletion off again at any time, which returns publishing to upload-and-list. Identity has a bounded definition of done — palette and type derived from the unchanged logo, readability passing, one before/after screenshot signed off — and is not a release gate. This follows the research finding that standard safe-deletion practice assumes you already know what lives on the server (here nobody does), the sharpest failure mode found (a wrong or empty target folder turning "mirror" into "wipe the account"), and the brief's success test: live, accurate, and an update takes minutes.

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

**Given** a section is on the site's ordered list of planned sections and its page has been published
**When** a visitor opens any page
**Then** the navigation offers that section, in the planned order and with its planned label, without a separate navigation edit, and planned sections without a page are not offered

### AC-04 (US-03) — error

**Given** a planned section's navigation entry points to a page the build does not contain (not yet written, or a mistyped address)
**When** the maintainer publishes
**Then** visitors are not offered that entry, the publish goes ahead, and the maintainer is told which navigation entry points to a missing page

### AC-05 (US-04) — happy path

**Given** the palette and type derived from the logo are in place
**When** a visitor opens the front page or the not-found page
**Then** both show the unchanged logo with the group's palette and type applied consistently, matching the before/after screenshot the maintainer signed off; that sign-off is a one-time manual acceptance — it never blocks a later publish, and later palette edits may change the look

### AC-06 (US-04) — domain invariant: all text is readable

**Given** a maintainer changes a colour in the palette
**When** the change would make any text and background pairing the site uses (as declared alongside the palette) fall below the readability minimum
**Then** publishing is blocked and the maintainer is told which pair fails the "all text is readable" rule

### AC-07 (US-05) — happy path

**Given** deletion has not yet been switched on
**When** the maintainer publishes
**Then** the build is uploaded, nothing on the server is deleted, and the maintainers receive, through a maintainer-only route, a listing of every server-folder file the build does not contain, to mark each as protected or approve it for removal

### AC-07b (US-05) — happy path

**Given** deletion is switched on
**When** a maintainer switches it off and publishes
**Then** the publish behaves as in AC-07: the build is uploaded, nothing is deleted and the listing is produced

### AC-08 (US-05) — authorization

**Given** a person who is not a maintainer, such as a group member or an outside contributor
**When** they propose a change to the protected-file list, the removal approvals or the deletion switch
**Then** nothing on the live site changes until a maintainer accepts the change, because only maintainers may decide what is removed from a shared university server

### AC-09 (US-05) — authorization

**Given** a server-folder listing has been produced
**When** a visitor or another non-maintainer looks at the project's public pages, records and publish logs
**Then** they cannot see the listing; only maintainers can, because it reveals the layout of a shared university server

### AC-10 (US-06) — happy path

**Given** deletion is switched on
**When** the maintainer removes a page from the repository and publishes
**Then** the page disappears from the live site (visitors following its address get the not-found page) and appears in the maintainer's list of removed files

### AC-11 (US-06) — domain invariant: a publish never removes a protected file

**Given** a protected file is in the server folder
**When** any publish runs
**Then** the file is left unchanged

### AC-11b (US-06) — error

**Given** the build contains a file at the same address as a protected file
**When** the maintainer publishes
**Then** the publish stops before changing anything on the server and tells the maintainer which file clashes with a protected file

### AC-12 (US-06) — error

**Given** the build is missing the front page or the logo, or the target folder does not contain the previous publish's record together with the front page and logo that record lists, or the publish would remove more files than the routine removal limit without the maintainer having approved that exact list (an approval of a list that differs by even one file does not count)
**When** the maintainer publishes
**Then** the publish stops before deleting anything and tells the maintainer which check failed

### AC-13 (US-06) — cross-context

**Given** a file appears in the server folder that the site never published and the maintainer never reviewed, such as one added by KTH IT
**When** the maintainer publishes
**Then** the file is left in place, the publish goes ahead (unless the file is in the way of the build — AC-13b), and the file is reported to the maintainers for a keep-or-remove decision — on every publish until it is marked protected or approved for removal

### AC-13b (US-06) — error <!-- added-by-fix: review 2026-10-04 (2nd pass), R-03; scope widened to every listed path in review 2026-10-04 (3rd pass), F-3 -->

**Given** a listed file or folder in the server folder (unknown, protected, owned or approved) occupies an address the build needs — it sits where the build writes a file of the same name as a folder, or inside a folder the build writes as a file, or a parent on the way is a link
**When** the maintainer publishes
**Then** the publish stops before any change and tells the maintainer which check failed (`layout-clash`) and which path is in the way; the file itself is left untouched

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
| Text readability | ≥ 4.5:1 contrast for body text; ≥ 3:1 for large text and UI elements (WCAG 2.1 AA) | automated check, in the test suite, of every text/background pairing the site uses, as declared alongside the palette |
| Third-party requests | 0 per page — fonts, styles and scripts all served from the site itself | build-time scan of built pages for off-site asset references |
| Merge-to-live time | ≤ 10 min | CI run duration from merge to publish complete |
| Mixed-version window | ≤ 5 s in which a visitor can receive a mix of old and new files; an interrupted publish leaves the previous version fully served | publish log timestamps + post-publish check of front page and logo (feasibility open — see §8) |
| Routine removal limit | ≤ 20 files removed per publish without a maintainer-approved list | publish guard; count shown in the removal report |
| Old starter addresses | 100% of the reviewed starter addresses show the not-found page and signal not-found | post-publish check against the reviewed listing |
| Font payload | ≤ 100 KB of font files per page | build output size check |

## 6.1 Security / privacy

- **Data classification:** public — everything published is meant for any visitor; the protected-file list, the removal approvals and the deletion switch are also public, because they live in the project's public repository as reviewed changes and hold only file names. The server-folder listing is internal, because it describes a shared university server, and never appears in public publish logs.
- **Personal data touched:** the front-page contact route (a group or maintainer contact, published deliberately). No visitor data is collected; serving fonts from the site itself keeps visitors' addresses away from third parties.
- **AuthZ/AuthN impact:** only maintainers may change the protected-file list, approve removals or switch deletion on; the server-folder listing is readable only by maintainers. Proposed changes from anyone else take effect only after a maintainer accepts them. Listings and removal reports go to every maintainer through a maintainer-only route; a maintainer may approve removals in their own change (there is one maintainer today).
- **Abuse cases:**
  - Wrong or empty target folder (misconfigured publish destination): the publish refuses to delete when the folder does not contain the site's previously published files, and never removes more than the routine limit without an approved list — blast radius capped before anything is lost.
  - Protected-list drift (files added to the folder after the review, e.g. certificate renewal or access rules): unknown files are never deleted silently and never block a publish unless one is in the way of the build (AC-13b), in which case the publish stops before any change; they are reported on every publish until a keep-or-remove decision is made.
  - Listing leak through public project records: the listing is delivered only to maintainers, never into publicly readable output such as publish logs.
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
- [ ] Who besides the maintainer writes to the server folder (KTH IT, certificate renewal, verification files)? Default now: nobody — the first listing (AC-07) is the evidence. — owner: pasichnyi, due: before deletion is switched on
- [ ] Who holds the rights to the repository's code and content once the licence file is gone (the maintainer, the group, KTH)? Default now: all rights reserved, held by the group. — owner: pasichnyi, due: 2026-10-31
- [ ] Can the KTH server switch from the old version of the site to the new one in a single step, and must protected files stay untouched or may they be carried into the new version? Default now: files are copied one by one and protected files stay untouched; the ≤ 5 s mixed-version target stands until design shows it cannot be met. — owner: pasichnyi, due: before sdd:design
- [ ] Front-page copy: the who-we-are paragraph and the contact route (US-08). Default now: none — the maintainer writes it. Until it arrives AC-15 is unmet and T5 is blocked (review 2026-10-04). — owner: pasichnyi, due: 2026-10-18
- [ ] Identity (AC-05): which self-hosted fonts, and who signs off the before/after screenshot? Default now: the inherited starter tokens and system font stack stay, so AC-05 is unmet, AC-02's "group's look" means the inherited tokens, and AC-06 is re-run once the real palette lands. T6 and the font-budget half of T7 are blocked; the off-site-request guard is split off and ships now. Run `screens` and `plan-tests` before T5/T6 resume (review 2026-10-04). — owner: pasichnyi, due: 2026-10-18
- [ ] Publish-worker follow-ups (review 2026-10-04, 2nd pass, R-05–R-08, deferred): R-06 a failed record read (I/O, missing `cat`, dropped SSH) is treated as an unreadable record and drops owned leftovers from the record; R-08 the code-owner import walk misses `export … from`, side-effect and dynamic imports; R-07 files moved by a swap that fails mid-way are in no record and later read as unknown; R-05 `swap-seconds` includes the pre-check. Default now: none of these occur on the current build and server; deletion stays off. Must be resolved before deletion is switched on. — owner: pasichnyi, due: 2026-10-18
- [ ] Low-priority hardening (review 2026-10-04, 2nd pass, R-09, deferred): off-site scanner gaps (`object data`, `feImage`, `imagesrcset`, `image-set()`, `<base href>`, `/\host`, `http:/host`, an embedded tab or newline in a URL scheme (`ht<TAB>tps://…`, added in review 2026-10-04, 4th pass), built `.js` not scanned) and false positives on page text; `.markdown`-family pages skipped by the header; commented-out tokens counted as duplicates; unexpected errors after the interim seal skip the sealed report; post-publish URLs not percent-encoded; `[]?*` names can't be listed; build paths that clash with the worker's own files; three tests that don't exercise the failure they name. See `_review/review-2026-10-04-2.md`. — owner: pasichnyi, due: 2026-10-31
- [ ] Build-test cache isolation (review 2026-10-04, 3rd pass, R3-05, deferred): the AC-03 fixture build in `tests/build.test.ts` reaches the repo's `node_modules/.astro` and `node_modules/.vite` caches through its `node_modules` symlink, so an `npm run build` run alongside `npm test`, or a later fixture with different content, could rewrite `data-store.json`. Default now: harmless — same content, builds run one after another in one file. Fix later: give the fixture its own `cacheDir`. See `_review/review-2026-10-04-3.md`. — owner: pasichnyi, due: 2026-10-31
- [ ] Flow docs sync (review 2026-10-07, 6th pass, R6-01, deferred): `sad.md:492` (Flow 5 stops whatever the deletion setting) omits the missing front page or logo, `sad.md:352` (Flow 1 note, the only AC-12 coverage) omits `malformed-path` and `approved-in-build`, and the `ux-flows.md:238` AC-12 coverage row still counts three stop branches and its `updated_at` is stale after T32. The code and tests are correct. Default now: `deploy/plan.ts` and `ux-flows.md:152-195` are the authority for the stop order. — owner: pasichnyi, due: 2026-10-31
- [x] Off-site guard reader desync (review 2026-10-07, 6th pass, R6-02; fixed by T33, reopened by the 7th pass (F7-01), the 8th pass (G8-01 to G8-03) and the 9th pass (H9-01), fixed by T34, T36 and T38): the page is read under four whole-page readings, a region-free pass (every `<name` is a tag, read to its first `>` or `<`) and the old attribute scans (`legacyUrls`: `src`/`poster`/`srcset` after a closing quote or after a bare or `name=value` token, `<link>`/`<image>`/`<use>`), all unioned; a self-closing `<svg/>` opens nothing; `<svg>` and `<math>` depths are counted apart; only HTML whitespace separates attributes; every scan is linear (1 MB inputs under 4 s, measured 0.1 to 0.8 s). Additive to the pre-T31 scan except for the residuals: a quoted `>` before the `rel`/`href` of a `<link>`, `<image>` or `<use>`, and a `style` attribute after a quoted `>`, in a page the four readings misread (the pre-T31 scan missed both). The price of the extra passes: text the browser doesn't parse as tags (a commented-out `<img>`, a string in a script, the text of a `<textarea>`/`<title>`, an attribute value holding markup, a quoted `"x" src="…"` or `hidden src="…"` in page text, Markdown inline code with raw quotes) is reported too; that fails the build, never the visitor. Default now: the current `dist/` reports `[]`. — owner: pasichnyi, due: 2026-10-31
- [ ] Off-site guard test adequacy (review 2026-10-07, 6th pass, R6-03, deferred): 12 of 58 hand mutants survive `tests/offsite-requests.test.ts` and hide a real request: `FETCHING_REL` entries `icon`, `modulepreload`, `manifest`, `preconnect`; CDATA with a `>` inside; `/` and a stray `=` in attribute names; the `</svg` fallback for an unterminated SVG `<style>`; the `</style` lookahead (`</stylex>`); tab-separated `srcset`; `@import` followed by a newline; upper-case `URL(` and `@IMPORT`. Default now: add one test row per input. — owner: pasichnyi, due: 2026-10-31
- [ ] Off-site guard older gaps (review 2026-10-07, 6th pass, R6-04, deferred; all missed before T31, joins R-09): CSS escapes in `url()` and `@import` strings (`url(\68ttps://…)`), `@import"…"` without whitespace, `background` on `<body>`/`<table>`/`<td>`, `<iframe srcdoc>`, `<script href>` inside SVG, and `&comma;` in `srcset` (`comma` is missing from the named references). Built `.css` is safe (lightningcss normalises both); the gap is `style` attributes, `<style is:inline>` and SVG `<style>`. Default now: hand-written markup only. — owner: pasichnyi, due: 2026-10-31
