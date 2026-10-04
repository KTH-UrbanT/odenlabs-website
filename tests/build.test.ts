// Build tests: the site builds, and the built output keeps its promises
// (front page, navigation that leads somewhere).
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sections } from "../src/data/sections";
import { findOffSiteRequests } from "../src/lib/offsite-requests";

const dist = "dist";

function builtFiles(dir = dist): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? builtFiles(path) : [relative(dist, path)];
  });
}

const html = (file: string) => readFileSync(join(dist, file), "utf8");

beforeAll(() => {
  execFileSync("npx", ["astro", "build"], { stdio: "pipe" });
});

describe("astro build", () => {
  it("produces dist/index.html", () => {
    expect(existsSync("dist/index.html")).toBe(true);
    expect(html("index.html")).toContain("<main");
  });
});

describe("not-found page", () => {
  it("exists with noindex, the site header and a link to the front page", () => {
    expect(existsSync("dist/404.html")).toBe(true);
    const page = html("404.html");
    expect(page).toMatch(/<meta name="robots" content="noindex"/);
    expect(page).toContain("<header");
    expect(page).toMatch(/<main[\s\S]*<a\s[^>]*href="\/"[\s\S]*<\/main>/);
    expect(page).not.toContain('rel="canonical"');
  });

  it("states that the page does not exist", () => {
    expect(html("404.html")).toMatch(/does not exist/i);
  });
});

describe("header navigation", () => {
  it("links only to pages the build contains", () => {
    const files = new Set(builtFiles());
    const dead: string[] = [];
    for (const page of [...files].filter((f) => f.endsWith(".html"))) {
      const header = /<header[\s\S]*?<\/header>/.exec(html(page))?.[0] ?? "";
      for (const [, href] of header.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
        const target = href.endsWith("/")
          ? `${href.slice(1)}index.html`
          : href.slice(1);
        if (!files.has(target)) dead.push(`${page} → ${href}`);
      }
    }
    expect(dead).toEqual([]);
  });
});

/** The planned-section links in a page's header, in the order they appear. */
function offeredLinks(page: string): { label: string; href: string }[] {
  const header = /<header[\s\S]*?<\/header>/.exec(page)?.[0] ?? "";
  return [...header.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
    .map(([, href, label]) => ({ label: label.trim(), href }))
    .filter((l) => sections.some((s) => s.href === l.href));
}

describe("header navigation (AC-03)", () => {
  // Decided from the files in src/pages directly, not through the helper the
  // header uses, so the header cannot pass by finding no pages at all.
  const hasPage = (href: string) => {
    const slug = href.replace(/^\/|\/$/g, "");
    return ["astro", "md", "html"].some(
      (ext) =>
        existsSync(`src/pages/${slug}.${ext}`) ||
        existsSync(`src/pages/${slug}/index.${ext}`),
    );
  };

  it("offers every planned section that has a page, in planned order with its label", () => {
    const expected = sections.filter((s) => hasPage(s.href));
    expect(offeredLinks(html("index.html"))).toEqual(expected);
  });
});

describe("header navigation with real section pages (AC-03)", () => {
  // The real site has no section pages yet, so the test above compares two
  // empty lists. Build a temporary copy of the site with section pages planted
  // (one flat, one as a folder index; "People" deliberately left out) and
  // check the header offers exactly those, in planned order with their labels.
  const planted: Record<string, string> = {
    "join/index.astro": "/join/",
    "research.astro": "/research/",
  };
  let root: string | undefined;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "oden-ac03-"));
    for (const entry of [
      "src",
      "public",
      "astro.config.mjs",
      "tsconfig.json",
      "package.json",
    ]) {
      cpSync(entry, join(root, entry), { recursive: true });
    }
    symlinkSync(resolve("node_modules"), join(root, "node_modules"), "dir");
    for (const page of Object.keys(planted)) {
      const file = join(root, "src/pages", page);
      mkdirSync(dirname(file), { recursive: true });
      const layout = relative(
        dirname(file),
        join(root, "src/layouts/Base.astro"),
      );
      writeFileSync(
        file,
        `---\nimport Base from "${layout}";\n---\n\n<Base title="Section"><p>Planted.</p></Base>\n`,
      );
    }
    execFileSync(resolve("node_modules/.bin/astro"), ["build"], {
      cwd: root,
      stdio: "pipe",
    });
  });

  afterAll(() => {
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it("lists exactly the planted sections, in planned order with their labels", () => {
    const hrefs = new Set(Object.values(planted));
    const expected = sections
      .filter((s) => hrefs.has(s.href))
      .map(({ label, href }) => ({ label, href }));
    expect(expected.length).toBeGreaterThan(0);
    expect(expected).toEqual([
      { label: "Research", href: "/research/" },
      { label: "Join/Contact", href: "/join/" },
    ]);
    for (const page of [
      "index.html",
      "research/index.html",
      "join/index.html",
    ]) {
      const built = readFileSync(join(root!, "dist", page), "utf8");
      expect(offeredLinks(built)).toEqual(expected);
    }
  });
});

describe("third-party requests (spec §6 NFR)", () => {
  it("no built page or stylesheet requests another host", () => {
    const config = readFileSync("astro.config.mjs", "utf8");
    const site = /site:\s*"([^"]+)"/.exec(config)?.[1];
    expect(site).toBeDefined();
    const ownHost = new URL(site!).host;
    const offenders = builtFiles()
      .filter((f) => /\.(html|css)$/.test(f))
      .flatMap((f) =>
        findOffSiteRequests(html(f), ownHost).map((url) => `${f} → ${url}`),
      );
    expect(offenders).toEqual([]);
  });
});
