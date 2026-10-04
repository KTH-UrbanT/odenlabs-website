# Publishing

Every merge to `main` (or a manual run of the **Check and deploy** workflow on
`main`) publishes the site to the shared server folder on `oden.abe.kth.se`.
The folder is shared: KTH IT and others may keep files there. A publish
therefore removes only files it can prove are the site's own, and stops before
changing anything when the build or the folder looks wrong.

Design: `docs/features/clean-starter/sad.md` and its ADRs 0002–0005.

## How a publish decides

Every server file the build does not contain is one of:

| Kind      | Meaning                                                       | What a publish does                      |
| --------- | ------------------------------------------------------------- | ---------------------------------------- |
| owned     | listed in `.publish-record.json`, written by the last publish | removed when deletion is on              |
| approved  | listed in `rules/approved-removals.txt`                       | removed when deletion is on              |
| protected | listed in `rules/protected.txt`                               | never changed                            |
| unknown   | anything else (e.g. a file KTH IT added)                      | never changed; reported on every publish |

With deletion **off** (the starting state), a publish uploads the build,
removes nothing and reports every file above for review.

A publish **stops before changing anything** and names the check when:

- the build lacks the front page (`index.html`) or the logo (`logo.svg`);
- a build file sits at a protected address;
- with deletion on: the folder has no readable publish record, or the record or
  the folder lacks the front page and logo (a wrong or empty target folder);
- with deletion on: it would remove more than **20** files and the approved
  list does not equal the planned removals exactly;
- no maintainer key is present, or encrypting the report fails.

After the swap it checks over HTTPS that the front page and logo load and that
every removed or approved address is not found. A failure fails the run; there
is no automatic rollback, and the next publish repairs from the record.

## The rules files

All three live in `deploy/rules/` and change only through a reviewed pull
request (CODEOWNERS covers `deploy/`). A malformed file fails the checks on
the pull request, so it never reaches a publish.

- `protected.txt`, `approved-removals.txt`: one path per line, relative to
  the target folder (e.g. `post/demo/index.html`). Blank lines and lines
  starting with `#` are ignored. No wildcards: each line names exactly one
  file. A path may not be in both files.
- `settings.json`: `{ "deletion": "off" | "on", "removalLimit": 20 }`. The limit
  is fixed by the spec; changing it is a spec change first.

## Reading the report

The public run log and job summary carry only counts and the name of a failed
check. The full report (the server listing, unknown, protected and removed
files) is the `publish-report` artifact of the run, encrypted to every key in
`deploy/maintainers/`. Download it from the run page, then:

```sh
unzip publish-report.zip && gpg -d publish-report.gpg
```

## Merging a Code-Owner-gated change

`deploy/`, `.github/` and the two `src/` files the worker imports
(`src/data/sections.ts`, `src/lib/navigation.ts`) need Code Owner review, and
GitHub does not let an author approve their own pull request. A sole
maintainer merges such a change in one of two ways: let the repository admin
bypass the Code Owner rule for that merge, or set required approvals to 0
while keeping Code Owner review requested once a second maintainer exists.

## Rollout

Deletion stays off until step 4. Do the steps in order.

1. **Repository settings** (GitHub → Settings):
   - **Branches:** protect `main`: require a pull request, require review from
     Code Owners, require the `check` job to pass.
   - **Environments:** create `kth-server`; under deployment branches allow
     only `main`. Move the four secrets `SSH_HOST`, `SSH_USERNAME`,
     `SSH_PRIVATE_KEY`, `SSH_TARGET_DIR` from repository secrets into this
     environment, then delete the repository-level copies.
   - **Key:** add your public GPG key as `deploy/maintainers/<your-id>.asc` (see
     that folder's README) in a reviewed pull request. Back up the private key
     offline.
2. **Probe publish** (deletion off): merge, or run the workflow on `main`. It
   checks that the server has `find`, `tar`, `mv`, `xargs` and `awk`, writes
   the first publish record and delivers the first listing. Read the report.
3. **Review the listing** in one pull request: add every file others rely on
   to `protected.txt`, and every starter file to `approved-removals.txt`.
   Anything left unknown stays in place and keeps being reported.
4. **Switch deletion on** in a reviewed pull request (`"deletion": "on"`).
   The next publish is the starter cleanup. It removes more than 20 files, so
   the approved list must equal what it plans to remove; if the run stops with
   `removal-limit`, the report lists the difference. Re-check the step-1
   settings in the same change.

To return to upload-and-list at any time, set `"deletion": "off"` in a
reviewed pull request.
