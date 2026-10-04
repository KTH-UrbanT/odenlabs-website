// Skeleton smoke test: the site builds and produces a front page.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("astro build", () => {
  it("produces dist/index.html", () => {
    execFileSync("npx", ["astro", "build"], { stdio: "pipe" });
    expect(existsSync("dist/index.html")).toBe(true);
    expect(readFileSync("dist/index.html", "utf8")).toContain("<main");
  });
});
