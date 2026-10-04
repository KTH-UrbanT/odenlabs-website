// The publish planner: the pure core of the publish worker (ADR-0002).
// Everything here is a function of its inputs: no file system, network or
// clock. The shell (publish.ts) gathers the inputs and applies the plan.
//
// Run directly by Node (`node deploy/publish.ts`), so only erasable
// TypeScript: no enums, no parameter properties, `.ts` import extensions.

// --- Model -----------------------------------------------------------------

export type Deletion = "on" | "off";

export interface Settings {
  deletion: Deletion;
  removalLimit: 20;
}

export interface Rules {
  protected: string[];
  approved: string[];
  settings: Settings;
}

export interface RecordedFile {
  path: string;
  sha256: string;
}

/** `.publish-record.json`: what the last publish uploaded (data-model.md). */
export interface PublishRecord {
  version: 1;
  commit: string;
  publishedAt: string;
  files: RecordedFile[];
}

export const RECORD_FILE = ".publish-record.json";
export const STAGING_DIR = ".publish-staging";
export const FRONT_PAGE = "index.html";
export const LOGO = "logo.svg";
export const REMOVAL_LIMIT = 20;

// --- Paths -----------------------------------------------------------------

/**
 * A server path relative to the target folder, or null when malformed:
 * absolute, empty, with an empty, `.` or `..` segment, or a control
 * character. A single leading `./` (as `find .` prints it) is stripped.
 */
export function normalisePath(raw: string): string | null {
  const path = raw.startsWith("./") ? raw.slice(2) : raw;
  if (path === "" || path.startsWith("/")) return null;
  if (/[\u0000-\u001f\u007f]/.test(path)) return null;
  const segments = path.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  return path;
}

/** The record and the staging folder are never listed or classified. */
export function isOutsideListing(path: string): boolean {
  return (
    path === RECORD_FILE ||
    path === STAGING_DIR ||
    path.startsWith(`${STAGING_DIR}/`)
  );
}

// --- Rules files ------------------------------------------------------------

/** One path per line; blank lines and `#` comments ignored; no globs. */
export function parseRuleList(text: string, fileName: string): string[] {
  const paths: string[] = [];
  const problems: string[] = [];
  text.split("\n").forEach((rawLine, i) => {
    const line = rawLine.replace(/\r$/, "");
    if (line.trim() === "" || line.startsWith("#")) return;
    const where = `${fileName}:${i + 1}`;
    const path = normalisePath(line);
    if (/[*?[\]]/.test(line)) problems.push(`${where}: glob not allowed`);
    else if (path === null) problems.push(`${where}: malformed path`);
    else if (paths.includes(path)) problems.push(`${where}: duplicate ${path}`);
    else paths.push(path);
  });
  if (problems.length > 0) throw new Error(problems.join("\n"));
  return paths;
}

/** `settings.json`: `{ deletion: "on" | "off", removalLimit: 20 }`, nothing else. */
export function parseSettings(text: string): Settings {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("settings.json: not valid JSON");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("settings.json: expected an object");
  }
  const settings = value as Record<string, unknown>;
  const problems: string[] = [];
  for (const key of Object.keys(settings)) {
    if (key !== "deletion" && key !== "removalLimit") {
      problems.push(`unknown key "${key}"`);
    }
  }
  if (settings.deletion !== "on" && settings.deletion !== "off") {
    problems.push('deletion must be "on" or "off"');
  }
  if (settings.removalLimit !== REMOVAL_LIMIT) {
    problems.push(`removalLimit must be ${REMOVAL_LIMIT} (spec §6)`);
  }
  if (problems.length > 0) {
    throw new Error(`settings.json: ${problems.join("; ")}`);
  }
  return settings as unknown as Settings;
}

/** All three rules files; a path both protected and approved is an error. */
export function parseRules(files: {
  protectedText: string;
  approvedText: string;
  settingsText: string;
}): Rules {
  const rules: Rules = {
    protected: parseRuleList(files.protectedText, "protected.txt"),
    approved: parseRuleList(files.approvedText, "approved-removals.txt"),
    settings: parseSettings(files.settingsText),
  };
  const both = rules.approved.filter((p) => rules.protected.includes(p));
  if (both.length > 0) {
    throw new Error(
      `rules-conflict: protected and approved for removal: ${both.join(", ")}`,
    );
  }
  return rules;
}

// --- Publish record ---------------------------------------------------------

/**
 * The previous publish record, or null when there is none or it cannot be
 * trusted (invalid JSON, unknown version, a field breaking its constraints):
 * an unreadable record counts as no matching record (AC-12).
 */
export function parseRecord(text: string | null): PublishRecord | null {
  if (text === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  const r = value as Partial<PublishRecord> | null;
  if (typeof r !== "object" || r === null) return null;
  if (r.version !== 1) return null;
  if (typeof r.commit !== "string" || !/^[0-9a-f]{40}$/.test(r.commit)) {
    return null;
  }
  if (
    typeof r.publishedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/.test(r.publishedAt)
  ) {
    return null;
  }
  if (!Array.isArray(r.files) || r.files.length === 0) return null;
  const seen = new Set<string>();
  for (const f of r.files) {
    if (typeof f !== "object" || f === null) return null;
    if (typeof f.path !== "string" || normalisePath(f.path) !== f.path) {
      return null;
    }
    if (typeof f.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(f.sha256)) {
      return null;
    }
    if (seen.has(f.path)) return null;
    seen.add(f.path);
  }
  return {
    version: 1,
    commit: r.commit,
    publishedAt: r.publishedAt,
    files: r.files.map((f) => ({ path: f.path, sha256: f.sha256 })),
  };
}

// --- Planning ---------------------------------------------------------------

export type EntryKind =
  | "uploaded"
  | "removed"
  | "unknown"
  | "protected"
  | "approved-pending"
  | "owned-pending"
  | "warning";

/** One line of the maintainer-only publish report (data-model.md). */
export interface ReportEntry {
  kind: EntryKind;
  path: string;
  malformed?: boolean;
  message?: string;
}

export type FailedCheck =
  | "missing-front-page"
  | "missing-logo"
  | "no-previous-record"
  | "record-without-front-page-or-logo"
  | "removal-limit"
  | "protected-clash"
  | "malformed-path"
  | "no-maintainer-key"
  | "encryption-failed"
  | "remote-tools-missing"
  | "post-publish-check";

export interface PlanInput {
  /** Paths of the built files, relative to dist/. */
  build: string[];
  /** Raw names of the files in the target folder, as the server lists them. */
  listing: string[];
  /** The previous publish record, or null (none or unreadable). */
  record: PublishRecord | null;
  rules: Rules;
}

export type PlanResult =
  | { ok: true; upload: string[]; remove: string[]; entries: ReportEntry[] }
  | {
      ok: false;
      failedCheck: FailedCheck;
      detail: string;
      entries: ReportEntry[];
    };

export type Ownership = "protected" | "owned" | "approved" | "unknown";

/** Protected wins over owned, owned over approved; anything else is unknown. */
export function classify(
  path: string,
  record: PublishRecord | null,
  rules: Rules,
): Ownership {
  if (rules.protected.includes(path)) return "protected";
  if (record?.files.some((f) => f.path === path)) return "owned";
  if (rules.approved.includes(path)) return "approved";
  return "unknown";
}

const byPath = (a: ReportEntry, b: ReportEntry) =>
  a.path < b.path ? -1 : a.path > b.path ? 1 : 0;

const REPLACED_UNKNOWN = "replaced a file the site never published";

interface Sorted {
  upload: string[];
  remove: string[];
  entries: ReportEntry[];
  /** Normalised paths present in the target folder. */
  present: Set<string>;
}

/** Sorts every listed file by ownership; removals only when deletion is on. */
function sortListing(input: PlanInput, deletionOn: boolean): Sorted {
  const { record, rules } = input;
  const build = [...input.build].sort();
  const inBuild = new Set(build);
  const entries: ReportEntry[] = build.map((path) => ({
    kind: "uploaded",
    path,
  }));
  const remove: string[] = [];
  const present = new Set<string>();

  for (const raw of input.listing) {
    const path = normalisePath(raw);
    if (path === null) {
      entries.push({ kind: "unknown", path: raw, malformed: true });
      continue;
    }
    if (isOutsideListing(path)) continue;
    present.add(path);
    const ownership = classify(path, record, rules);
    if (inBuild.has(path)) {
      if (ownership === "unknown") {
        entries.push({
          kind: "warning",
          path,
          message: REPLACED_UNKNOWN,
        });
      }
      continue;
    }
    if (ownership === "protected" || ownership === "unknown") {
      entries.push({ kind: ownership, path });
    } else if (deletionOn) {
      remove.push(path);
      entries.push({ kind: "removed", path });
    } else {
      entries.push({ kind: `${ownership}-pending`, path });
    }
  }
  for (const path of rules.approved) {
    if (!present.has(path)) {
      entries.push({
        kind: "warning",
        path,
        message: "approved for removal but no longer on the server",
      });
    }
  }
  return { upload: build, remove: remove.sort(), entries, present };
}

/** The first guard that fails (AC-11b, AC-12), or null. */
function firstFailedCheck(
  input: PlanInput,
  sorted: Sorted,
): { failedCheck: FailedCheck; detail: string } | null {
  const { build, record, rules } = input;
  const malformed = build.find((p) => normalisePath(p) !== p);
  if (malformed !== undefined) {
    return { failedCheck: "malformed-path", detail: JSON.stringify(malformed) };
  }
  if (!build.includes(FRONT_PAGE)) {
    return {
      failedCheck: "missing-front-page",
      detail: `build lacks ${FRONT_PAGE}`,
    };
  }
  if (!build.includes(LOGO)) {
    return { failedCheck: "missing-logo", detail: `build lacks ${LOGO}` };
  }
  const clashes = build.filter((p) => rules.protected.includes(p));
  if (clashes.length > 0) {
    return {
      failedCheck: "protected-clash",
      detail: `build file at a protected address: ${clashes.join(", ")}`,
    };
  }
  if (rules.settings.deletion === "off") return null;

  if (record === null) {
    return {
      failedCheck: "no-previous-record",
      detail: "target folder has no readable publish record",
    };
  }
  for (const path of [FRONT_PAGE, LOGO]) {
    if (!record.files.some((f) => f.path === path)) {
      return {
        failedCheck: "record-without-front-page-or-logo",
        detail: `previous record does not list ${path}`,
      };
    }
    if (!sorted.present.has(path)) {
      return {
        failedCheck: "record-without-front-page-or-logo",
        detail: `target folder lacks ${path}, which the record lists`,
      };
    }
  }
  const limit = rules.settings.removalLimit;
  if (sorted.remove.length > limit) {
    const approved = rules.approved.filter((p) => sorted.present.has(p)).sort();
    const exact =
      approved.length === sorted.remove.length &&
      approved.every((p, i) => p === sorted.remove[i]);
    if (!exact) {
      return {
        failedCheck: "removal-limit",
        detail: `${sorted.remove.length} removals exceed the routine limit of ${limit} and differ from the approved list`,
      };
    }
  }
  return null;
}

/**
 * Plans one publish: upload the whole build; with deletion on, remove owned
 * or approved files the build no longer has; never touch protected or
 * unknown files; report every server file the build lacks. Stops before any
 * change when a guard fails, still returning the listing for review.
 */
export function planPublish(input: PlanInput): PlanResult {
  const deletionOn = input.rules.settings.deletion === "on";
  const sorted = sortListing(input, deletionOn);
  const failed = firstFailedCheck(input, sorted);
  if (failed !== null) {
    const listing = sortListing(input, false).entries.filter(
      (e) => e.kind !== "uploaded" && e.message !== REPLACED_UNKNOWN,
    );
    return { ok: false, ...failed, entries: listing.sort(byPath) };
  }
  return {
    ok: true,
    upload: sorted.upload,
    remove: sorted.remove,
    entries: sorted.entries.sort(byPath),
  };
}
