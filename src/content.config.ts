import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One Markdown file per entry; the file name (kebab-case) is the entry ID.
// README.md in each folder documents the fields and is not an entry.
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
    }),
});

const projects = defineCollection({
  loader: entries("projects"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    themes: z.array(reference("themes")).min(1),
    people: z.array(reference("people")).default([]),
    funder: z.string().optional(),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    url: z.url().optional(),
  }),
});

export const collections = { themes, people, projects };
