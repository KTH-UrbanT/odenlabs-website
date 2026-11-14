import { describe, expect, it } from "vitest";
import {
  findDraftReferences,
  findPublishedPlaceholders,
  hasPlaceholder,
  isDraft,
  publishedOnly,
} from "../src/lib/drafts";

const theme = (id: string, data = {}, body = "") => ({
  collection: "themes",
  id,
  data: { title: "T", ...data },
  body,
});
const project = (id: string, themes: string[], data = {}) => ({
  collection: "projects",
  id,
  data: {
    themes: themes.map((t) => ({ collection: "themes", id: t })),
    ...data,
  },
});

describe("drafts", () => {
  it("treats only draft: true as a draft", () => {
    expect(isDraft(theme("a", { draft: true }))).toBe(true);
    expect(isDraft(theme("a", { draft: false }))).toBe(false);
    expect(isDraft(theme("a"))).toBe(false);
  });

  it("lists published entries only", () => {
    const all = [theme("a"), theme("b", { draft: true }), theme("c")];
    expect(publishedOnly(all).map((e) => e.id)).toEqual(["a", "c"]);
  });

  it.each(["TODO(maintainer): x", "a TODO(maintainer)", "TODO(anything)"])(
    "finds the placeholder in %j",
    (text) => expect(hasPlaceholder(text)).toBe(true),
  );

  it.each(["todo list", "TODO: later", "A TODO is not a placeholder", ""])(
    "leaves ordinary text alone: %j",
    (text) => expect(hasPlaceholder(text)).toBe(false),
  );
});

describe("findPublishedPlaceholders", () => {
  it("flags a published entry with a placeholder in the body", () => {
    expect(
      findPublishedPlaceholders([
        theme("a", {}, "Text.\n\nTODO(maintainer): more"),
      ]),
    ).toEqual([
      "themes/a holds a TODO placeholder: finish it or set draft: true",
    ]);
  });

  it("flags a placeholder in the front matter", () => {
    expect(
      findPublishedPlaceholders([
        theme("a", { summary: "TODO(maintainer) x" }),
      ]),
    ).toHaveLength(1);
  });

  it("lets a draft keep its placeholders", () => {
    expect(
      findPublishedPlaceholders([
        theme("a", { draft: true }, "TODO(maintainer): more"),
      ]),
    ).toEqual([]);
  });

  it("accepts finished entries", () => {
    expect(findPublishedPlaceholders([theme("a", {}, "Done.")])).toEqual([]);
  });
});

describe("findDraftReferences", () => {
  it("flags a published entry that points at a draft", () => {
    expect(
      findDraftReferences([theme("t", { draft: true }), project("p", ["t"])]),
    ).toEqual([
      "projects/p (themes[0]) → draft themes/t: publish it too or drop the reference",
    ]);
  });

  it("lets a draft point at a draft, and a published entry at a published one", () => {
    expect(
      findDraftReferences([
        theme("t", { draft: true }),
        project("p", ["t"], { draft: true }),
        theme("u"),
        project("q", ["u"]),
      ]),
    ).toEqual([]);
  });
});
