import { describe, expect, it } from "vitest";
import { findOffSiteRequests } from "../src/lib/offsite-requests";

const own = "oden.abe.kth.se";

describe("findOffSiteRequests", () => {
  it("reports an off-site stylesheet link", () => {
    const html =
      '<link rel="stylesheet" href="https://fonts.example.com/a.css">';
    expect(findOffSiteRequests(html, own)).toEqual([
      "https://fonts.example.com/a.css",
    ]);
  });

  it("reports an off-site script, image, srcset entry and url()", () => {
    const html = `
      <script src="https://cdn.example.com/x.js"></script>
      <img src="//img.example.com/p.png" srcset="/a.png 1x, https://img2.example.com/b.png 2x">
      <div style="background: url('https://bg.example.com/z.jpg')"></div>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual(
      [
        "https://cdn.example.com/x.js",
        "//img.example.com/p.png",
        "https://img2.example.com/b.png",
        "https://bg.example.com/z.jpg",
      ].sort(),
    );
  });

  it("reports off-site @import and url() in CSS", () => {
    const css = `@import "https://a.example.com/a.css";
      @import url(https://b.example.com/b.css);
      .x { background: url(https://c.example.com/c.png); }`;
    expect(findOffSiteRequests(css, own).sort()).toEqual([
      "https://a.example.com/a.css",
      "https://b.example.com/b.css",
      "https://c.example.com/c.png",
    ]);
  });

  it("allows own-host, relative and data URLs, plain links and mailto", () => {
    const html = `
      <link rel="stylesheet" href="/a.css">
      <link rel="canonical" href="https://oden.abe.kth.se/">
      <img src="https://oden.abe.kth.se/logo.svg">
      <img src="data:image/png;base64,AAAA">
      <a href="https://www.kth.se/">KTH</a>
      <a href="mailto:a@b.se">mail</a>
      <style>.x { background: url(/p.png) }</style>`;
    expect(findOffSiteRequests(html, own)).toEqual([]);
  });
});
