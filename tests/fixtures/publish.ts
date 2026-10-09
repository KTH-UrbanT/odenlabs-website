// Fixture builders for the publish planner and swap tests. Paths are neutral
// starter-like names; nothing here resembles a real person or server.
import type { PublishRecord, Rules } from "../../deploy/plan.ts";

export const SHA = "0".repeat(64);
export const COMMIT = "0".repeat(40);

/** A small build: front page, not-found page, logo, icon and one hashed asset. */
export function buildFiles(paths?: string[]): string[] {
  return (
    paths ?? [
      "404.html",
      "_astro/index.abc123.css",
      "icon.png",
      "index.html",
      "logo.svg",
    ]
  );
}

/** A valid version-1 publish record listing `files` (default: buildFiles()). */
export function publishRecord(
  overrides: Partial<PublishRecord> & { paths?: string[] } = {},
): PublishRecord {
  const { paths, ...rest } = overrides;
  return {
    version: 1,
    commit: COMMIT,
    publishedAt: "2026-10-04T12:00:00.000Z",
    files: [...(paths ?? buildFiles())]
      .sort()
      .map((path) => ({ path, sha256: SHA })),
    ...rest,
  };
}

/** `n` starter-like paths, e.g. post/demo-1/index.html. */
export function starterFiles(n: number): string[] {
  return Array.from(
    { length: n },
    (_, i) => `post/demo-${String(i + 1).padStart(2, "0")}/index.html`,
  );
}

/** Publishing rules as the planner receives them. */
export function rules(
  overrides: Partial<{
    protected: string[];
    approved: string[];
    deletion: "on" | "off";
  }> = {},
): Rules {
  return {
    protected: overrides.protected ?? [],
    approved: overrides.approved ?? [],
    settings: { deletion: overrides.deletion ?? "off", removalLimit: 20 },
  };
}
