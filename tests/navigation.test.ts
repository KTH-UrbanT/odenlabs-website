import { describe, expect, it } from "vitest";
import { sections } from "../src/data/sections";
import {
  hrefToFile,
  builtPagesFrom,
  missingPlannedPages,
  offeredSections,
  pageToBuiltFile,
} from "../src/lib/navigation";

const planned = [
  { label: "Research", href: "/research/" },
  { label: "People", href: "/people/" },
  { label: "Join/Contact", href: "/join/" },
];

describe("hrefToFile", () => {
  it("maps a section href to its built index file", () => {
    expect(hrefToFile("/research/")).toBe("research/index.html");
    expect(hrefToFile("/a/b/")).toBe("a/b/index.html");
  });
});

describe("pageToBuiltFile", () => {
  it.each([
    ["index.astro", "index.html"],
    ["research.astro", "research/index.html"],
    ["research.md", "research/index.html"],
    ["research.html", "research/index.html"],
    ["research/index.astro", "research/index.html"],
    ["research/index.html", "research/index.html"],
    ["people/myindex.astro", "people/myindex/index.html"],
    ["people/reindex.md", "people/reindex/index.html"],
    ["a/b.astro", "a/b/index.html"],
  ])("maps %s to %s", (page, built) => {
    expect(pageToBuiltFile(page)).toBe(built);
  });

  it("returns null for dynamic routes, whose built files are not fixed names", () => {
    expect(pageToBuiltFile("people/[id].astro")).toBeNull();
    expect(pageToBuiltFile("[...slug].astro")).toBeNull();
    expect(pageToBuiltFile("[x]/index.astro")).toBeNull();
  });
});

describe("builtPagesFrom", () => {
  it("collects the built files of fixed-name pages and skips dynamic ones", () => {
    expect(
      builtPagesFrom(["index.astro", "people/[id].astro", "join.html"]),
    ).toEqual(new Set(["index.html", "join/index.html"]));
  });

  it("feeds offeredSections the way the header does", () => {
    const built = builtPagesFrom([
      "index.astro",
      "people/index.astro",
      "research.md",
      "404.astro",
    ]);
    expect(offeredSections(planned, built)).toEqual([planned[0], planned[1]]);
  });
});

describe("offeredSections", () => {
  it("offers every planned section whose page exists, in planned order with planned labels", () => {
    const built = new Set([
      "index.html",
      "join/index.html",
      "research/index.html",
      "people/index.html",
    ]);
    expect(offeredSections(planned, built)).toEqual(planned);
  });

  it("offers nothing when no section page exists", () => {
    expect(offeredSections(planned, new Set(["index.html"]))).toEqual([]);
  });

  it("leaves out sections without a page and keeps the order of the rest", () => {
    const built = new Set(["join/index.html", "research/index.html"]);
    expect(offeredSections(planned, built)).toEqual([planned[0], planned[2]]);
  });

  it("does not offer a mistyped href", () => {
    const typo = [{ label: "Research", href: "/reserch/" }];
    expect(offeredSections(typo, new Set(["research/index.html"]))).toEqual([]);
  });
});

describe("missingPlannedPages", () => {
  it("names every planned entry whose page the build lacks", () => {
    const built = new Set(["research/index.html"]);
    expect(missingPlannedPages(planned, built)).toEqual([
      planned[1],
      planned[2],
    ]);
  });

  it("is empty when every planned section has a page", () => {
    const built = new Set(planned.map((s) => hrefToFile(s.href)));
    expect(missingPlannedPages(planned, built)).toEqual([]);
  });
});

describe("the planned sections list", () => {
  it("holds Research, People and Join/Contact in planned order", () => {
    expect(sections.map((s) => s.label)).toEqual([
      "Research",
      "People",
      "Join/Contact",
    ]);
  });

  it("has unique non-empty labels and unique internal hrefs with slashes on both ends", () => {
    const labels = sections.map((s) => s.label);
    const hrefs = sections.map((s) => s.href);
    expect(new Set(labels).size).toBe(labels.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const { label, href } of sections) {
      expect(label.trim()).not.toBe("");
      expect(href).toMatch(/^\/([a-z0-9-]+\/)+$/);
    }
  });
});
