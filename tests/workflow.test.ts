// Guards the publishing controls in the workflow and CODEOWNERS (ADR-0005):
// only main publishes, through the guarded worker, with secrets from the
// main-only kth-server environment, and maintainers own the rules.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/publish.yaml", "utf8");
const deployJob = workflow.slice(workflow.indexOf("\n  deploy:"));

const checkoutOf = (job: string) => job.slice(job.indexOf("actions/checkout"));

describe("publish workflow", () => {
  it("grants the job token read-only access and does not persist it in the deploy job", () => {
    expect(workflow).toMatch(/^permissions:\s+contents: read$/m);
    expect(workflow.indexOf("permissions:")).toBeLessThan(
      workflow.indexOf("\njobs:"),
    );
    expect(checkoutOf(deployJob)).toMatch(
      /actions\/checkout@v4\s+with:\s+persist-credentials: false/,
    );
  });

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

// Every repo file the deploy step loads while SSH_PRIVATE_KEY is in the
// environment: relative imports reachable from deploy/publish.ts.
function reachableFrom(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(
      /^import\s+(type\s+)?[^;]*?from\s+"(\.[^"]+)"/gms,
    )) {
      const base = join(dirname(file), m[2]);
      const target = [base, `${base}.ts`].find((p) => existsSync(p));
      if (target) queue.push(target);
      // A runtime import the walk can't follow would hide code from the check.
      else if (!m[1]) throw new Error(`${file}: cannot resolve import ${m[2]}`);
    }
  }
  return [...seen];
}

describe("CODEOWNERS coverage of the deploy step", () => {
  const owners = readFileSync(".github/CODEOWNERS", "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split(/\s+/)[0]);
  const covered = (file: string) =>
    owners.some((p) =>
      p.endsWith("/") ? `/${file}`.startsWith(p) : `/${file}` === p,
    );

  it("finds the imports of the deploy step", () => {
    const files = reachableFrom("deploy/publish.ts");
    expect(files).toContain("src/data/sections.ts");
    expect(files).toContain("src/lib/navigation.ts");
  });

  it("covers every file reachable from deploy/publish.ts", () => {
    const uncovered = reachableFrom("deploy/publish.ts").filter(
      (f) => !covered(f),
    );
    expect(uncovered).toEqual([]);
  });
});
