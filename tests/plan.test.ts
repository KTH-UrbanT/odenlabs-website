import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  isOutsideListing,
  normalisePath,
  parseRecord,
  parseRules,
  parseRuleList,
  parseSettings,
} from "../deploy/plan.ts";
import { publishRecord } from "./fixtures/publish.ts";

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
