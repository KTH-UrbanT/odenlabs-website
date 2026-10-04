import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PublishError,
  encryptReport,
  formatReport,
  maintainerKeyFiles,
  publicSummary,
  type PublishReport,
} from "../deploy/report.ts";
import { COMMIT } from "./fixtures/publish.ts";

const SECRET = "kthit-verification-7f3a.html";

const report: PublishReport = {
  commit: COMMIT,
  startedAt: "2026-10-04T12:00:00.000Z",
  deletion: "off",
  outcome: "published",
  failedCheck: null,
  detail: null,
  swapSeconds: 0.42,
  entries: [
    { kind: "uploaded", path: "index.html" },
    { kind: "uploaded", path: "logo.svg" },
    { kind: "owned-pending", path: "old.html" },
    { kind: "protected", path: ".htaccess" },
    { kind: "unknown", path: SECRET },
    { kind: "unknown", path: "odd\nname", malformed: true },
    { kind: "warning", path: "gone.html", message: "no longer on the server" },
  ],
};

const hasGpg = spawnSync("gpg", ["--version"]).status === 0;

describe("publicSummary", () => {
  it("carries counts per kind, the outcome and the swap time", () => {
    const summary = publicSummary(report, []);
    expect(summary).toMatch(/published/);
    expect(summary).toMatch(/Uploaded\D+2/);
    expect(summary).toMatch(/Unknown\D+2/);
    expect(summary).toMatch(/0\.42/);
  });

  it("never names a server file (AC-09)", () => {
    const summary = publicSummary(report, []);
    for (const entry of report.entries) {
      expect(summary).not.toContain(entry.path);
    }
  });

  it("names the failed check but not its detail", () => {
    const stopped: PublishReport = {
      ...report,
      outcome: "stopped",
      failedCheck: "removal-limit",
      detail: `21 removals, including ${SECRET}`,
    };
    const summary = publicSummary(stopped, []);
    expect(summary).toContain("removal-limit");
    expect(summary).not.toContain(SECRET);
  });

  it("includes public notes such as missing navigation pages (AC-04)", () => {
    const summary = publicSummary(report, [
      "Navigation entry People (/people/) points to a missing page",
    ]);
    expect(summary).toContain("People (/people/) points to a missing page");
  });
});

describe("formatReport", () => {
  it("lists every entry by kind for the maintainer's review (AC-07)", () => {
    const text = formatReport(report);
    expect(text).toContain(SECRET);
    expect(text).toMatch(/Unknown[\s\S]*kthit-verification/);
    expect(text).toMatch(/Protected[\s\S]*\.htaccess/);
    expect(text).toContain(JSON.stringify("odd\nname"));
  });
});

describe("maintainerKeyFiles", () => {
  it("lists the .asc files of the maintainers folder", () => {
    const dir = mkdtempSync(join(tmpdir(), "keys-"));
    writeFileSync(join(dir, "jane-doe.asc"), "key");
    writeFileSync(join(dir, "README.md"), "not a key");
    expect(maintainerKeyFiles(dir)).toEqual([join(dir, "jane-doe.asc")]);
  });
});

describe("encryptReport", () => {
  const out = () => join(mkdtempSync(join(tmpdir(), "out-")), "report.gpg");

  it("stops with no-maintainer-key when there is no key", () => {
    expect(() => encryptReport("text", [], out())).toThrow(PublishError);
    try {
      encryptReport("text", [], out());
    } catch (e) {
      expect((e as PublishError).check).toBe("no-maintainer-key");
    }
  });

  it("stops with encryption-failed when gpg fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "keys-"));
    writeFileSync(join(dir, "jane-doe.asc"), "key");
    try {
      encryptReport("text", [join(dir, "jane-doe.asc")], out(), {
        gpg: "false",
      });
      expect.unreachable();
    } catch (e) {
      expect((e as PublishError).check).toBe("encryption-failed");
    }
  });

  it.skipIf(!hasGpg)(
    "round-trips: only the maintainer's private key opens the report (AC-09)",
    () => {
      const home = mkdtempSync(join(tmpdir(), "gnupg-"));
      const gpg = (...args: string[]) =>
        spawnSync("gpg", ["--homedir", home, "--batch", ...args], {
          encoding: "utf8",
        });
      gpg(
        "--passphrase",
        "",
        "--quick-gen-key",
        "Test Maintainer <maintainer@example.test>",
        "default",
        "default",
        "never",
      );
      const keyFile = join(home, "test-maintainer.asc");
      writeFileSync(keyFile, gpg("--armor", "--export").stdout);
      const file = out();

      const { fingerprints } = encryptReport(
        formatReport(report),
        [keyFile],
        file,
      );

      expect(fingerprints).toHaveLength(1);
      expect(readFileSync(file, "latin1")).not.toContain(SECRET);
      expect(gpg("--decrypt", file).stdout).toContain(SECRET);
    },
  );
});
