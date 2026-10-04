// End-to-end test of the publish shell through the local executor: the same
// remote commands, run with the local `sh` against a temporary target folder.
// Encryption is replaced by a recording fake (gpg is covered in report.test.ts).
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { publish, type PublishOptions } from "../deploy/publish.ts";
import type { PublishReport } from "../deploy/report.ts";
import { localExecutor, type Executor } from "../deploy/ssh.ts";
import { COMMIT, starterFiles } from "./fixtures/publish.ts";

let root: string;
let target: string;
let dist: string;
let rulesDir: string;

function put(base: string, path: string, content: string) {
  const full = join(base, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function files(base: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else out[relative(base, full)] = readFileSync(full, "latin1");
    }
  };
  walk(base);
  return out;
}

function setRules(r: {
  protected?: string[];
  approved?: string[];
  deletion?: "on" | "off";
}) {
  put(rulesDir, "protected.txt", (r.protected ?? []).join("\n"));
  put(rulesDir, "approved-removals.txt", (r.approved ?? []).join("\n"));
  put(
    rulesDir,
    "settings.json",
    JSON.stringify({ deletion: r.deletion ?? "off", removalLimit: 20 }),
  );
}

/** Answers like the KTH server: 200 for a file in the target, else 404. */
async function serverStatus(url: string): Promise<number> {
  let path = decodeURIComponent(new URL(url).pathname).slice(1);
  if (path === "" || path.endsWith("/")) path += "index.html";
  return existsSync(join(target, path)) ? 200 : 404;
}

/** Records every command, so a test can prove nothing mutating ran. */
function recording(executor: Executor) {
  const commands: string[] = [];
  return {
    commands,
    executor: {
      run(command: string, input?: Buffer) {
        commands.push(command);
        return executor.run(command, input);
      },
    },
  };
}

let encrypted: string[];
let summary: string;

function options(overrides: Partial<PublishOptions> = {}): PublishOptions {
  return {
    distDir: dist,
    rulesDir,
    maintainersDir: join(root, "maintainers"),
    targetDir: target,
    siteUrl: "https://site.example.test/",
    commit: COMMIT,
    reportFile: join(root, "publish-report.gpg"),
    executor: localExecutor(),
    fetchStatus: serverStatus,
    encrypt: (text) => {
      encrypted.push(text);
      return { fingerprints: ["F00"] };
    },
    writeSummary: (text) => {
      summary = text;
    },
    log: () => {},
    ...overrides,
  };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "publish-"));
  target = join(root, "server");
  dist = join(root, "dist");
  rulesDir = join(root, "rules");
  encrypted = [];
  summary = "";
  // The build.
  put(dist, "index.html", "new front page");
  put(dist, "404.html", "not found");
  put(dist, "logo.svg", "<svg/>");
  put(dist, "_astro/site.abc.css", "body{}");
  // The server as the starter left it, plus files others put there.
  for (const p of starterFiles(3)) put(target, p, "starter demo");
  put(target, "index.html", "starter front page");
  put(target, "logo.svg", "<svg/>");
  put(target, ".htaccess", "protected");
  put(target, "kthit.txt", "unknown");
  setRules({ protected: [".htaccess"] });
});

describe("publish", () => {
  it("first publish with deletion off: uploads, deletes nothing, writes the record, lists the rest (AC-07)", async () => {
    const result = await publish(options());

    expect(result.ok).toBe(true);
    const server = files(target);
    expect(server["index.html"]).toBe("new front page");
    expect(server["_astro/site.abc.css"]).toBe("body{}");
    for (const p of starterFiles(3)) expect(server[p]).toBe("starter demo");
    expect(server[".htaccess"]).toBe("protected");
    expect(server["kthit.txt"]).toBe("unknown");
    expect(existsSync(join(target, ".publish-staging"))).toBe(false);
    const record = JSON.parse(server[".publish-record.json"]);
    expect(record.version).toBe(1);
    expect(record.commit).toBe(COMMIT);
    expect(record.files.map((f: { path: string }) => f.path)).toEqual([
      "404.html",
      "_astro/site.abc.css",
      "index.html",
      "logo.svg",
    ]);
    expect(encrypted.at(-1)).toContain("kthit.txt");
    expect(encrypted.at(-1)).toContain(starterFiles(1)[0]);
  });

  it("encrypts the planned report before uploading anything", async () => {
    const { commands, executor } = recording(localExecutor());
    let uploadedBeforeEncrypt = false;
    await publish(
      options({
        executor,
        encrypt: (text) => {
          if (encrypted.length === 0) {
            uploadedBeforeEncrypt = commands.some((c) => c.includes("tar -xf"));
          }
          encrypted.push(text);
          return { fingerprints: ["F00"] };
        },
      }),
    );
    expect(encrypted.length).toBeGreaterThanOrEqual(1);
    expect(uploadedBeforeEncrypt).toBe(false);
  });

  it("warns publicly about a planned section whose page is missing, and still publishes (AC-04)", async () => {
    const result = await publish(options());
    expect(result.ok).toBe(true);
    expect(summary).toMatch(
      /Research \(\/research\/\) points to a missing page/,
    );
  });

  it("keeps file names out of the public summary (AC-09)", async () => {
    await publish(options());
    expect(summary).not.toContain("kthit.txt");
    expect(summary).not.toContain("demo-01");
  });

  it("with deletion on, removes approved starter files and leaves protected and unknown files (AC-01, AC-11, AC-13)", async () => {
    await publish(options());
    setRules({
      protected: [".htaccess"],
      approved: starterFiles(3),
      deletion: "on",
    });

    const result = await publish(options());

    expect(result.ok).toBe(true);
    const server = files(target);
    for (const p of starterFiles(3)) expect(server[p]).toBeUndefined();
    expect(server[".htaccess"]).toBe("protected");
    expect(server["kthit.txt"]).toBe("unknown");
    expect(result.report.entries).toContainEqual({
      kind: "unknown",
      path: "kthit.txt",
    });
    expect(
      result.report.entries
        .filter((e) => e.kind === "removed")
        .map((e) => e.path),
    ).toEqual(starterFiles(3));
  });

  it("with deletion on, removes a page dropped from the build (AC-10)", async () => {
    put(dist, "research/index.html", "research");
    await publish(options());
    setRules({ protected: [".htaccess"], deletion: "on" });
    await publish(options());
    expect(existsSync(join(target, "research/index.html"))).toBe(true);

    rmSync(join(dist, "research"), { recursive: true });
    const result = await publish(options());

    expect(result.ok).toBe(true);
    expect(existsSync(join(target, "research/index.html"))).toBe(false);
    expect(await serverStatus("https://site.example.test/research/")).toBe(404);
  });

  it("stops before any server change on a protected clash, writing the encrypted listing (AC-11b)", async () => {
    setRules({ protected: ["logo.svg"] });
    const before = files(target);
    const { commands, executor } = recording(localExecutor());

    const result = await publish(options({ executor }));

    expect(result.ok).toBe(false);
    expect(result.report.failedCheck).toBe("protected-clash");
    expect(files(target)).toEqual(before);
    expect(commands.some((c) => c.includes("tar -xf"))).toBe(false);
    expect(commands.some((c) => c.includes("swap.sh"))).toBe(false);
    expect(encrypted.at(-1)).toContain("kthit.txt");
    expect(summary).toContain("protected-clash");
  });

  it("stops before uploading when encryption fails", async () => {
    const before = files(target);
    const result = await publish(
      options({
        encrypt: () => {
          throw Object.assign(new Error("encryption-failed: gpg"), {
            check: "encryption-failed",
          });
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.report.failedCheck).toBe("encryption-failed");
    expect(files(target)).toEqual(before);
    expect(summary).toContain("encryption-failed");
  });

  it("fails the run when the post-publish check fails, without rolling back", async () => {
    const result = await publish(
      options({
        fetchStatus: async (url) =>
          url.endsWith("logo.svg") ? 500 : serverStatus(url),
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.report.outcome).toBe("post-check-failed");
    expect(result.report.failedCheck).toBe("post-publish-check");
    expect(files(target)["index.html"]).toBe("new front page");
  });

  it("stops with deletion on and no previous record, before deleting (AC-12)", async () => {
    setRules({ approved: starterFiles(3), deletion: "on" });
    const before = files(target);
    const result = await publish(options());
    expect(result.ok).toBe(false);
    expect(result.report.failedCheck).toBe("no-previous-record");
    expect(files(target)).toEqual(before);
  });

  it("skips an unreadable folder someone else owns, without naming it", async () => {
    put(target, "kthit-private/secret.txt", "unreadable");
    chmodSync(join(target, "kthit-private"), 0o000);
    const lines: string[] = [];
    try {
      const result = await publish(options({ log: (l) => lines.push(l) }));
      expect(result.ok).toBe(true);
      expect([...lines, summary].join("\n")).not.toContain("kthit-private");
    } finally {
      chmodSync(join(target, "kthit-private"), 0o755);
    }
  });

  it("a re-run of the same publish changes nothing further", async () => {
    await publish(options());
    const after = files(target);
    const again = await publish(options());
    expect(again.ok).toBe(true);
    const rerun = files(target);
    delete after[".publish-record.json"];
    delete rerun[".publish-record.json"];
    expect(rerun).toEqual(after);
  });
});

describe("the public report shape", () => {
  it("types the result report as a PublishReport", async () => {
    const result = await publish(options());
    const report: PublishReport = result.report;
    expect(report.deletion).toBe("off");
  });
});
