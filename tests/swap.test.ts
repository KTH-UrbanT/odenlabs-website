// Integration test for deploy/remote/swap.sh: runs the real script with the
// local `sh` against a temporary target folder.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const SCRIPT = join(process.cwd(), "deploy/remote/swap.sh");
const STAGE = ".publish-staging";

let target: string;

function put(path: string, content: string) {
  const full = join(target, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** Every file under the target (except staging) with its bytes and mtime. */
function snapshot(): Map<string, { bytes: string; mtime: number }> {
  const files = new Map<string, { bytes: string; mtime: number }>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(target, full);
      if (rel === STAGE) continue;
      if (entry.isSymbolicLink())
        files.set(rel, { bytes: `-> ${readlinkSync(full)}`, mtime: 0 });
      else if (entry.isDirectory()) walk(full);
      else
        files.set(rel, {
          bytes: readFileSync(full, "latin1"),
          mtime: statSync(full).mtimeMs,
        });
    }
  };
  walk(target);
  return files;
}

/** Stages a build: files, NUL-separated rename/remove lists and the record. */
function stage(files: Record<string, string>, remove: string[], record = "{}") {
  for (const [path, content] of Object.entries(files)) {
    put(join(STAGE, "files", path), content);
  }
  const assetsFirst = Object.keys(files).sort(
    (a, b) => Number(a.endsWith(".html")) - Number(b.endsWith(".html")),
  );
  put(join(STAGE, "swap", "rename"), assetsFirst.map((p) => `${p}\0`).join(""));
  put(join(STAGE, "swap", "remove"), remove.map((p) => `${p}\0`).join(""));
  put(join(STAGE, "swap", "record.json"), record);
}

function swap(env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.env.SWAP_SHELL ?? "sh", [SCRIPT, target], {
    encoding: "utf8",
    env,
  });
}

beforeEach(() => {
  target = mkdtempSync(join(tmpdir(), "swap-"));
  // The previous version, as the last publish left it.
  put("index.html", "old front page");
  put("logo.svg", "<svg/>");
  put("old/page.html", "a page removed from the repository");
  put("post/demo-01/index.html", "starter demo");
  put("-old.html", "an owned page whose name starts with a dash");
  put(".publish-record.json", '{"previous":true}');
  // Files the site must never touch.
  put("keep.html", "protected");
  put("kthit.txt", "unknown, from KTH IT");
  put("-dash.txt", "unknown with a leading dash");
  put("odd\nname.txt", "unknown with a newline");
  const past = new Date("2020-01-01T00:00:00Z");
  for (const p of ["keep.html", "kthit.txt", "-dash.txt", "odd\nname.txt"]) {
    utimesSync(join(target, p), past, past);
  }
});

describe("swap.sh", () => {
  it("renames the build into place, removes listed files and writes the record last", () => {
    const untouched = ["keep.html", "kthit.txt", "-dash.txt", "odd\nname.txt"];
    const before = snapshot();
    stage(
      {
        "index.html": "new front page",
        "logo.svg": "<svg/>",
        "_astro/site.abc.css": "body{}",
        "docs/a b.html": "a path with a space",
      },
      [
        "old/page.html",
        "post/demo-01/index.html",
        "-old.html",
        "already-gone.html",
      ],
      '{"version":1}',
    );

    const result = swap();

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/swap-seconds=\d+\.\d{3}\n$/);
    const after = snapshot();
    expect(after.get("index.html")?.bytes).toBe("new front page");
    expect(after.get("_astro/site.abc.css")?.bytes).toBe("body{}");
    expect(after.get("docs/a b.html")?.bytes).toBe("a path with a space");
    expect(after.has("old/page.html")).toBe(false);
    expect(after.has("post/demo-01/index.html")).toBe(false);
    expect(after.has("-old.html")).toBe(false);
    expect(existsSync(join(target, "old"))).toBe(false);
    expect(existsSync(join(target, "post"))).toBe(false);
    expect(after.get(".publish-record.json")?.bytes).toBe('{"version":1}');
    expect(existsSync(join(target, STAGE))).toBe(false);
    for (const p of untouched) expect(after.get(p)).toEqual(before.get(p));
  });

  it("changes nothing when staging is incomplete (interrupted before the rename step)", () => {
    const before = snapshot();
    put(join(STAGE, "files", "index.html"), "half-uploaded");

    const result = swap();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/staging-incomplete/);
    expect(snapshot()).toEqual(before);
  });

  it("stops before any change when a required tool is missing", () => {
    const bin = mkdtempSync(join(tmpdir(), "bin-"));
    for (const tool of [
      "sh",
      "mv",
      "mkdir",
      "rm",
      "rmdir",
      "dirname",
      "xargs",
      "date",
      "awk",
      "tar",
    ]) {
      const found = spawnSync("sh", ["-c", `command -v ${tool}`], {
        encoding: "utf8",
      }).stdout.trim();
      symlinkSync(found, join(bin, tool));
    }
    stage({ "index.html": "new" }, ["old/page.html"]);
    const before = snapshot();

    const result = swap({ PATH: bin });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/remote-tools-missing: find/);
    expect(snapshot()).toEqual(before);
  });

  it("refuses a folder at a file address without touching protected files", () => {
    put("x/x", "protected inside a folder");
    stage({ x: "new file named like the folder" }, []);
    const before = snapshot();

    const result = swap();

    expect(result.status).toBe(5);
    expect(result.stderr).toMatch(/layout-clash/);
    expect(snapshot()).toEqual(before);
  });

  it("refuses a symlinked parent and writes nothing outside the site folder", () => {
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    symlinkSync(outside, join(target, "_astro"));
    stage({ "_astro/a.css": "body{}", "index.html": "new" }, []);
    const before = snapshot();

    const result = swap();

    expect(result.status).toBe(5);
    expect(result.stderr).toMatch(/layout-clash/);
    expect(readdirSync(outside)).toEqual([]);
    expect(snapshot()).toEqual(before);
  });

  it("refuses a file where the build needs a folder before any rename", () => {
    put("a", "a file");
    stage({ "index.html": "new", "a/b.html": "needs folder a" }, []);
    const before = snapshot();

    const result = swap();

    expect(result.status).toBe(5);
    expect(result.stderr).toMatch(/layout-clash/);
    expect(snapshot()).toEqual(before);
  });

  it("prints the swap time with a decimal point whatever the locale", () => {
    const probe = spawnSync("awk", ['BEGIN { printf "%.1f", 1.5 }'], {
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "sv_SE.UTF-8" },
    });
    if (probe.stdout !== "1,5") return; // no comma-decimal locale here
    stage({ "index.html": "new" }, []);

    const result = swap({ ...process.env, LC_ALL: "sv_SE.UTF-8" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/swap-seconds=\d+\.\d{3}\n$/);
  });
});
