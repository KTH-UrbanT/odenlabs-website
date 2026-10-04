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
