// Every text/background pairing the site uses, declared next to the palette.
// tests/contrast.test.ts resolves each against tokens.css and fails the build
// when one falls below its WCAG 2.1 AA minimum. A new pairing in a component
// must be added here.
import type { ContrastPair } from "../lib/contrast";

export const contrastPairs: readonly ContrastPair[] = [
  {
    name: "body text on page",
    text: "--color-text",
    background: "--color-bg",
    size: "body",
  },
  {
    name: "muted text on page",
    text: "--color-text-muted",
    background: "--color-bg",
    size: "body",
  },
  {
    name: "link on page",
    text: "--color-link",
    background: "--color-bg",
    size: "body",
  },
  {
    name: "hovered link on page",
    text: "--color-link-hover",
    background: "--color-bg",
    size: "body",
  },
  {
    name: "body text on surface",
    text: "--color-text",
    background: "--color-surface",
    size: "body",
  },
  {
    name: "heading on page",
    text: "--color-brand",
    background: "--color-bg",
    size: "large",
  },
];
