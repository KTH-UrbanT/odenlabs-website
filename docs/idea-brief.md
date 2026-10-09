---
status: Draft
owner: "pasichnyi"
updated_at: "2026-10-04"
depth: "hard"
---

# Idea brief — odenlabs-website

## 1. Raw idea

I'd like to make a website for my research group. A year ago I was attempting to do it - hence there are files and repo https://github.com/KTH-UrbanT/odenlabs-website, but it's just a vanilla install, you can remove it completely.

## 2. Problem

The group has no web presence of its own: visitors see only a KTH profile page and scattered paper lists, so nobody can grasp the group's research story in one place. A first attempt a year ago stalled at an unmodified starter install, for all four reasons the owner named: no time, tooling friction, no clear content, and no one else to share ownership.

## 3. Users

- Prospective students and postdocs (considering joining the group).
- Funders, collaborators and industry partners (judging credibility).
- Academic peers and the general public (looking up what the group produces).
- Not a user: group members as an internal audience, because the internal space already lives in Notion.

## 4. Why now

No external deadline or event. The trigger is capacity: the owner now has time, and AI assistance makes building and drafting feasible where it was not a year ago. With no deadline, the anti-stall measure is a deliberately small first release shipped within weeks.

## 5. Out of scope

- Blog / news feed: stale news is worse than none; add once a posting habit exists.
- Swedish or any second language: doubles every content edit; English is enough for international recruiting.
- Member-editable profiles or any login-based content editing: one maintainer is enough, and it avoids accounts and security upkeep.
- Internal member area or resources: Notion already covers this.
- Fully KTH-branded design: the site should carry the group's own identity.

## 6. Risks

- Assumes the owner stays the single maintainer and others send updates; false if updates are not sent, and then the pages go stale like the last attempt.
- Assumes AI-drafted content, shaped through conversation with the owner, will sound like the group; false if the text turns out generic, and then it needs heavy rewriting or it fails to tell a story.
- Assumes the three audiences are served by a neutral "who we are" front page; false if that page reads as a generic mission statement that serves nobody strongly.
- Assumes publications can be imported automatically from an external source; false if source data is incomplete or setup becomes the kind of tooling friction that stalled the first attempt.
- Assumes research themes can be settled up front to act as the site's spine; false if the group cannot agree on 3–5 themes, which blocks structure and content.
- Pages for publications and projects are in v1 although they are the likeliest to go stale; the automation of publications is the only guard.
- Hosting at KTH may impose rules on domain, publishing flow or technology that are not yet known.

## 7. Recommendation

Build a small, English-only site with the group's own identity, hosted at KTH and maintained by the owner. Organise it around three to five research themes, each pulling in its people, projects and automatically imported publications, so one edit updates several pages. The front page is a neutral "who we are" with equal paths to Research, People and Join/Contact. Success at three months is operational: it is live, accurate, and a real update takes minutes.

## 8. Open questions

- Which 3–5 research themes define the group? — owner (pasichnyi)
- Which source feeds publications (ORCID, DiVA, Google Scholar), and is its data good enough? — owner (pasichnyi)
- What does KTH hosting allow for domain, publishing flow and technology? — owner (pasichnyi), with KTH IT
- Where does the first batch of real content come from (bios, photos, project descriptions), given members must supply some? — owner (pasichnyi)
- Keep, restyle or replace the existing logo and blue theme from the first attempt? — owner (pasichnyi)
- When the old starter files are removed, which assets (logo, theme, deployment setup) are worth keeping? — owner (pasichnyi)
