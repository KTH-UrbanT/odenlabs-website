// Guards the publishing controls in the workflow and CODEOWNERS (ADR-0005):
// only main publishes, through the guarded worker, with secrets from the
// main-only kth-server environment, and maintainers own the rules.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/publish.yaml", "utf8");
const deployJob = workflow.slice(workflow.indexOf("\n  deploy:"));

describe("publish workflow", () => {
  it("publishes through the guarded worker, not an upload-only action", () => {
    expect(workflow).not.toContain("scp-action");
    expect(deployJob).toContain("node deploy/publish.ts");
  });

  it("runs the deploy job only on main, in the kth-server environment", () => {
    expect(deployJob).toMatch(/environment:\s*kth-server/);
    expect(deployJob).toMatch(
      /if: github\.event_name != 'pull_request' && github\.ref == 'refs\/heads\/main'/,
    );
    expect(deployJob).toMatch(/needs: check/);
  });

  it("never cancels a running publish", () => {
    expect(workflow).toContain(
      "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    );
    expect(deployJob).toMatch(/group: deploy-kth\s+cancel-in-progress: false/);
  });

  it("keeps the encrypted report as an artifact, even when the publish fails", () => {
    expect(deployJob).toMatch(
      /if: always\(\)[\s\S]*name: publish-report[\s\S]*publish-report\.gpg/,
    );
  });
});

describe("CODEOWNERS", () => {
  it("makes the maintainer own deploy/ and .github/", () => {
    const owners = readFileSync(".github/CODEOWNERS", "utf8");
    expect(owners).toMatch(/^\/deploy\/\s+@pasichnyi$/m);
    expect(owners).toMatch(/^\/\.github\/\s+@pasichnyi$/m);
  });
});
