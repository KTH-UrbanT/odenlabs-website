// Build tests: the site builds, and the built output keeps its promises
// (front page, navigation that leads somewhere).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

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
