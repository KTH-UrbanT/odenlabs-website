import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RECORD_FILE,
  STAGING_DIR,
  inspectRecord,
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

  it.each([[".htaccess \n"], [" .htaccess\n"], [".htaccess\t\n"]])(
    "rejects a line with leading or trailing whitespace as malformed: %j",
    (text) => {
      expect(() => parseRuleList(text, "protected.txt")).toThrow(
        /protected\.txt:1.*malformed/,
      );
    },
  );
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

describe("inspectRecord", () => {
  const valid = publishRecord();

  it("returns the record and no problem for a valid record", () => {
    expect(inspectRecord(JSON.stringify(valid))).toEqual({
      record: valid,
      problem: null,
    });
  });

  it("reports an absent record", () => {
    expect(inspectRecord(null)).toEqual({ record: null, problem: "absent" });
  });

  it("reports an unreadable record", () => {
    expect(inspectRecord("{")).toEqual({ record: null, problem: "unreadable" });
  });

  it("reports a malformed path as its own problem", () => {
    const text = JSON.stringify({
      ...valid,
      files: [{ path: "../a.html", sha256: "0".repeat(64) }],
    });
    expect(inspectRecord(text)).toEqual({
      record: null,
      problem: "malformed-path",
    });
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

  describe("carried owned files (F-07)", () => {
    const old = "old.html";
    const oldSha = "a".repeat(64);
    const record = () => {
      const r = publishRecord({ paths: [...build, old, "gone.html"] });
      r.files = r.files.map((f) =>
        f.path === old ? { ...f, sha256: oldSha } : f,
      );
      return r;
    };

    it("carries an owned file the build dropped, with its previous hash, when deletion is off", () => {
      const result = plan({
        deletion: "off",
        listing: [...build, old, RECORD_FILE],
        record: record(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.carry).toEqual([{ path: old, sha256: oldSha }]);
      }
    });

    it("drops owned files that are no longer on the server", () => {
      const result = plan({
        deletion: "off",
        listing: [...build, old, RECORD_FILE],
        record: record(),
      });
      if (result.ok) {
        expect(result.carry.map((f) => f.path)).not.toContain("gone.html");
      }
    });

    it("carries nothing when deletion is on (the files are removed)", () => {
      const result = plan({
        deletion: "on",
        listing: [...build, old, RECORD_FILE],
        record: record(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.carry).toEqual([]);
        expect(result.remove).toEqual([old]);
      }
    });

    it("does not carry files that are in the build or protected", () => {
      const result = plan({
        deletion: "off",
        listing: [...build, old, RECORD_FILE],
        record: record(),
        protected: [old],
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.carry).toEqual([]);
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

describe("planPublish: stop-guards (AC-11b, AC-12)", () => {
  const build = buildFiles();

  function stop(
    overrides: Partial<{
      build: string[];
      listing: string[];
      record: PublishRecord | null;
      protected: string[];
      approved: string[];
      deletion: "on" | "off";
    }> = {},
  ) {
    return planPublish({
      build: overrides.build ?? build,
      listing: overrides.listing ?? [...build, RECORD_FILE],
      record:
        overrides.record === undefined ? publishRecord() : overrides.record,
      rules: rules(overrides),
    });
  }

  function expectStop(result: ReturnType<typeof stop>, check: string) {
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failedCheck).toBe(check);
    expect(result.entries.map((e) => e.kind)).not.toContain("removed");
    expect(result.entries.map((e) => e.kind)).not.toContain("uploaded");
  }

  it.each(["off", "on"] as const)(
    "stops on a build file at a protected address, naming it (deletion %s)",
    (deletion) => {
      const result = stop({ deletion, protected: ["icon.png"] });
      expectStop(result, "protected-clash");
      if (!result.ok) expect(result.detail).toContain("icon.png");
    },
  );

  describe("layout clashes between a build path and a listed path (F-01)", () => {
    it.each(["off", "on"] as const)(
      "stops when a build file is a parent folder of a listed path (deletion %s)",
      (deletion) => {
        const result = stop({
          deletion,
          listing: [...build, RECORD_FILE, "icon.png/inner.txt"],
          protected: ["icon.png/inner.txt"],
        });
        expectStop(result, "layout-clash");
      },
    );

    it.each(["protected", "unknown", "owned"] as const)(
      "stops when a %s listed file sits where the build needs a folder",
      (kind) => {
        const result = stop({
          deletion: "on",
          listing: [...build, RECORD_FILE, "_astro"],
          protected: kind === "protected" ? ["_astro"] : [],
          record: publishRecord({
            paths: kind === "owned" ? [...build, "_astro"] : build,
          }),
        });
        expectStop(result, "layout-clash");
      },
    );

    it("names the paths only in the detail", () => {
      const result = stop({ listing: [...build, "_astro"] });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.detail).toContain("_astro");
    });

    it("is not a clash when the listed path is the same file as a build path", () => {
      expect(stop({ listing: [...build, RECORD_FILE] }).ok).toBe(true);
    });
  });

  it("stops with malformed-path when the record lists a malformed owned path (deletion on)", () => {
    const result = planPublish({
      build,
      listing: [...build, RECORD_FILE],
      record: null,
      recordProblem: "malformed-path",
      rules: rules({ deletion: "on" }),
    });
    expectStop(result, "malformed-path");
  });

  it("stops with no-previous-record for an unreadable record (deletion on)", () => {
    const result = planPublish({
      build,
      listing: [...build, RECORD_FILE],
      record: null,
      recordProblem: "unreadable",
      rules: rules({ deletion: "on" }),
    });
    expectStop(result, "no-previous-record");
  });

  it.each(["off", "on"] as const)(
    "stops when an approved path is also a build path (deletion %s)",
    (deletion) => {
      const result = stop({ deletion, approved: ["icon.png"] });
      expectStop(result, "approved-in-build");
      if (!result.ok) expect(result.detail).toContain("icon.png");
    },
  );

  it("stops when the build lacks the front page", () => {
    expectStop(
      stop({ build: build.filter((p) => p !== "index.html") }),
      "missing-front-page",
    );
  });

  it("stops when the build lacks the logo", () => {
    expectStop(
      stop({ build: build.filter((p) => p !== "logo.svg") }),
      "missing-logo",
    );
  });

  it("stops on a malformed build path", () => {
    expectStop(stop({ build: [...build, "a//b.html"] }), "malformed-path");
  });

  describe("with deletion on", () => {
    it("stops on an empty target folder", () => {
      expectStop(
        stop({ deletion: "on", listing: [], record: null }),
        "no-previous-record",
      );
    });

    it("stops on a wrong folder: unrelated files and no record", () => {
      expectStop(
        stop({
          deletion: "on",
          listing: ["home/thesis.pdf", "home/notes.txt"],
          record: null,
        }),
        "no-previous-record",
      );
    });

    it("stops when the record does not list the front page and logo", () => {
      expectStop(
        stop({
          deletion: "on",
          record: publishRecord({ paths: ["404.html"] }),
        }),
        "record-without-front-page-or-logo",
      );
    });

    it("stops when the folder lacks the front page the record lists", () => {
      expectStop(
        stop({
          deletion: "on",
          listing: [...build.filter((p) => p !== "index.html"), RECORD_FILE],
        }),
        "record-without-front-page-or-logo",
      );
    });

    it("allows up to 20 removals without an approved list", () => {
      const old = starterFiles(20);
      const result = stop({
        deletion: "on",
        listing: [...build, ...old, RECORD_FILE],
        record: publishRecord({ paths: [...build, ...old] }),
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.remove).toHaveLength(20);
    });

    it("stops at 21 removals without an approved list", () => {
      const old = starterFiles(21);
      const result = stop({
        deletion: "on",
        listing: [...build, ...old, RECORD_FILE],
        record: publishRecord({ paths: [...build, ...old] }),
      });
      expectStop(result, "removal-limit");
      if (!result.ok) expect(result.detail).toContain("21");
    });

    it("allows 21 removals when the approved list equals them exactly", () => {
      const starter = starterFiles(21);
      const result = stop({
        deletion: "on",
        listing: [...build, ...starter, RECORD_FILE],
        approved: starter,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.remove).toEqual(starter);
    });

    it("lists planned-not-approved and approved-not-planned paths in the detail", () => {
      const starter = starterFiles(22);
      const result = stop({
        deletion: "on",
        listing: [...build, ...starter, RECORD_FILE],
        record: publishRecord({ paths: [...build, starter[21]] }),
        approved: starter.slice(0, 21),
      });
      expectStop(result, "removal-limit");
      if (result.ok) return;
      expect(result.detail).toMatch(/planned, not approved:.*demo-22/);
      expect(result.detail).not.toMatch(/planned, not approved:.*demo-01/);
    });

    it("lists an approved path the plan would not remove (already gone)", () => {
      const starter = starterFiles(22);
      const extra = "post/other/index.html";
      const result = stop({
        deletion: "on",
        listing: [...build, ...starter, extra, RECORD_FILE],
        record: publishRecord({ paths: [...build, ...starter] }),
        approved: [extra, "post/gone/index.html"],
      });
      expectStop(result, "removal-limit");
      if (result.ok) return;
      expect(result.detail).toMatch(/approved, not planned:.*gone/);
      expect(result.detail).not.toMatch(/approved, not planned:.*other/);
    });

    it("stops when the approved list misses one planned removal", () => {
      const starter = starterFiles(22);
      expectStop(
        stop({
          deletion: "on",
          listing: [...build, ...starter, RECORD_FILE],
          record: publishRecord({ paths: [...build, starter[21]] }),
          approved: starter.slice(0, 21),
        }),
        "removal-limit",
      );
    });

    it("ignores approved files already gone from the server, with a warning", () => {
      const starter = starterFiles(21);
      const result = stop({
        deletion: "on",
        listing: [...build, ...starter, RECORD_FILE],
        approved: [...starter, "gone.html"],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.entries).toContainEqual(
          expect.objectContaining({ kind: "warning", path: "gone.html" }),
        );
      }
    });
  });

  it("with deletion off, publishes without a record and keeps the listing", () => {
    const result = stop({ record: null, listing: ["demo.html"] });
    expect(result.ok).toBe(true);
  });

  it("returns the listing with a stop so the maintainer can review it", () => {
    const result = stop({
      listing: [...build, "kthit.txt", RECORD_FILE],
      protected: ["icon.png"],
    });
    expect(result.entries).toContainEqual({
      kind: "unknown",
      path: "kthit.txt",
    });
  });
});
