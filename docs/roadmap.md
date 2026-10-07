---
status: living
updated_at: "2026-10-05"
---

# Roadmap — odenlabs-website

> **A decomposition, not a promise.** The overall idea broken into incremental steps: what each
> step is, where it comes from, how big it is — or that nobody has looked at it yet — and in which
> order, and parallel lanes, we walk them. **No dates** (except shipped history), **no scores** —
> order is the prioritization. The *solution* for any step lives in its `docs/features/<slug>/`
> spec, not here.

## Destination

A small English-only site with the research group's own identity is live at KTH, showing visitors what the group researches, who is in it and how to join, and the owner can publish a real update in minutes.

## Steps

| # | Step | Source | Size | Status |
|---|---|---|:---:|---|
| 1 | Set the group's identity on the new skeleton (restyle logo and theme; skeleton itself comes from `/sdd:scaffold`); also removes the starter from the live server (cleanup half of step 8) and ships a minimal who-we-are front page (slice of step 2) | idea-brief.md §1 Raw idea; §8 Open questions | M | spec'd → [`features/clean-starter/`](features/clean-starter/) |
| 2 | Front page "who we are" with equal paths to Research, People and Join/Contact | idea-brief.md §7 Recommendation | M | idea |
| 3 | People pages: members and bios | idea-brief.md §7 Recommendation | M | idea |
| 4 | Join / Contact page | idea-brief.md §7 Recommendation | S | idea |
| 5 | Research themes as the site's spine → see [Not yet specified](#not-yet-specified) | idea-brief.md §7 Recommendation | fog | idea |
| 6 | Projects pages grouped under each theme | idea-brief.md §7 Recommendation | M | idea |
| 7 | Automatic publications import → see [Not yet specified](#not-yet-specified) | idea-brief.md §6 Risks | fog | idea |
| 8 | Go live at KTH: confirm the existing SSH deploy to oden.abe.kth.se replaces the starter with the real site (starter removal now lives in step 1 / `clean-starter`; what remains is the final-domain check, D3) | idea-brief.md §6 Risks | S | idea |

## Not yet specified

| Area | What we'd have to learn | Blocks | How it gets sharpened |
|---|---|:---:|---|
| Research themes (step 5) | Which 3–5 themes define the group, and whether the group agrees on them | 5 | A conversation with the owner (and group), seeded by the four areas on the old urbant.org Research page (energy systems, smart cities, circular economy, sustainable urban development) |
| Publications import (step 7) | Which source feeds it (ORCID, DiVA, Google Scholar) and whether its data is complete enough | 7 | Recon pass: sample each source for the group's authors |

## Out of scope

- Blog / news feed — stale news is worse than none; revisit once a posting habit exists.
- Swedish or any second language — doubles every content edit.
- Member-editable profiles or login-based editing — one maintainer, no accounts to secure.
- Internal member area or resources — Notion already covers it.
- Fully KTH-branded design — the site carries the group's own identity.

## Open decisions

| # | Question | Type | Owner | Blocks |
|---|---|:---:|:---:|:---:|
| D1 | Which 3–5 research themes define the group? | grilling | human | 5 |
| D2 | Which source feeds publications, and is its data good enough? | research | agent | 7 |
| D3 | Who owns the KTH virtual server, and is oden.abe.kth.se the final domain? | grilling | human | 8 |
| D4 | Where does the first batch of real content (bios, photos) come from, given members must supply some? | grilling | human | 3 |

## Decisions so far

- English-only, single maintainer, hosted at KTH, built around research themes → [`idea-brief.md §7`](idea-brief.md)
- Blog, second language, member editing, internal area and full KTH branding are out → [`idea-brief.md §5`](idea-brief.md)
- Site is rebuilt on Astro (static), content as typed files in git, plain CSS tokens; HugoBlox starter removed by `/sdd:scaffold` (D6, 2026-10-04) → [`architecture-map.md`](architecture-map.md), [`adr/`](adr/)
- Logo and blue theme are restyled, not replaced (D5, 2026-10-04)
- Hosting is oden.abe.kth.se via GitHub Actions SSH copy, all four secrets set; recon done → [`.github/workflows/publish.yaml`](../.github/workflows/publish.yaml), [`config/_default/hugo.yaml`](../config/_default/hugo.yaml)

## Dependency graph

```mermaid
flowchart LR
  s1["1 · Clean + identity"] -->|first real deploy replaces the starter content| s8["8 · Go live at KTH"]
  s1 -->|shared theme and layout| s2["2 · Front page"]
  s1 -->|shared theme and layout| s3["3 · People"]
  s1 -->|shared theme and layout| s4["4 · Join/Contact"]
  s3 -->|front page links to People| s2
  s4 -->|front page links to Join/Contact| s2
  s5["5 · Research themes (fog)"] -->|projects are grouped by theme| s6["6 · Projects"]
  s1 -->|theme/layout for project pages| s6
```

## Execution path

Fog steps (5, 7) have no wave; their recon passes run alongside. Hosting recon is done and D6 is decided; step 1 starts once `/sdd:scaffold` has built the skeleton.

| Wave | Steps | Zone per step (why parallel-safe) | Unlocks |
|:---:|---|---|---|
| 1 | 1 | 1: `src/styles`, `src/layouts`, `src/components`, `public/` | 2, 3, 4, 6, 8 |
| 2 | 3 ∥ 4 | 3: `src/content/people`, `src/pages/people` · 4: `src/pages/join` (disjoint) | 2 |
| 3 | 2 | 2: `src/pages/index.astro` | — |
| 4 | 6 ∥ 8 | 6: `src/content/projects`, `src/pages/projects` — after recon of step 5 · 8: `.github/workflows` (disjoint) | — |

## Shipped

| Step | Shipped | Link |
|---|---|---|
