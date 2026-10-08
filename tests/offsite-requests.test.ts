import { describe, expect, it } from "vitest";
import {
  findOffSiteRequests,
  legacyUrls,
  readFlat,
  readMarkup,
  type Reading,
} from "../src/lib/offsite-requests";

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

  it("reports an entity-encoded url() in single-quoted, unquoted and hex-encoded style values", () => {
    const html = `
      <div style='background:url(&quot;https://b.example.com/x&quot;)'></div>
      <div style="background:url(&#x22;https://h.example.com/x&#x22;)"></div>
      <div style=background:url(&quot;https://c.example.com/x&quot;)></div>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "https://b.example.com/x",
      "https://c.example.com/x",
      "https://h.example.com/x",
    ]);
  });

  it("reports an entity-encoded url() in any attribute, as Astro emits SVG mask and filter", () => {
    const html = `
      <svg><path mask="url(&quot;https://m.example.com/m.svg#m&quot;)" filter='url(&quot;https://f.example.com/f.svg#f&quot;)'/></svg>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "https://f.example.com/f.svg#f",
      "https://m.example.com/m.svg#m",
    ]);
  });

  it("reports an entity-encoded url() in a <style> inside inline SVG", () => {
    const html = `<svg viewBox="0 0 1 1"><style>.a { fill: url(&quot;https://s.example.com/p.svg#p&quot;); }</style></svg>`;
    expect(findOffSiteRequests(html, own)).toEqual([
      "https://s.example.com/p.svg#p",
    ]);
  });

  it("decodes numeric references without ';' and the named punctuation references", () => {
    const html = `
      <div style="background:url(&#34https://d.example.com/x&#34)"></div>
      <div style="background:url(&quot;https&colon;&sol;&sol;e.example.com/x&quot;)"></div>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "https://d.example.com/x",
      "https://e.example.com/x",
    ]);
  });

  it("does not decode twice", () => {
    const html =
      '<div style="background:url(&amp;quot;https://f.example.com/x&amp;quot;)"></div>';
    expect(findOffSiteRequests(html, own)).toEqual([]);
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

  it("reads a tag whose other attributes hold a raw '<', '</svg>' or a '/' separator", () => {
    const html = `
      <div class="card" title="Jane <PI>" style="background-image:url(&quot;https://cdn.example.com/jane.jpg&quot;)"></div>
      <div title="1 < 2" style='background:url("https://x.example.com/a")'></div>
      <svg aria-label="a</svg>b"><style>.a{fill:url(&quot;https://o.example.com/p#p&quot;)}</style></svg>
      <svg aria-label="a<b"><style>.a{fill:url(&quot;https://s.example.com/p#p&quot;)}</style></svg>
      <svg><path/mask="url(&quot;https://m.example.com/m#m&quot;)"/></svg>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "https://cdn.example.com/jane.jpg",
      "https://m.example.com/m#m",
      "https://o.example.com/p#p",
      "https://s.example.com/p#p",
      "https://x.example.com/a",
    ]);
  });

  it("decodes &quot;, &amp;, &lt; and &gt; without ';' as the browser does", () => {
    const html = `
      <div style="background:url(&quot https://a.example.com/x&quot)"></div>
      <div style="background:url(&QUOT//lq.example.com/x&QUOT)"></div>
      <svg><style>.a{fill:url(&quothttps://b.example.com/p#p&quot)}</style></svg>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "//lq.example.com/x",
      "https://a.example.com/x",
      "https://b.example.com/p#p",
    ]);
  });

  it("leaves a legacy reference followed by a letter, digit or '=' in an attribute", () => {
    const html = `<div style="background:url(&quothttps://c.example.com/x&quot)"></div>`;
    expect(findOffSiteRequests(html, own)).toEqual([]);
  });

  it("matches named references by exact case", () => {
    const html = `
      <div style="background:url(&quot;https&Colon;//d.example.com/x&quot;)"></div>
      <div style="background:url(&quot;https:&SOL;&SOL;e.example.com/x&quot;)"></div>
      <div style="background:url(&Quot https://q.example.com/x&Quot)"></div>`;
    expect(findOffSiteRequests(html, own)).toEqual([]);
  });

  it("decodes a hex reference without ';' and the remaining named punctuation", () => {
    const html = `
      <div style="background:url(&#x22https://h2.example.com/x&#x22)"></div>
      <div style="background:url&lpar;&quot;https://p1.example.com/x&quot;&rpar;"></div>
      <div style="background:url(&quot;https://p2&period;example.com/x&quot;)"></div>
      <div style="background:url(&Tab;&quot;https://t.example.com/x&quot;)"></div>
      <div style="background:url(&quot;https://n.example.com/x&quot;&NewLine;)"></div>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "https://h2.example.com/x",
      "https://n.example.com/x",
      "https://p1.example.com/x",
      "https://p2.example.com/x",
      "https://t.example.com/x",
    ]);
  });

  it("reads upper-case tags and attributes", () => {
    const html = `
      <DIV STYLE=background:url(&quot;https://u1.example.com/x&quot;)></DIV>
      <SVG><STYLE>.a{fill:url(&quot;https://u2.example.com/x&quot;)}</STYLE></SVG>`;
    expect(findOffSiteRequests(html, own).sort()).toEqual([
      "https://u1.example.com/x",
      "https://u2.example.com/x",
    ]);
  });

  it("does not decode a plain <style>, a <style> after </svg>, or attribute-like page text", () => {
    const html = `
      <style>.a{background:url(&quot;https://s1.example.com/x&quot;)}</style>
      <svg></svg><style>.b{background:url(&quot;https://s2.example.com/x&quot;)}</style>
      <p>Set style=url(&quot;https://s3.example.com/a&quot;) here</p>`;
    expect(findOffSiteRequests(html, own)).toEqual([]);
  });

  it("skips script text when reading tags", () => {
    const html = `
      <script>if (a<b) s = 'x</script>
      <div style="background:url(&quot;https://z1.example.com/x&quot;)"></div>`;
    expect(findOffSiteRequests(html, own)).toEqual([
      "https://z1.example.com/x",
    ]);
  });

  it("skips comments when reading tags", () => {
    const html = `
      <!-- a<b c='x -->
      <div style="background:url(&quot;https://z2.example.com/x&quot;)"></div>`;
    expect(findOffSiteRequests(html, own)).toEqual([
      "https://z2.example.com/x",
    ]);
  });

  it("ends an unquoted value at whitespace", () => {
    const html = `<div title=a style="x>y;background:url(&quot;https://w.example.com/x&quot;)"></div>`;
    expect(findOffSiteRequests(html, own)).toEqual(["https://w.example.com/x"]);
  });

  it("scans malformed url() input in linear time", () => {
    const started = performance.now();
    expect(findOffSiteRequests("url(".repeat(200000), own)).toEqual([]);
    expect(performance.now() - started).toBeLessThan(1000);
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

  // T31 (review 2026-10-05 pass 5, F5-01 to F5-05).
  const D = `<div style="background:url(&quot;https://x.example.com/a&quot;)"></div>`;
  const X = "https://x.example.com/a";

  describe("built CSS read as markup (F5-01)", () => {
    it("reports an off-site url() after a minified range query", () => {
      const css =
        "@media (40rem<width<60rem){.b{color:red}}.hero{background:url(//cdn.example.com/hero.jpg)}";
      expect(findOffSiteRequests(css, own)).toEqual([
        "//cdn.example.com/hero.jpg",
      ]);
    });

    it("reports an @import after a minified range query", () => {
      const css = `@media (40rem<width<60rem){.b{color:red}}@import "https://fonts.example.com/a.css";`;
      expect(findOffSiteRequests(css, own)).toEqual([
        "https://fonts.example.com/a.css",
      ]);
    });

    it("reports a url() after a container query and a child combinator", () => {
      const css = `@container (40rem<width<60rem){}.b{background:url(https://x.example.com/b)}.c>.d{}`;
      expect(findOffSiteRequests(css, own)).toEqual([
        "https://x.example.com/b",
      ]);
    });

    it("reports a url() after a string holding '<b'", () => {
      const css = `.f:before{content:"<b"}.g{background:url(https://cdn.example.com/g.png)}`;
      expect(findOffSiteRequests(css, own)).toEqual([
        "https://cdn.example.com/g.png",
      ]);
    });

    it("reads an escaped '(' in an unquoted url()", () => {
      expect(
        findOffSiteRequests(
          ".a{background:url(https://ep.example.com/a\\(b)}",
          own,
        ),
      ).toEqual(["https://ep.example.com/a\\(b"]);
    });
  });

  describe("one attribute reader (F5-02, F5-03)", () => {
    it("reads a <link> and an <image> after a raw '>' in a quoted value", () => {
      const html = `
        <link title="Jane > PI" rel="stylesheet" href="https://c.example.com/x.css">
        <svg><image title="Jane > PI" href="https://d.example.com/x.png"/></svg>`;
      expect(findOffSiteRequests(html, own).sort()).toEqual([
        "https://c.example.com/x.css",
        "https://d.example.com/x.png",
      ]);
    });

    it("reads attributes separated by '/'", () => {
      const html = `
        <img/src="https://a.example.com/a.png">
        <link/rel="stylesheet"/href="https://b.example.com/a.css">
        <svg><image/href="https://c.example.com/a.png"/></svg>`;
      expect(findOffSiteRequests(html, own).sort()).toEqual([
        "https://a.example.com/a.png",
        "https://b.example.com/a.css",
        "https://c.example.com/a.png",
      ]);
    });

    it("reads xlink:href, upper-case names and a long tag name", () => {
      const html = `
        <svg><USE XLINK:HREF="https://u.example.com/s.svg#i"/></svg>
        <${"x".repeat(100)} src="https://l.example.com/a.png">`;
      expect(findOffSiteRequests(html, own).sort()).toEqual([
        "https://l.example.com/a.png",
        "https://u.example.com/s.svg#i",
      ]);
    });

    it("reads whitespace around '='", () => {
      const html = `
        <div style ="background:url(&quot;https://a.example.com/a&quot;)"></div>
        <div style= "background:url(&quot;https://b.example.com/a&quot;)"></div>
        <img src = "https://c.example.com/a.png">`;
      expect(findOffSiteRequests(html, own).sort()).toEqual([
        "https://a.example.com/a",
        "https://b.example.com/a",
        "https://c.example.com/a.png",
      ]);
    });

    it("does not report a non-fetching <link> or a plain <a href>", () => {
      const html = `<link title="a > b" rel="canonical" href="https://x.example.com/">
        <a title="a > b" href="https://x.example.com/">x</a>`;
      expect(findOffSiteRequests(html, own)).toEqual([]);
    });

    it.each(["<link ", "<use ", "<image "])(
      "scans %s with no closing '>' in linear time",
      (open) => {
        const started = performance.now();
        expect(findOffSiteRequests(open.repeat(200000), own)).toEqual([]);
        expect(performance.now() - started).toBeLessThan(1000);
      },
    );

    it("scans pathological CSS and markup in linear time", () => {
      for (const input of [
        "<a ".repeat(200000),
        "<!--".repeat(200000),
        "<![CDATA[".repeat(100000),
        "<svg><style>".repeat(100000),
        "<script ".repeat(100000),
        "&".repeat(500000),
      ]) {
        const started = performance.now();
        findOffSiteRequests(input, own);
        expect(performance.now() - started).toBeLessThan(1000);
      }
    });
  });

  describe("regions end where the browser ends them (F5-04)", () => {
    it("reads <noscript> as markup", () => {
      expect(findOffSiteRequests(`<noscript>${D}</noscript>`, own)).toEqual([
        X,
      ]);
    });

    it.each([
      ["<!-->", "<!--> D <!-- c -->"],
      ["<!--->", "<!---> D"],
      ["--!>", "<!-- a --!> D"],
    ])("ends a comment at %s", (_name, html) => {
      expect(findOffSiteRequests(html.replace("D", D), own)).toEqual([X]);
    });

    it("ends a bogus comment at the next '>'", () => {
      for (const html of [
        `<![CDATA[ <a title=" ]]> ${D}`,
        `</ <a title="> ${D}`,
        `<? <a title="?> ${D}`,
      ]) {
        expect(findOffSiteRequests(html, own)).toEqual([X]);
      }
    });

    it("ends CDATA inside SVG at ']]>'", () => {
      const html = `<svg><![CDATA[ <a title=" ]]></svg>${D}`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it("ends a raw-text element only at its own end tag", () => {
      const html = `<script>a="</scripts>";b='<a title="'</script>${D}`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it("ends a raw-text element at an end tag followed by whitespace or '/'", () => {
      for (const end of ["</script >", "</script/>", "</SCRIPT>"]) {
        expect(
          findOffSiteRequests(`<script>'<a title="'${end}${D}`, own),
        ).toEqual([X]);
      }
    });

    it("keeps reading after an SVG <style> with no end tag", () => {
      const html = `<svg><style>.a{}</svg>${D}`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it("still decodes the text of an unterminated SVG <style>", () => {
      const html = `<svg><style>.a{fill:url(&quot;${X}&quot;)}`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it("ends an SVG <style> at '</style' followed by whitespace", () => {
      const html = `<svg><style>.a{fill:url(&quot;https://s.example.com/a&quot;)}</style ></svg>${D}`;
      expect(findOffSiteRequests(html, own).sort()).toEqual([
        "https://s.example.com/a",
        X,
      ]);
    });
  });

  describe("mutants that hid a request (F5-05)", () => {
    it("reads an SVG <style> after a stray '</svg>'", () => {
      const html = `</svg><svg><style>.a{fill:url(&quot;${X}&quot;)}</style></svg>`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it("finds the end of <SCRIPT> in upper case", () => {
      const html = `<SCRIPT>if (a<b) s = 'x</SCRIPT>${D}`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it.each([
      "textarea",
      "title",
      "xmp",
      "iframe",
      "noembed",
      "noframes",
      "style",
    ])("does not read tags inside <%s>", (name) => {
      const html = `<${name}><a title="</${name}>${D}`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });

    it("leaves '&quot=' and '&quot1' undecoded in an attribute", () => {
      const html = `
        <div style="background:url(//w1.example.com/a&quot=x)"></div>
        <div style="background:url(//w2.example.com/a&quot1)"></div>`;
      expect(findOffSiteRequests(html, own).sort()).toEqual([
        "//w1.example.com/a&quot=x",
        "//w2.example.com/a&quot1",
      ]);
    });

    it("reports each URL once", () => {
      const html = `<div style="background:url('https://x.example.com/a')"></div>`;
      expect(findOffSiteRequests(html, own)).toEqual([X]);
    });
  });

  // T33 (review 2026-10-07 pass 6, R6-02): the reader must not lose sync.
  describe("reader desync (R6-02)", () => {
    const IMG = '<img src="https://t.example.com/p.png">';
    const T = "https://t.example.com/p.png";
    const ODD = `<script>const t = '<span title="';</script>`;

    it.each([
      ["a self-closing <svg/>", `<svg/>${ODD}${IMG}`],
      ["a self-closing <svg />", `<svg />${ODD}${IMG}`],
      ["a self-closing <svg class=a/ >", `<svg class="a"/>${ODD}${IMG}`],
      [
        "<foreignObject>",
        `<svg><foreignObject>${ODD}${IMG}</foreignObject></svg>`,
      ],
      ["<desc>", `<svg><desc>${ODD}${IMG}</desc></svg>`],
      ["an HTML tag ending the SVG", `<svg><p>${ODD}${IMG}`],
      ["<math>", `<math><mi>x</mi></math>${ODD}${IMG}`],
      ["an unclosed <svg>", `<svg>${ODD}${IMG}`],
      [
        "<noscript> with scripting on",
        `<noscript><script>x='<a title="'</script></noscript>${IMG}`,
      ],
      [
        "<noscript> text with an odd quote",
        `<noscript><p title="</noscript>${IMG}`,
      ],
    ])("reports an image after %s", (_label, html) => {
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it("does not treat '/' in an unquoted value as a self-closing tag", () => {
      const html = `<svg data-x=a/>${IMG}</svg>`;
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it("ends an unterminated SVG <style> at an upper-case </SVG>", () => {
      expect(findOffSiteRequests(`<svg><style>.a{}</SVG>${D}`, own)).toEqual([
        X,
      ]);
    });

    it("keeps NBSP out of the attribute separators", () => {
      const html = `<a title=\u00A0">${IMG}`;
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it("keeps NBSP out of raw-text end tags", () => {
      const html = `<script>a="</script\u00A0>";b='<a title="'</script>${IMG}`;
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it("still ignores page text and own-host images after the extra readings", () => {
      const html = `<svg/><p>&lt;img src="https://t.example.com/p.png"&gt;</p>
        <img src="/p.png"><img src="https://oden.abe.kth.se/p.png">`;
      expect(findOffSiteRequests(html, own)).toEqual([]);
    });

    it("stays linear with the extra readings", () => {
      for (const input of [
        "<svg/>".repeat(200000),
        "<math><svg>".repeat(100000),
        "<noscript><script ".repeat(100000),
        "<a title=\u00A0".repeat(100000),
      ]) {
        const started = performance.now();
        findOffSiteRequests(input, own);
        expect(performance.now() - started).toBeLessThan(1000);
      }
    });
  });

  // T34 (review 2026-10-08, pass 7, F7-01 to F7-03): a page that needs different
  // readings in different places, and one test per mutant of the T33 fixes.
  describe("region-free pass and per-reading guarantees (T34)", () => {
    const T = "https://t.example.com/p.png";
    const IMG = `<img src="${T}">`;
    const ODD = `<script>const t = '<span title="';</script>`;
    const STYLE_URL = `.a{background:url(&quot;${T}&quot;)}`;
    // An attribute that makes the browser fetch `value` (named `src` or `href`,
    // so a name that swallowed a separator, such as `\tsrc`, doesn't count).
    const hasValue = (tags: { attrs: [string, string][] }[], value: string) =>
      tags.some((tag) =>
        tag.attrs.some(
          ([n, v]) => (n === "src" || n === "href") && v === value,
        ),
      );
    const foreignOn: Reading = { foreign: true, noscriptRaw: false };
    const foreignOff: Reading = { foreign: false, noscriptRaw: false };

    // Inputs the browser fetches that every whole-page reading can miss.
    const desync: [string, string][] = [
      ["a script in an SVG <title>", `<svg><title>${ODD}${IMG}</title></svg>`],
      ["an <img> in an SVG <style>", `<svg><style>${IMG}</style></svg>`],
      [
        "a </div> ending the SVG before <style/>",
        `<div><svg><path d="M0"></div>${ODD}<svg><style/></svg>${IMG}`,
      ],
      [
        "a decoded url() in an SVG <style> after a breakout",
        `<svg><p>${ODD}<svg><style>${STYLE_URL}</style></svg>`,
      ],
      [
        "a comment in an SVG <style>",
        `<svg><style><!-- </style><a title=" --></style></svg>${IMG}`,
      ],
      [
        "CDATA in an SVG <style>",
        `<svg><style><![CDATA[ a{} /* </style><a title=" */ ]]></style></svg>${IMG}`,
      ],
      [
        "a stray </math> inside an SVG",
        `<svg></math><script>${IMG}</script></svg>`,
      ],
      ["a tag name of 70 characters", `<${"a".repeat(70)}='>${IMG}`],
    ];

    it.each(desync)("the union reports an image after %s", (_label, html) => {
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it.each(desync)("the region-free pass alone reports %s", (_label, html) => {
      const read = readFlat(html);
      const found =
        hasValue(read.tags, T) || read.decoded.some((v) => v.includes(T));
      expect(found).toBe(true);
    });

    it("the region-free pass keeps a tag to its own '>' and '<'", () => {
      const read = readFlat(`<a title="x<y" src="${T}">`);
      expect(hasValue(read.tags, T)).toBe(true);
      expect(
        findOffSiteRequests(`<a href="/x">${IMG.slice(0, 4)}`, own),
      ).toEqual([]);
    });

    // Each row isolates one fix: the single reading named must report the URL,
    // so another reading (or the region-free pass) can't hide a regression.
    it.each<[string, string, Reading]>([
      [
        "<svg/> opens nothing",
        `<svg/>${ODD}<svg><title>${IMG}</title></svg>`,
        foreignOn,
      ],
      [
        "'/' in an unquoted value is not self-closing",
        `<svg data-x=a/><title>${IMG}</title></svg>`,
        foreignOn,
      ],
      [
        "</SVG> in upper case ends an SVG <style>",
        `<svg><style>.a{}</SVG>${IMG}`,
        foreignOn,
      ],
      [
        "<math> starts foreign content",
        `<math><title>${IMG}</title></math>`,
        foreignOn,
      ],
      [
        "a self-closing <style/> opens no text run",
        `<svg><style/><image href="${T}"/></svg>`,
        foreignOn,
      ],
      [
        "a stray </math> does not close an SVG",
        `<svg></math><script>${IMG}</script></svg>`,
        foreignOn,
      ],
      ["a tab between attributes", `<img\tsrc="${T}">`, foreignOff],
      ["a form feed between attributes", `<img\fsrc="${T}">`, foreignOff],
      [
        "a tab after the tag name",
        `<script\t>x</script><img\tsrc="${T}">`,
        foreignOff,
      ],
      [
        "NBSP is not an attribute separator",
        `<a title=\u00A0">${IMG}`,
        foreignOff,
      ],
      [
        "NBSP does not end an unquoted value",
        `<a title=x\u00A0b=">${IMG}`,
        foreignOff,
      ],
      ["NBSP is part of a tag name", `<a\u00A0title=">${IMG}`, foreignOff],
      [
        "an unquoted value ends at HTML whitespace",
        `<a title=x =">${IMG}`,
        foreignOff,
      ],
    ])("reading alone: %s", (_label, html, reading) => {
      expect(hasValue(readMarkup(html, reading).tags, T)).toBe(true);
    });

    it("reading alone: decoded values come from the reading that stays in sync", () => {
      const html = `<noscript><p title="</noscript><div style="background:url(&quot;${T}&quot;)"></div>`;
      const read = readMarkup(html, { foreign: false, noscriptRaw: true });
      expect(read.decoded.some((v) => v.includes(T))).toBe(true);
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it("the region-free pass decodes attribute values", () => {
      const html = `<div style="background:url(&quot;${T}&quot;)"></div>`;
      expect(readFlat(html).decoded.some((v) => v.includes(T))).toBe(true);
    });

    it("the region-free pass reads a quote that never closes to the tag's end", () => {
      const html = `<div style="background:url(&quot;${T}&quot;)>`;
      expect(readFlat(html).decoded.some((v) => v.includes(T))).toBe(true);
    });

    it("keeps a quoted '>' inside the readings and still unions the flat pass", () => {
      const html = `<a title="a>b" src="${T}">`;
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it("stays linear on SVG <style> runs without an end and on unclosed tags", () => {
      const n = 60000;
      for (const input of [
        "<svg><style></SVG".repeat(n),
        "<svg><style></svg>".repeat(n),
        "<svg><style>".repeat(n),
        "<style>".repeat(n * 2),
        "<a x=1 ".repeat(n * 2),
        "<a ".repeat(n * 2),
        `<${"a".repeat(1_000_000)}`,
        "<svg><p><style/>".repeat(n),
      ]) {
        const started = performance.now();
        findOffSiteRequests(input, own);
        expect(performance.now() - started).toBeLessThan(1000);
      }
    });
  });

  // T36 (review 2026-10-08, pass 8, G8-01 to G8-04).
  describe("flat pass fixes and the legacy scan (T36)", () => {
    const T = "https://t.example.com/p.png";
    const IMG = `<img src="${T}">`;
    const ODD = `<script>const t = '<span title="';</script>`;
    const STYLE_URL = `.a{background:url(&quot;${T}&quot;)}`;
    const foreignOn: Reading = { foreign: true, noscriptRaw: false };
    const hasValue = (tags: { attrs: [string, string][] }[], value: string) =>
      tags.some((tag) =>
        tag.attrs.some(
          ([n, v]) => (n === "src" || n === "href") && v === value,
        ),
      );
    const decodedHas = (decoded: string[]) =>
      decoded.some((v) => v.includes(T));

    // A quoted '>' or '<' before the fetching attribute, after a desync: the
    // legacy scan reads these, the region-free pass does not.
    const quoted: [string, string][] = [
      [
        "a quoted '>' in an SVG <style>",
        `<svg><style><img alt="a > b" src="${T}"></style></svg>`,
      ],
      [
        "a quoted '<' in an SVG <style>",
        `<svg><style><img alt="<" src="${T}"></style></svg>`,
      ],
      [
        "a quoted '>' after a breakout script",
        `<svg><title>${ODD}<img alt="a > b" src="${T}"></title></svg>`,
      ],
      [
        "a quoted </style>",
        `<svg><style><img title="</style>" src="${T}"></style></svg>`,
      ],
      [
        "a quoted </svg>",
        `<svg><title>${ODD}<img alt="</svg>" src="${T}"></title></svg>`,
      ],
      [
        "a quoted 'a<b>' after a comment in an SVG <style>",
        `<svg><style><!-- </style><a title=" --></style></svg><img alt="a<b>" src="${T}">`,
      ],
      [
        "a quoted '<' before <link rel>",
        `<svg><style><link alt="a<b" rel="stylesheet" href="${T}"></style></svg>`,
      ],
      [
        "a quoted '<' before <image href>",
        `<svg><style><image alt="a<b" href="${T}"/></style></svg>`,
      ],
    ];

    it.each(quoted)("the union reports an image after %s", (_label, html) => {
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    it.each(quoted)("the legacy scan alone reports %s", (_label, html) => {
      expect(legacyUrls(html)).toContain(T);
    });

    it("the legacy scan reads src, poster and srcset after a quoted value", () => {
      const html = `<video alt="a" src="https://s.example.com/a" poster='https://p.example.com/b' srcset="https://r.example.com/c 2x, /a.png 1x">`;
      expect(legacyUrls(html).sort()).toEqual(
        [
          "/a.png",
          "https://p.example.com/b",
          "https://r.example.com/c",
          "https://s.example.com/a",
        ].sort(),
      );
    });

    it("the legacy scan decodes entities and reads xlink:href and the last start", () => {
      expect(
        legacyUrls(`<img alt="a" src="&#104;ttps://d.example.com/a">`),
      ).toEqual(["https://d.example.com/a"]);
      expect(legacyUrls(`<use alt="a<b" xlink:href="${T}"/>`)).toEqual([T]);
      expect(
        legacyUrls(`<link rel=author <link rel=stylesheet href=${T}>`),
      ).toContain(T);
      expect(legacyUrls(`<link rel="author" href="${T}">`)).toEqual([]);
    });

    it("a plain <style> after a self-closing <svg/> or a closed <math> is not decoded", () => {
      for (const html of [
        `<svg/><style>${STYLE_URL}</style>`,
        `<math><style>.a{}</math><p>url(&quot;${T}&quot;)</p>`,
      ])
        expect(findOffSiteRequests(html, own)).toEqual([]);
    });

    it("the legacy scan ignores plain links and own-host attributes", () => {
      const html = `<a href="https://a.example.com/x">x</a><p data-src="${T}"></p>`;
      expect(findOffSiteRequests(html, own)).toEqual([]);
    });

    // G8-03 (a): svg and math are counted apart, '/' in a value is no '/>'.
    it("the region-free pass counts svg and math apart", () => {
      const html = `<svg><p>${ODD}</math><svg></math><style>${STYLE_URL}</style></svg>`;
      expect(decodedHas(readFlat(html).decoded)).toBe(true);
    });

    it("the region-free pass does not read '/' in an unquoted value as '/>'", () => {
      const html = `<svg data-x=a/><style>${STYLE_URL}</style></svg>`;
      expect(decodedHas(readFlat(html).decoded)).toBe(true);
    });

    // G8-03 (b): the flat style run ends where the SVG does.
    it("the region-free pass ends an unterminated SVG <style> at </svg>", () => {
      const html = `<svg><style>.a{}</svg><p>url(&quot;https://x.example.com/a.png&quot;)</p>`;
      expect(findOffSiteRequests(html, own)).toEqual([]);
    });

    // G8-04: one row per surviving mutant.
    it("reading alone: a tag name of 70 characters", () => {
      const html = `<${"a".repeat(70)}='><img alt=">" src="${T}">`;
      expect(hasValue(readMarkup(html, foreignOn).tags, T)).toBe(true);
    });

    it("reading alone: an SVG <style> ends at its own </style>", () => {
      const html = `<svg><style>.a{}</style><title><img alt=">" src="${T}"></title></svg>`;
      expect(hasValue(readMarkup(html, foreignOn).tags, T)).toBe(true);
    });

    it.each([
      [
        "a second SVG <style> after a first",
        `<svg><style>.a{}</style></svg><svg><p>${ODD}<svg><style>${STYLE_URL}</style></svg>`,
      ],
      [
        "an upper-case <STYLE>",
        `<svg><p>${ODD}<svg><STYLE>${STYLE_URL}</STYLE></svg>`,
      ],
      [
        "a single open <svg>",
        `<div><svg><path d="M0"></div>${ODD}</svg><svg><style>${STYLE_URL}</style></svg>`,
      ],
    ])("the region-free pass decodes %s", (_label, html) => {
      expect(decodedHas(readFlat(html).decoded)).toBe(true);
    });

    it("decoded values are unioned from every reading", () => {
      const html = `<noscript><p title="</noscript><div title='<' style="background:url(&quot;${T}&quot;)"></div>`;
      expect(findOffSiteRequests(html, own)).toEqual([T]);
    });

    // G8-01: no input is quadratic.
    it("stays linear on tag names that contain '<' and on repeated tag starts", () => {
      for (const input of [
        "<a".repeat(500000),
        '<a"'.repeat(333334),
        "<a=".repeat(333334),
        "<svg<".repeat(200000),
        "<link ".repeat(160000),
        "<image ".repeat(130000),
        "<link a='".repeat(110000),
        ' src="'.repeat(160000),
        " src=".repeat(200000),
        `src${" ".repeat(1_000_000)}`,
        "<link ".repeat(80000) + ">",
      ]) {
        const started = performance.now();
        findOffSiteRequests(input, own);
        expect(performance.now() - started).toBeLessThan(1000);
      }
    });
  });
});
