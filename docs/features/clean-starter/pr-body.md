## Summary

Replaces the starter on `oden.abe.kth.se` safely: a planned, staged, reviewable publish that never
removes protected files, plus a not-found page and a header that offers only sections that exist.
Deletion ships **off**. See [spec](docs/features/clean-starter/spec.md) and the
[changelog](docs/features/clean-starter/changelog.md).

## Acceptance criteria

- AC-01 — approved starter files are removed and listed ✓
- AC-02 — dead links get a styled not-found page, 404 + noindex ✓
- AC-03 / AC-04 — header offers only sections whose page exists; missing ones are reported ✓
- AC-06 — a colour pair below the readability minimum fails the test step ✓
- AC-07 / AC-07b / AC-08 / AC-09 — first publish uploads without deleting; authorization gates ✓
- AC-10 — a removed page disappears and is listed ✓
- AC-11 / AC-11b — protected files are never touched; a clash stops the publish ✓
- AC-12 / AC-13 / AC-13b — unsafe plans stop before any change; unknown files are kept and reported ✓
- AC-14 — no starter files or licence remain ✓
- **Not met:** AC-05 (identity sign-off) and AC-15 (front-page copy), blocked on the maintainer (spec §8, T5–T7)

## Design

- Spec: `docs/features/clean-starter/spec.md`
- Architecture: `docs/features/clean-starter/sad.md`
- Decisions: `docs/features/clean-starter/adr/` (0001–0005)
- Data model: `docs/features/clean-starter/data-model.md` (no migrations)
- Reviews: `docs/features/clean-starter/_review/` (eleven passes, latest PASS 2026-10-09)

## Tasks (SDD-Task trailers)

T1–T4, T8–T41 done; T5–T7 blocked. List with `git log --grep SDD-Task main..HEAD`.

## Verification

- Unit + build smoke test: `npm test`, 362 passed, 1 skipped (GPG round-trip, runs in CI)
- Lint: `npm run lint`, 0 errors / 0 warnings / 0 hints, Prettier clean
- Ran the feature (2026-10-09, local, no server). `npm run build` produced `dist/` with `404.html`, `index.html`, `logo.svg`,
  `icon.png`; `404.html` has `<meta name="robots" content="noindex">` and the title "Page not found" (AC-02). The header of the
  built front page is empty because no planned section has a page yet (AC-03). Then the real `publish()` was driven against a
  scratch server folder (starter files, a KTH IT file, a protected file) through the local executor:
  - AC-07 / AC-04: with `deletion: off` everything was uploaded, nothing was deleted, and the report listed the unknown files
    and warned about the three navigation entries without a page.
  - AC-01 / AC-11: with `deletion: on` and the two starter files approved, only those two were removed and listed; the
    protected file and the unknown KTH IT file stayed.
  - AC-11b: a build containing the protected file's address stopped with `protected-clash` and the file was unchanged.
  - A first run on `deletion: on` with no valid publish record stopped with `no-previous-record` (the intended guard).
  Not re-run this session: AC-06 contrast failure (covered by `tests/contrast.test.ts`), AC-10 and AC-13 (covered by
  `tests/publish.test.ts` and `tests/plan.test.ts`).
- **Deferred:** a real SSH publish to the KTH server (needs the server and secrets; covered by the swap
  and planner tests and by the rollout runbook's first `deletion: off` publish).

## Operational notes

- Migration: none.
- Config: `deploy/rules/settings.json` ships `deletion: "off"`; switch on only after the rollout steps in `deploy/README.md`.
- Rollback: revert and republish.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
