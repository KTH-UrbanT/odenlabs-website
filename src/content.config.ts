import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One Markdown file per entry; the file name (kebab-case) is the entry ID.
// README.md in each folder documents the fields and is not an entry.
// `draft: true` keeps an unfinished entry off the site (src/lib/drafts.ts).
const draft = z.boolean().default(false);
const entries = (folder: string) =>
  glob({
    pattern: ["**/*.md", "!**/README.md"],
    base: `./src/content/${folder}`,
  });

const themes = defineCollection({
  loader: entries("themes"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().int().default(0),
    draft,
  }),
});

const people = defineCollection({
  loader: entries("people"),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      themes: z.array(reference("themes")).default([]),
      photo: image().optional(),
      email: z.email().optional(),
      links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
      alumni: z.boolean().default(false),
      order: z.number().int().default(0),
      draft,
    }),
});

const projects = defineCollection({
  loader: entries("projects"),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string(),
        themes: z.array(reference("themes")).min(1),
        people: z.array(reference("people")).default([]),
        funder: z.string().optional(),
        start: z.coerce.date().optional(),
        end: z.coerce.date().optional(),
        url: z.url().optional(),
        // The thumbnail in the project gallery, with a description for readers
        // who cannot see it.
        image: image().optional(),
        imageAlt: z.string().trim().min(1).optional(),
        draft,
      })
      .refine((p) => p.image === undefined || p.imageAlt !== undefined, {
        path: ["imageAlt"],
        message: "imageAlt is required when image is set",
      }),
});

const education = defineCollection({
  loader: entries("education"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    kind: z.enum(["course", "programme", "handbook"]),
    code: z.string().optional(),
    people: z.array(reference("people")).default([]),
    // An external page, or a file on this site (a path starting with "/").
    url: z.union([z.url(), z.string().regex(/^\/[^/]/)]).optional(),
    order: z.number().int().default(0),
    draft,
  }),
});

export const collections = { themes, people, projects, education };
