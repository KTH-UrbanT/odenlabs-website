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
});
