// The publish report (ADR-0004). The public Actions log and job summary get
// counts, the outcome and the failed check's name only. The full report, which
// names server files the site did not publish, leaves the runner only
// GPG-encrypted to every maintainer key in deploy/maintainers/.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Deletion, EntryKind, FailedCheck, ReportEntry } from "./plan.ts";

export interface PublishReport {
  commit: string;
  startedAt: string;
  deletion: Deletion;
  outcome:
    | "in-progress"
    | "published"
    | "stopped"
    | "failed-before-swap"
    | "failed-during-swap"
    | "post-check-failed";
  failedCheck: FailedCheck | null;
  /** Private: may name server files, so only in the encrypted report. */
  detail: string | null;
  entries: ReportEntry[];
  swapSeconds: number | null;
  /** Folders the listing could not read; a count, never names. */
  unreadableFolders: number;
}

/** A publish that stops on a named check; the run fails with that name. */
export class PublishError extends Error {
  check: FailedCheck;

  constructor(check: FailedCheck, message: string) {
    super(`${check}: ${message}`);
    this.name = "PublishError";
    this.check = check;
  }
}

const KINDS: [EntryKind, string][] = [
  ["uploaded", "Uploaded"],
  ["removed", "Removed"],
  ["unknown", "Unknown (left in place: mark protected or approve removal)"],
  ["owned-pending", "Owned, not in the build (removed once deletion is on)"],
  ["approved-pending", "Approved, not yet removed (deletion is off)"],
  ["protected", "Protected (left unchanged)"],
  ["warning", "Warnings"],
];

const SHORT_LABEL: Record<EntryKind, string> = {
  uploaded: "Uploaded",
  removed: "Removed",
  unknown: "Unknown",
  "owned-pending": "Owned, pending removal",
  "approved-pending": "Approved, pending removal",
  protected: "Protected",
  warning: "Warnings",
};

/** Markdown for the public job summary: no file names, ever. */
export function publicSummary(
  report: PublishReport,
  publicNotes: string[],
): string {
  const lines = [
    `## Publish: ${report.outcome}`,
    "",
    `- Deletion: ${report.deletion}`,
  ];
  if (report.failedCheck)
    lines.push(`- Failed check: \`${report.failedCheck}\``);
  if (report.swapSeconds !== null) {
    lines.push(`- Swap: ${report.swapSeconds} s`);
  }
  if (report.unreadableFolders > 0) {
    lines.push(`- Unreadable folders skipped: ${report.unreadableFolders}`);
  }
  lines.push("", "| Files | Count |", "|---|---|");
  for (const [kind] of KINDS) {
    const count = report.entries.filter((e) => e.kind === kind).length;
    lines.push(`| ${SHORT_LABEL[kind]} | ${count} |`);
  }
  if (publicNotes.length > 0) {
    lines.push("", ...publicNotes.map((note) => `- ${note}`));
  }
  lines.push(
    "",
    "The full report is the encrypted `publish-report` artifact (maintainers only).",
  );
  return `${lines.join("\n")}\n`;
}

/** Plain text of the full report, grouped by kind, for the maintainers. */
export function formatReport(report: PublishReport): string {
  const show = (path: string) =>
    /^[\x20-\x7e]*$/.test(path) ? path : JSON.stringify(path);
  const lines = [
    `Publish report — ${report.commit}`,
    `Started: ${report.startedAt}`,
    `Deletion: ${report.deletion}`,
    `Outcome: ${report.outcome}`,
  ];
  if (report.failedCheck) {
    lines.push(`Failed check: ${report.failedCheck} — ${report.detail ?? ""}`);
  }
  if (report.swapSeconds !== null) lines.push(`Swap: ${report.swapSeconds} s`);
  if (report.unreadableFolders > 0) {
    lines.push(`Unreadable folders skipped: ${report.unreadableFolders}`);
  }
  for (const [kind, label] of KINDS) {
    const entries = report.entries.filter((e) => e.kind === kind);
    if (entries.length === 0) continue;
    lines.push("", `${label} (${entries.length}):`);
    for (const e of entries) {
      const flag = e.malformed ? " [malformed name]" : "";
      const note = e.message ? ` — ${e.message}` : "";
      lines.push(`  ${show(e.path)}${flag}${note}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

/** The maintainers' public keys: every `.asc` file in the folder. */
export function maintainerKeyFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".asc"))
    .sort()
    .map((name) => join(dir, name));
}

/**
 * Encrypts `text` to every key in `keyFiles`, writing `outFile`. Uses a
 * throwaway keyring, so the runner's own keyring is never involved. Fails
 * closed: no key, a key that will not import, or any gpg error stops the
 * publish before anything is uploaded.
 */
export function encryptReport(
  text: string,
  keyFiles: string[],
  outFile: string,
  options: { gpg?: string } = {},
): { fingerprints: string[] } {
  if (keyFiles.length === 0) {
    throw new PublishError(
      "no-maintainer-key",
      "deploy/maintainers/ has no .asc key",
    );
  }
  const home = mkdtempSync(join(tmpdir(), "publish-gnupg-"));
  const gpg = (args: string[], input?: string) => {
    const result = spawnSync(
      options.gpg ?? "gpg",
      ["--homedir", home, "--batch", "--no-tty", ...args],
      { input, encoding: "utf8" },
    );
    if (result.status !== 0) {
      throw new PublishError(
        "encryption-failed",
        `gpg ${args[0]} failed${result.stderr ? `: ${result.stderr.trim()}` : ""}`,
      );
    }
    return result.stdout;
  };
  try {
    const fingerprints: string[] = [];
    for (const file of keyFiles) {
      gpg(["--import", file]);
    }
    const listing = gpg(["--with-colons", "--list-keys"]);
    let primary = false;
    for (const line of listing.split("\n")) {
      const fields = line.split(":");
      if (fields[0] === "pub") primary = true;
      else if (fields[0] === "fpr" && primary) {
        fingerprints.push(fields[9]);
        primary = false;
      }
    }
    if (fingerprints.length < keyFiles.length) {
      throw new PublishError(
        "encryption-failed",
        `imported ${fingerprints.length} keys from ${keyFiles.length} files`,
      );
    }
    gpg(
      [
        "--trust-model",
        "always",
        "--yes",
        "--output",
        outFile,
        ...fingerprints.flatMap((f) => ["--recipient", f]),
        "--encrypt",
      ],
      text,
    );
    return { fingerprints };
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}
