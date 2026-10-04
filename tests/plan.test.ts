import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RECORD_FILE,
  STAGING_DIR,
  isOutsideListing,
  normalisePath,
  parseRecord,
  parseRules,
  parseRuleList,
  parseSettings,
  planPublish,
  type PublishRecord,
  type ReportEntry,
} from "../deploy/plan.ts";
import {
  buildFiles,
  publishRecord,
  rules,
  starterFiles,
} from "./fixtures/publish.ts";

describe("normalisePath", () => {
  it("accepts relative paths and strips a leading ./", () => {
    expect(normalisePath("index.html")).toBe("index.html");
    expect(normalisePath("./_astro/a.css")).toBe("_astro/a.css");
    expect(normalisePath("Post/Demo 1/index.html")).toBe(
      "Post/Demo 1/index.html",
    );
  });

  it.each([
    ["/abs/path"],
    ["../etc/x"],
    ["a/../b"],
    ["a/./b"],
    ["a//b"],
    ["a/"],
    [""],
    ["a\nb"],
    ["a\tb"],
    ["a\u007fb"],
  ])("rejects %j", (raw) => {
    expect(normalisePath(raw)).toBeNull();
  });
});

describe("isOutsideListing", () => {
  it("excludes the record and the staging folder, nothing else", () => {
    expect(isOutsideListing(".publish-record.json")).toBe(true);
    expect(isOutsideListing(".publish-staging")).toBe(true);
    expect(isOutsideListing(".publish-staging/index.html")).toBe(true);
    expect(isOutsideListing(".publish-staging-old")).toBe(false);
    expect(isOutsideListing(".htaccess")).toBe(false);
  });
});

describe("parseRuleList", () => {
  it("reads one path per line, ignoring blank lines and # comments", () => {
    const text = "# kept for KTH IT\n\n.htaccess\n  \ngoogle123.html\n";
    expect(parseRuleList(text, "protected.txt")).toEqual([
      ".htaccess",
      "google123.html",
    ]);
  });

  it("rejects duplicates, malformed paths and globs, naming file and line", () => {
    expect(() => parseRuleList("a.html\na.html\n", "protected.txt")).toThrow(
      /protected\.txt:2.*duplicate/,
    );
    expect(() => parseRuleList("../x\n", "protected.txt")).toThrow(
      /protected\.txt:1.*malformed/,
    );
    expect(() =>
      parseRuleList("post/*.html\n", "approved-removals.txt"),
    ).toThrow(/approved-removals\.txt:1.*glob/);
  });
});

describe("parseSettings", () => {
  it("accepts the deletion switch and the routine limit of 20", () => {
    expect(parseSettings('{ "deletion": "off", "removalLimit": 20 }')).toEqual({
      deletion: "off",
      removalLimit: 20,
    });
    expect(parseSettings('{ "deletion": "on", "removalLimit": 20 }')).toEqual({
      deletion: "on",
      removalLimit: 20,
    });
  });

  it.each([
    [
      '{ "deleteion": "off", "deletion": "off", "removalLimit": 20 }',
      /deleteion/,
    ],
    ['{ "removalLimit": 20 }', /deletion/],
    ['{ "deletion": "yes", "removalLimit": 20 }', /deletion/],
    ['{ "deletion": "off", "removalLimit": 25 }', /removalLimit/],
    ['{ "deletion": "off" }', /removalLimit/],
    ["not json", /settings\.json/],
  ])("rejects %s", (text, message) => {
    expect(() => parseSettings(text)).toThrow(message);
  });
});

describe("parseRules", () => {
  const settings = '{ "deletion": "off", "removalLimit": 20 }';

  it("fails on a path that is both protected and approved for removal", () => {
    expect(() =>
      parseRules({
        protectedText: "keep.html\n",
        approvedText: "keep.html\n",
        settingsText: settings,
      }),
    ).toThrow(/rules-conflict.*keep\.html/);
  });

  it("parses the repository's real rules files", () => {
    const dir = "deploy/rules";
    const parsed = parseRules({
      protectedText: readFileSync(`${dir}/protected.txt`, "utf8"),
      approvedText: readFileSync(`${dir}/approved-removals.txt`, "utf8"),
      settingsText: readFileSync(`${dir}/settings.json`, "utf8"),
    });
    expect(parsed.settings.removalLimit).toBe(20);
  });
});

describe("parseRecord", () => {
  const valid = publishRecord();

  it("returns a valid version-1 record", () => {
    expect(parseRecord(JSON.stringify(valid))).toEqual(valid);
  });

  it("returns null when there is no record", () => {
    expect(parseRecord(null)).toBeNull();
  });

  it.each([
    ["invalid JSON", "{"],
    ["an unknown version", JSON.stringify({ ...valid, version: 2 })],
    ["a short commit", JSON.stringify({ ...valid, commit: "abc" })],
    ["a bad date", JSON.stringify({ ...valid, publishedAt: "yesterday" })],
    ["no files", JSON.stringify({ ...valid, files: [] })],
    [
      "a bad hash",
      JSON.stringify({ ...valid, files: [{ path: "a.html", sha256: "x" }] }),
    ],
    [
      "a malformed path",
      JSON.stringify({
        ...valid,
        files: [{ path: "../a.html", sha256: "0".repeat(64) }],
      }),
    ],
    [
      "a duplicate path",
      JSON.stringify({
        ...valid,
        files: [valid.files[0], valid.files[0]],
      }),
    ],
  ])("treats a record with %s as no record", (_, text) => {
    expect(parseRecord(text)).toBeNull();
  });

  it("keeps a record that lacks the logo, for the planner to judge", () => {
    const noLogo = publishRecord({ paths: ["index.html"] });
    expect(parseRecord(JSON.stringify(noLogo))).toEqual(noLogo);
  });
});

describe("planPublish: classification and plan", () => {
  const build = buildFiles();
  const kinds = (entries: ReportEntry[], kind: ReportEntry["kind"]) =>
    entries.filter((e) => e.kind === kind).map((e) => e.path);

  function plan(
    overrides: Partial<{
      build: string[];
      listing: string[];
      record: PublishRecord | null;
      protected: string[];
      approved: string[];
      deletion: "on" | "off";
    }> = {},
  ) {
    const result = planPublish({
      build: overrides.build ?? build,
      listing: overrides.listing ?? [...build, RECORD_FILE],
      record:
        overrides.record === undefined ? publishRecord() : overrides.record,
      rules: rules(overrides),
    });
    if (!result.ok) throw new Error(`unexpected stop: ${result.failedCheck}`);
    return result;
  }

  it("uploads every build file and reports it as uploaded", () => {
    const result = plan();
    expect(result.upload).toEqual([...build].sort());
    expect(kinds(result.entries, "uploaded")).toEqual([...build].sort());
  });

  describe("with deletion off (AC-07, AC-07b)", () => {
    const listing = [
      ...build,
      "old/page.html",
      "approved.html",
      "keep.html",
      "kthit.txt",
      RECORD_FILE,
      `${STAGING_DIR}/index.html`,
    ];
    const record = publishRecord({ paths: [...build, "old/page.html"] });
    const result = plan({
      listing,
      record,
      protected: ["keep.html"],
      approved: ["approved.html"],
    });

    it("removes nothing", () => {
      expect(result.remove).toEqual([]);
      expect(kinds(result.entries, "removed")).toEqual([]);
    });

    it("lists every server file the build lacks, sorted by ownership", () => {
      expect(kinds(result.entries, "owned-pending")).toEqual(["old/page.html"]);
      expect(kinds(result.entries, "approved-pending")).toEqual([
        "approved.html",
      ]);
      expect(kinds(result.entries, "protected")).toEqual(["keep.html"]);
      expect(kinds(result.entries, "unknown")).toEqual(["kthit.txt"]);
    });

    it("never classifies the record or the staging folder", () => {
      const paths = result.entries.map((e) => e.path);
      expect(paths).not.toContain(RECORD_FILE);
      expect(paths.some((p) => p.startsWith(STAGING_DIR))).toBe(false);
    });

    it("plans the first publish (no record) as upload and list only", () => {
      const first = plan({
        record: null,
        listing: ["index.html", "demo.html"],
      });
      expect(first.remove).toEqual([]);
      expect(kinds(first.entries, "unknown")).toEqual(["demo.html"]);
    });
  });

  describe("with deletion on", () => {
    it("removes owned files missing from the build (AC-10)", () => {
      const result = plan({
        deletion: "on",
        listing: [...build, "research/index.html", RECORD_FILE],
        record: publishRecord({ paths: [...build, "research/index.html"] }),
      });
      expect(result.remove).toEqual(["research/index.html"]);
      expect(kinds(result.entries, "removed")).toEqual(["research/index.html"]);
    });

    it("removes approved starter files (AC-01)", () => {
      const starter = starterFiles(3);
      const result = plan({
        deletion: "on",
        listing: [...build, ...starter, RECORD_FILE],
        approved: starter,
      });
      expect(result.remove).toEqual(starter);
      expect(kinds(result.entries, "removed")).toEqual(starter);
    });

    it("never removes a protected file, even one a stale record lists (AC-11)", () => {
      const result = plan({
        deletion: "on",
        listing: [...build, "keep.html", RECORD_FILE],
        record: publishRecord({ paths: [...build, "keep.html"] }),
        protected: ["keep.html"],
      });
      expect(result.remove).toEqual([]);
      expect(kinds(result.entries, "protected")).toEqual(["keep.html"]);
    });

    it("leaves unknown files in place and reports them on every publish (AC-13)", () => {
      const result = plan({
        deletion: "on",
        listing: [...build, "kthit.txt", RECORD_FILE],
      });
      expect(result.remove).toEqual([]);
      expect(kinds(result.entries, "unknown")).toEqual(["kthit.txt"]);
    });
  });

  it("reports an unknown file with a malformed name and never acts on it", () => {
    const result = plan({
      deletion: "on",
      listing: [...build, "odd\nname.txt", RECORD_FILE],
    });
    expect(result.remove).toEqual([]);
    expect(result.entries).toContainEqual({
      kind: "unknown",
      path: "odd\nname.txt",
      malformed: true,
    });
  });

  it("overwrites an unknown file at a build address and warns about it", () => {
    const result = plan({
      listing: [...build, RECORD_FILE],
      record: publishRecord({ paths: build.filter((p) => p !== "icon.png") }),
    });
    expect(result.upload).toContain("icon.png");
    expect(result.entries).toContainEqual(
      expect.objectContaining({ kind: "warning", path: "icon.png" }),
    );
  });

  it("gives the same plan for the same inputs (a re-run adds no change)", () => {
    const input = {
      deletion: "on" as const,
      listing: [...build, "old.html", RECORD_FILE],
      record: publishRecord({ paths: [...build, "old.html"] }),
    };
    expect(plan(input)).toEqual(plan(input));
  });
});
