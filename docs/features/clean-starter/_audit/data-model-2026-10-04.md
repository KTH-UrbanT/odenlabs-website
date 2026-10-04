# data-model audit — clean-starter — 2026-10-04

## Outcome

- `docs/features/clean-starter/data-model.md` written. It covers 13 file-based entities in two
  aggregates (publish ownership on the worker surface; navigation and identity on the
  web-frontend surface).
- **Zero staged migrations.** No `docs/features/clean-starter/migrations/` folder exists. This is
  a valid no-schema-change outcome, not a failure: `architecture-map.md` records
  `migration_tool: "none"` (repo ADR 0002, content is typed files in git), and sad §6 says "There
  is no database, table or index."
- Nothing was written into a live `migrations/` tree, and none exists in the repo.

## Conventions derived (read-only)

| Topic | Source | Followed as |
|---|---|---|
| Datastore | architecture-map §Datastores, repo ADR 0002 | Files in git, plus `.publish-record.json` on the server and an encrypted artifact (ADR-0002, ADR-0004) |
| Migration tool / naming | architecture-map frontmatter `migration_tool: "none"` | No migrations; format changes are code changes. Promote-time hint: **none to promote** |
| IDs | `CLAUDE.md`, sad §8 "ID strategy" | Normalised relative server paths; maintainer key ID = file name |
| Validation failures | `CLAUDE.md` "bad content fails the build" | Malformed rules or settings fail the check job; malformed record or planner inputs stop the publish |

No divergence between the architecture and the repo.

## Self-check (4 mandatory)

| Check | Result |
|---|---|
| Naming matches the repo's convention | Pass: kebab-case file IDs, camelCase JSON fields as in `content.config.ts` |
| Down reversibility | N/A: no migrations. The record is replaced by every publish, so rollback means the next publish |
| FK indexes | N/A: no database. Every join-by-path is an in-memory set or map (data-model §Indexes) |
| Convention adherence | Pass. Two deliberate additions are flagged below |

Mermaid `erDiagram`: `mmdc` is not installed, so the structural lint was used. The cardinality
glyphs are valid (`||--|{`, `|o--o|`, `||--o{`, `}o--||`, `}|--o{`, `}o--o|`), and every
attribute line is `type name [PK|FK|UK]`. Pass.

## Drift detection

| Entity | Code today | Finding |
|---|---|---|
| `PLANNED_SECTION` | hard-coded `nav` array in `src/components/Header.astro` | Field-for-field match (`href`, `label`, same three values). Not a drift: `implement` moves it into `src/data/sections.ts` |
| `COLOUR_TOKEN` | `src/styles/tokens.css` | Aliases chain through `var()` (e.g. `--color-text-muted`), so the contrast test must resolve recursively. This is recorded in the data model |
| Publish entities | `deploy/` does not exist yet | No domain layer to diff |
| `themes` / `people` / `projects` | `src/content.config.ts` | Untouched by this feature |

No `_drift/*.sql` was proposed.

## Additions made by data-model (⚑, review before `tasks`)

1. **`version: 1` in `.publish-record.json`.** ADR-0002's neutral consequence ("read both
   versions for one publish") needs a way to tell the versions apart.
2. **`rules-conflict` check.** A path in both `protected.txt` and `approved-removals.txt` fails the
   check job. Spec and SAD leave this overlap undefined.
3. **Rules-file grammar.** `#` comments and blank lines are allowed; globs are not, which keeps
   AC-12's exact-match rule checkable.
4. **Unreadable record = no matching record.** With deletion on it stops the publish (AC-12);
   with deletion off the publish goes ahead and reports a warning.
5. **Stale approvals ignored.** Approved paths already gone from the server do not break the
   AC-12 exact match; they are reported as warnings.
6. **`removalLimit` pinned to the literal 20** in the settings schema, per sad §11.

## Open items

- ~~TBD: an unknown file at an address the build now uses~~ **Resolved 2026-10-04 (in
  `tasks`):** overwrite and report a warning. data-model §`SERVER_FILE` is updated.
- **SAD/ADR inconsistency:** sad §6 "Flags for design" says "The record does not carry the source
  commit", but Accepted ADR-0002 says the record holds "every path … with its SHA-256, plus the
  commit and the time". The data model follows the ADR (`commit` field). Fix the SAD flag line.
  `sad.md` has uncommitted edits from the sequences stage, so it was not touched here.
- Glossary: sad §12's ⚑ terms are still not in `CONTEXT.md` (`/sdd:glossary clean-starter`).

## Next stage

`/sdd:api clean-starter`. This feature has no endpoint or event contract, so on the `standard`
route `api` may be skipped in favour of `/sdd:tasks clean-starter`.
