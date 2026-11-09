---
status: Accepted
owner: "pasichnyi"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-11-10"
feature_size: "S"
ticket: "roadmap step 1 + step 8 (go live) — docs/roadmap.md"
---

# 0006 — Publish from a self-hosted runner on the server

- **Status:** Accepted. Refines [ADR-0002](./0002-plan-each-publish-with-a-pure-planner-and-a-thin-ssh-executor.md)
  (the executor seam gains a local variant) and [ADR-0005](./0005-gate-publishing-rules-by-review-and-main-only-server-secrets.md)
  (the thing to protect becomes runner access, not a key).
- **Date:** 2026-11-10
- **Deciders:** pasichnyi (maintainer, architect), with Claude

## Context

The site is served from a VPS the group controls: an nginx container mounts `./public` read-only, behind
Nginx Proxy Manager. The VPS also runs unrelated services. The maintainer registered a GitHub self-hosted
runner (`oden-kvs`) on that VPS. ADR-0002 and ADR-0005 assumed a GitHub-hosted runner that reaches the
server over SSH with a key held in the main-only `kth-server` environment.

The repository is **public**. A self-hosted runner executes whatever a workflow tells it to, so any workflow
in the repository that asks for its labels could run code on the VPS. An environment's branch rule does not
cover that: it protects secrets, not runner access.

## Decision drivers

- AC-08 and quality goal 1 (sad §1): nothing unreviewed may change what is published or deleted.
- One maintainer, one VPS shared with other services: least privilege matters more than convenience.
- The publish code is already proven against a local executor (ADR-0002's test double).

## Considered options

1. **Keep SSH from a GitHub-hosted runner.** Unchanged, but the server key stays in GitHub and the VPS needs
   SSH reachable from the internet for the deploy account.
2. **Self-hosted runner on the VPS, publish through the local executor.** No key exists. The runner's own
   account is the credential.
3. **Self-hosted runner for everything (checks too).** Rejected: pull requests, including ones from forks,
   would then run on the VPS.

## Decision outcome

**Chosen:** option 2, with these controls. Each one is needed; none is optional.

- **Only the `deploy` job uses the runner** (`runs-on: [self-hosted, oden-deploy]`). It runs only on `main`,
  in the `kth-server` environment, after `check`. The `check` job stays on `ubuntu-latest`.
  `tests/workflow.test.ts` fails if a second job or the check job names the runner.
- **The runner group is limited to this workflow file on `main`** (organisation → Settings → Actions →
  Runner groups → *Selected workflows*: `KTH-UrbanT/odenlabs-website/.github/workflows/publish.yaml@refs/heads/main`).
  This is the lock against a branch workflow reaching the VPS. It lives outside git, like ADR-0005's
  settings, and is part of the rollout checklist.
- **The runner service runs as `odenlabs-deploy`**, an account that owns `public/` and nothing else. It is not
  in the `docker` group and has no sudo. A compromised job can therefore change the site folder, not the
  VPS.
- **No secrets.** The four `SSH_*` secrets are deleted. `PUBLISH_MODE=local` and `TARGET_DIR` are plain values
  in the workflow, so they are reviewed like code (CODEOWNERS covers `.github/`).
- **The workspace is cleaned.** A self-hosted runner keeps its workspace, so the job removes `dist/` and the
  old report before downloading the artifact. Otherwise a stale file could be published.
- **Fork pull requests need approval** (Settings → Actions → General → *Require approval for all outside
  collaborators*). Their runs are hosted-only anyway; this keeps the default tight.
- `targetFromEnv` rejects a relative path or `/` as the local target. SSH mode stays available.

## Consequences

**Positive**
- No long-lived server credential exists in GitHub.
- No inbound SSH is needed for deploys, and the publish report and rules work unchanged.

**Negative**
- The controls above sit in organisation and repository settings, not in git, and can drift. The README
  rollout lists them; re-check them whenever the runner is re-registered.
- The runner is a standing process on a shared VPS. Updating it (and the host) is the maintainer's job.
- If the runner is offline, deploys queue until it returns. The `check` job and merging are unaffected.
- The post-publish HTTPS check runs from the VPS to its own public address; it relies on that route working.

**Neutral**
- ADR-0003 (staging and rename) and ADR-0004 (encrypted report) are unchanged: the same commands run through
  the local `sh` instead of SSH.
