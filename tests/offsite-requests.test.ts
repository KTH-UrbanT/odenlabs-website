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

  it("reports unquoted attributes, poster and SVG image/use href", () => {
    const html = `
      <img src=https://a.example.com/p.png alt=x>
      <link rel=stylesheet href=https://b.example.com/s.css>
      <video poster="https://c.example.com/v.jpg"></video>
      <svg><image href="https://d.example.com/i.svg"/><use href="https://e.example.com/s.svg#i"/></svg>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual(
      [
        "https://a.example.com/p.png",
        "https://b.example.com/s.css",
        "https://c.example.com/v.jpg",
        "https://d.example.com/i.svg",
        "https://e.example.com/s.svg#i",
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

  it("reports an entity-encoded url() in a style attribute, as Astro emits it", () => {
    const html = `
      <div style="background-image:url(&quot;https://bg.example.com/z.jpg&quot;)"></div>
      <div style="background:url(&#34;https://a.example.com/a.png&#34;)"></div>
      <div style="background:url(&#39;https://b.example.com/b.png&#39;)"></div>
      <div style="background:url(&apos;https://c.example.com/c.png&apos;)"></div>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual(
      [
        "https://bg.example.com/z.jpg",
        "https://a.example.com/a.png",
        "https://b.example.com/b.png",
        "https://c.example.com/c.png",
      ].sort(),
    );
  });

  it("decodes &amp; in attribute values before reporting", () => {
    const html = '<img src="https://img.example.com/p.png?a=1&amp;b=2">';
    expect(findOffSiteRequests(html, own)).toEqual([
      "https://img.example.com/p.png?a=1&b=2",
    ]);
  });

  it("allows an entity-encoded own-host or relative url()", () => {
    const html = `
      <div style="background-image:url(&quot;/bg.jpg&quot;)"></div>
      <div style="background-image:url(&quot;https://oden.abe.kth.se/bg.jpg&quot;)"></div>
      <div style="background-image:url(&#39;img/bg.jpg&#39;)"></div>`;
    expect(findOffSiteRequests(html, own)).toEqual([]);
  });

  it("does not decode entity-encoded page text outside style attributes", () => {
    const html =
      "<p>Write url(&quot;https://x.example.com/a&quot;) in your CSS.</p>";
    expect(findOffSiteRequests(html, own)).toEqual([]);
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
