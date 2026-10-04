// The publish shell (ADR-0002, ADR-0003, ADR-0004): gathers the inputs, asks
// the pure planner for a plan, and applies an accepted plan in a fixed order:
//
//   read rules → list folder + read record → plan → encrypt report
//   → upload archive into staging → swap → verify over HTTPS → final report
//
// Nothing changes on the server before the plan is accepted and the report
// is encrypted. A failed run is never retried automatically; the next publish
// repairs from the record.
//
// Run in CI as `node deploy/publish.ts` (see .github/workflows/publish.yaml).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { sections } from "../src/data/sections.ts";
import { hrefToFile, missingPlannedPages } from "../src/lib/navigation.ts";
import {
  FRONT_PAGE,
  LOGO,
  RECORD_FILE,
  STAGING_DIR,
  inspectRecord,
  parseRules,
  planPublish,
  type FailedCheck,
  type PublishRecord,
  type RecordProblem,
  type ReportEntry,
} from "./plan.ts";
import {
  PublishError,
  encryptReport,
  formatReport,
  maintainerKeyFiles,
  publicSummary,
  type PublishReport,
} from "./report.ts";
import { shq, sshExecutor, type Executor } from "./ssh.ts";

const HERE = fileURLToPath(new URL(".", import.meta.url));

export interface PublishOptions {
  distDir: string;
  rulesDir: string;
  maintainersDir: string;
  targetDir: string;
  siteUrl: string;
  commit: string;
  reportFile: string;
  executor: Executor;
  fetchStatus?: (url: string) => Promise<number>;
  encrypt?: (
    text: string,
    keyFiles: string[],
    outFile: string,
  ) => { fingerprints: string[] };
  writeSummary?: (markdown: string) => void;
  log?: (line: string) => void;
}

export interface PublishResult {
  ok: boolean;
  report: PublishReport;
}

/** Every file under `dir`, relative, sorted. */
function listFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out.push(relative(dir, full));
    }
  };
  walk(dir);
  return out.sort();
}

const sha256 = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

const nul = (paths: string[]) => paths.map((p) => `${p}\0`).join("");

async function httpStatus(url: string): Promise<number> {
  const response = await fetch(url, { method: "GET", redirect: "manual" });
  return response.status;
}

/** Publishes one build. Never throws for a stop: the result says why. */
export async function publish(options: PublishOptions): Promise<PublishResult> {
  const {
    executor,
    targetDir,
    log = (line) => console.log(line),
    encrypt = encryptReport,
    fetchStatus = httpStatus,
    writeSummary = () => {},
  } = options;
  const cd = `cd -- ${shq(targetDir)}`;

  const rules = parseRules({
    protectedText: readFileSync(
      join(options.rulesDir, "protected.txt"),
      "utf8",
    ),
    approvedText: readFileSync(
      join(options.rulesDir, "approved-removals.txt"),
      "utf8",
    ),
    settingsText: readFileSync(join(options.rulesDir, "settings.json"), "utf8"),
  });
  const build = listFiles(options.distDir);
  const missingNav = missingPlannedPages(sections, new Set(build));
  const publicNotes = missingNav.map(
    (s) => `Navigation entry ${s.label} (${s.href}) points to a missing page`,
  );
  const navWarnings: ReportEntry[] = missingNav.map((s) => ({
    kind: "warning",
    path: hrefToFile(s.href),
    message: `navigation entry ${s.label} points to a missing page`,
  }));

  const report: PublishReport = {
    commit: options.commit,
    startedAt: new Date().toISOString(),
    deletion: rules.settings.deletion,
    outcome: "stopped",
    failedCheck: null,
    detail: null,
    entries: [],
    swapSeconds: null,
    unreadableFolders: 0,
  };

  const keyFiles = () => maintainerKeyFiles(options.maintainersDir);
  let loggedKeys = false;
  const seal = () => {
    const { fingerprints } = encrypt(
      formatReport(report),
      keyFiles(),
      options.reportFile,
    );
    if (!loggedKeys) {
      loggedKeys = true;
      log(`publish: report encrypted to keys ${fingerprints.join(", ")}`);
    }
  };
  const finish = (ok: boolean): PublishResult => {
    writeSummary(publicSummary(report, publicNotes));
    log(
      ok
        ? `publish: ${report.outcome}`
        : `publish: ${report.outcome} (${report.failedCheck})`,
    );
    return { ok, report };
  };
  const stop = (
    check: FailedCheck,
    detail: string,
    outcome: PublishReport["outcome"] = "stopped",
  ): PublishResult => {
    report.outcome = outcome;
    report.failedCheck = check;
    report.detail = detail;
    try {
      seal();
    } catch (e) {
      log(`publish: could not encrypt the report (${(e as Error).message})`);
    }
    return finish(false);
  };
  const checkOf = (e: unknown): FailedCheck | null =>
    e instanceof PublishError ||
    (typeof e === "object" && e !== null && "check" in e)
      ? ((e as PublishError).check as FailedCheck)
      : null;

  // 1. List the target folder and read the previous record. Wipe any staging
  //    left by an interrupted publish first.
  const probe = executor.run(
    "for t in find tar mv xargs awk rmdir dirname mkdir rm; do " +
      'command -v "$t" >/dev/null 2>&1 || { echo "$t"; exit 1; }; done',
  );
  if (probe.status !== 0) {
    return stop(
      "remote-tools-missing",
      `missing on the server: ${probe.stdout.toString("utf8").trim()}`,
    );
  }
  const cleaned = executor.run(`${cd} && rm -rf -- ${STAGING_DIR}`);
  if (cleaned.status !== 0) {
    return stop("listing-failed", "could not prepare the target folder");
  }
  // Unreadable folders (someone else's) are skipped, not fatal: their files
  // would be unknown and never touched anyway. They are counted, never named.
  // Any other find error is a failed listing, not an empty one.
  const listed = executor.run(
    `${cd} && LC_ALL=C find . \\( -type f -o -type l \\) -print0`,
  );
  const findErrors = listed.stderr.split("\n").filter((l) => l.trim() !== "");
  const denied = findErrors.filter((l) => /: Permission denied$/.test(l));
  if (
    listed.status !== 0 &&
    (denied.length === 0 || denied.length !== findErrors.length)
  ) {
    // No stderr in the message: it could name server files.
    return stop("listing-failed", "listing the target folder failed");
  }
  report.unreadableFolders = denied.length;
  const listing = listed.stdout
    .toString("utf8")
    .split("\0")
    .filter((p) => p !== "");
  const recordRead = executor.run(
    `${cd} && if [ -f ${RECORD_FILE} ]; then cat ${RECORD_FILE}; else exit 7; fi`,
  );
  const inspected = inspectRecord(
    recordRead.status === 0 ? recordRead.stdout.toString("utf8") : null,
  );
  const record = inspected.record;
  let recordProblem: RecordProblem | null = inspected.problem;
  if (recordRead.status !== 0 && recordRead.status !== 7) {
    recordProblem = "unreadable";
  }
  const recordWarnings: ReportEntry[] =
    recordProblem === "unreadable" || recordProblem === "malformed-path"
      ? [
          {
            kind: "warning",
            path: RECORD_FILE,
            message: `publish record ${recordProblem === "unreadable" ? "unreadable" : "lists a malformed path"}; treated as no record`,
          },
        ]
      : [];

  // 2. Plan.
  const plan = planPublish({ build, listing, record, recordProblem, rules });
  const unreadableWarnings: ReportEntry[] =
    report.unreadableFolders > 0
      ? [
          {
            kind: "warning",
            path: ".",
            message: `${report.unreadableFolders} unreadable folders skipped`,
          },
        ]
      : [];
  report.entries = [
    ...plan.entries,
    ...navWarnings,
    ...recordWarnings,
    ...unreadableWarnings,
  ];
  if (!plan.ok) return stop(plan.failedCheck, plan.detail);

  // 3. Encrypt the planned report before anything is uploaded. Until the
  //    run ends it is an interim report: neither stopped nor published.
  report.outcome = "in-progress";
  try {
    seal();
  } catch (e) {
    return stop(checkOf(e) ?? "encryption-failed", (e as Error).message);
  }

  // 4. Stage: build files, rename and remove lists, the new record, the swap
  //    script; one archive streamed into the staging folder.
  const newRecord: PublishRecord = {
    version: 1,
    commit: options.commit,
    publishedAt: new Date().toISOString(),
    files: [
      ...plan.upload.map((path) => ({
        path,
        sha256: sha256(join(options.distDir, path)),
      })),
      // Owned files this publish left in place keep their old hash, so a later
      // publish with deletion on still removes them.
      ...plan.carry,
    ].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
  };
  const local = mkdtempSync(join(tmpdir(), "publish-stage-"));
  try {
    cpSync(options.distDir, join(local, "files"), { recursive: true });
    mkdirSync(join(local, "swap"));
    const isPage = (p: string) => p.endsWith(".html");
    const rename = [
      ...plan.upload.filter((p) => !isPage(p)),
      ...plan.upload.filter(isPage),
    ];
    writeFileSync(join(local, "swap", "rename"), nul(rename));
    writeFileSync(join(local, "swap", "remove"), nul(plan.remove));
    writeFileSync(
      join(local, "swap", "record.json"),
      `${JSON.stringify(newRecord, null, 2)}\n`,
    );
    copyFileSync(
      join(HERE, "remote", "swap.sh"),
      join(local, "swap", "swap.sh"),
    );
    const archive = spawnSync("tar", ["-cf", "-", "-C", local, "."], {
      env: { ...process.env, COPYFILE_DISABLE: "1" },
      maxBuffer: 1024 * 1024 * 1024,
    });
    if (archive.status !== 0) {
      return stop(
        "upload-failed",
        "packing the build failed",
        "failed-before-swap",
      );
    }
    const upload = executor.run(
      `${cd} && mkdir -- ${STAGING_DIR} && tar -xf - -C ${STAGING_DIR}`,
      archive.stdout,
    );
    if (upload.status !== 0) {
      return stop(
        "upload-failed",
        `uploading the build failed: ${upload.stderr.trim()}`,
        "failed-before-swap",
      );
    }
  } finally {
    rmSync(local, { recursive: true, force: true });
  }

  // 5. Swap into place; the script writes the record last. Exit codes 3, 4
  //    and 5 are refusals before the first rename: the site is unchanged.
  const swap = executor.run(`${cd} && sh ${STAGING_DIR}/swap/swap.sh .`);
  if (swap.status !== 0) {
    const detail = swap.stderr.trim();
    if (swap.status === 3) {
      return stop("remote-tools-missing", detail, "failed-before-swap");
    }
    if (swap.status === 5) {
      return stop("layout-clash", detail, "failed-before-swap");
    }
    if (swap.status === 4) {
      return stop("upload-failed", detail, "failed-before-swap");
    }
    return stop("swap-failed", detail, "failed-during-swap");
  }
  const seconds = /swap-seconds=([\d.]+)/.exec(swap.stdout.toString("utf8"));
  report.swapSeconds = seconds ? Number(seconds[1]) : null;
  report.outcome = "published";

  // 6. Verify over HTTPS: the front page and logo load; every removed or
  //    approved (reviewed starter) address is not found.
  const url = (path: string) => new URL(path, options.siteUrl).toString();
  const failures: string[] = [];
  const safeStatus = async (address: string): Promise<number | string> => {
    try {
      return await fetchStatus(address);
    } catch {
      return "request failed";
    }
  };
  for (const path of ["", LOGO]) {
    const status = await safeStatus(url(path));
    if (status !== 200) failures.push(`/${path || FRONT_PAGE} → ${status}`);
  }
  const gone = new Set(plan.remove);
  if (rules.settings.deletion === "on") {
    for (const p of rules.approved) gone.add(p);
  }
  for (const path of gone) {
    const addresses = path.endsWith("/index.html")
      ? [path, path.slice(0, -"index.html".length)]
      : [path];
    for (const address of addresses) {
      const status = await safeStatus(url(address));
      if (status !== 404) failures.push(`/${address} → ${status}`);
    }
  }
  if (failures.length > 0) {
    return stop("post-publish-check", failures.join("; "), "post-check-failed");
  }

  try {
    seal();
  } catch (e) {
    log(
      `publish: could not encrypt the final report (${(e as Error).message})`,
    );
  }
  return finish(true);
}

// --- CI entry point -----------------------------------------------------------

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing environment variable ${name}`);
  return value;
}

async function main(): Promise<void> {
  const repo = join(HERE, "..");
  const executor = sshExecutor({
    host: env("SSH_HOST"),
    user: env("SSH_USERNAME"),
    privateKey: env("SSH_PRIVATE_KEY"),
  });
  try {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    const result = await publish({
      distDir: join(repo, "dist"),
      rulesDir: join(repo, "deploy", "rules"),
      maintainersDir: join(repo, "deploy", "maintainers"),
      targetDir: env("SSH_TARGET_DIR"),
      siteUrl: env("SITE_URL"),
      commit: env("GITHUB_SHA"),
      reportFile: process.env.REPORT_FILE ?? join(repo, "publish-report.gpg"),
      executor,
      writeSummary: (markdown) => {
        if (summaryFile) appendFileSync(summaryFile, markdown);
        else console.log(markdown);
      },
    });
    if (!result.ok) process.exitCode = 1;
  } finally {
    executor.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e: unknown) => {
    // Unexpected failures name only the step, never server file names.
    console.error(`publish failed: ${(e as Error).message}`);
    process.exitCode = 1;
  });
}
