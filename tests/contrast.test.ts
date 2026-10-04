import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkPairs,
  contrastRatio,
  minimumFor,
  resolveTokens,
} from "../src/lib/contrast";
import { contrastPairs } from "../src/styles/contrast-pairs";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#004790", "#004790")).toBeCloseTo(1, 5);
  });

  it("matches the WCAG reference value for #767676 on white", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("rejects a value that is not a hex colour", () => {
    expect(() => contrastRatio("rgba(0,0,0,.5)", "#fff")).toThrow(/hex/);
  });
});

describe("minimumFor", () => {
  it("is 4.5 for body text and 3 for large text and UI", () => {
    expect(minimumFor("body")).toBe(4.5);
    expect(minimumFor("large")).toBe(3);
    expect(minimumFor("ui")).toBe(3);
  });
});

describe("resolveTokens", () => {
  it("resolves var() aliases recursively", () => {
    const tokens = resolveTokens(`:root {
      --color-a: #112233;
      --color-b: var(--color-a);
      --color-c: var(--color-b);
    }`);
    expect(tokens.get("--color-c")).toBe("#112233");
  });

  it("fails on a cycle and on a missing target, naming the token", () => {
    expect(() =>
      resolveTokens(
        ":root { --color-a: var(--color-b); --color-b: var(--color-a); }",
      ),
    ).toThrow(/cycle.*--color-a/);
    expect(() => resolveTokens(":root { --color-a: var(--color-x); }")).toThrow(
      /--color-x/,
    );
  });
});

describe("checkPairs", () => {
  const tokens = new Map([
    ["--color-text", "#000000"],
    ["--color-bg", "#ffffff"],
    ["--color-grey", "#777777"],
  ]);

  it("passes pairs at or above their minimum", () => {
    expect(
      checkPairs(
        [
          {
            name: "body text",
            text: "--color-text",
            background: "--color-bg",
            size: "body",
          },
        ],
        tokens,
      ),
    ).toEqual([]);
  });

  it("names a body pair below 4.5:1 with its ratio, but lets it pass as large text", () => {
    const pair = {
      name: "muted",
      text: "--color-grey",
      background: "--color-bg",
    };
    const [failure] = checkPairs([{ ...pair, size: "body" }], tokens);
    expect(failure).toMatchObject({ name: "muted", minimum: 4.5 });
    expect(failure.ratio).toBeLessThan(4.5);
    expect(checkPairs([{ ...pair, size: "large" }], tokens)).toEqual([]);
  });

  it("names a pair whose token does not exist", () => {
    expect(() =>
      checkPairs(
        [
          {
            name: "ghost",
            text: "--color-none",
            background: "--color-bg",
            size: "body",
          },
        ],
        tokens,
      ),
    ).toThrow(/ghost.*--color-none/);
  });
});

describe("the site's declared pairs", () => {
  it("all meet the readability minimum against tokens.css", () => {
    const tokens = resolveTokens(readFileSync("src/styles/tokens.css", "utf8"));
    const failures = checkPairs(contrastPairs, tokens);
    expect(
      failures.map(
        (f) => `${f.name}: ${f.ratio.toFixed(2)}:1 < ${f.minimum}:1`,
      ),
    ).toEqual([]);
  });

  it("declares the pairs the site uses today, each name unique", () => {
    const names = contrastPairs.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(contrastPairs.length).toBeGreaterThanOrEqual(5);
  });
});
