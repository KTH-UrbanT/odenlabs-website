// Finds requests a built page or stylesheet would make to another host
// (spec §6 NFR: third-party requests 0). Plain `<a href>` links and `mailto:`
// are navigation, not requests, and are not reported.

// `<link>` relations that make the browser fetch the target.
const FETCHING_REL =
  /\b(stylesheet|preload|prefetch|modulepreload|icon|apple-touch-icon|manifest|preconnect|dns-prefetch)\b/i;

function isOffSite(url: string, ownHost: string): boolean {
  const u = url.trim();
  if (!/^(https?:)?\/\//i.test(u)) return false;
  try {
    return new URL(u, "https://placeholder.invalid").host !== ownHost;
  } catch {
    return true;
  }
}

/** Every off-site URL that `source` (HTML or CSS) makes the browser request. */
export function findOffSiteRequests(source: string, ownHost: string): string[] {
  const found: string[] = [];
  const add = (url: string) => {
    if (isOffSite(url, ownHost)) found.push(url.trim());
  };

  for (const [, attrs] of source.matchAll(/<link\s([^>]*)>/gi)) {
    const rel = /\brel\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1] ?? "";
    const href = /\bhref\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
    if (href !== undefined && FETCHING_REL.test(rel)) add(href);
  }
  for (const [, url] of source.matchAll(/\ssrc\s*=\s*["']([^"']*)["']/gi)) {
    add(url);
  }
  for (const [, set] of source.matchAll(/\ssrcset\s*=\s*["']([^"']*)["']/gi)) {
    for (const candidate of set.split(","))
      add(candidate.trim().split(/\s+/)[0]);
  }
  for (const [, url] of source.matchAll(
    /url\(\s*["']?([^"')]*?)["']?\s*\)/gi,
  )) {
    add(url);
  }
  for (const [, url] of source.matchAll(/@import\s+["']([^"']+)["']/gi)) {
    add(url);
  }
  return found;
}
