# Editing the website content

For group members who edit the site directly, with or without an AI agent. The agent rules are
in `AGENTS.md`; give that file to any agent you use (Claude Code reads it through `CLAUDE.md`).

## What you can edit

The Markdown files in `src/content/`: `themes/`, `people/` and `projects/`. One file per
entry; the file name is the ID. The fields are listed in the `README.md` of each folder.
You cannot change anything else without the maintainer: a pull request that touches other
files waits for their review.

## Three ways to edit

1. **In the browser (no setup).** Open the file on GitHub, click the pencil, edit, choose
   "Create a new branch and start a pull request". Wait for the green `check`, then merge.
2. **With an agent on your computer.** Clone the repository, start your agent in it (it reads
   `AGENTS.md`), describe the change, review the diff, let it open the pull request.
3. **With a cloud agent** connected to GitHub (for example Claude Code on the web or Codex
   cloud). Point it at this repository and ask for a pull request.

Whatever you use, you review the result. The agent only proposes.

## Recipes

- **Edit your bio:** change the text under the front matter in `people/<your-id>.md`.
- **Add a person:** copy an existing file in `people/`, name it `first-last.md`, set `name`
  and `role`. Add `themes: [...]` with existing theme IDs if you like.
- **Add a project:** copy a file in `projects/`; it needs `title`, `summary` and at least one
  theme. Use `start` and `end` as `2025-01-01` when you know them.
- **Not ready yet?** Add `draft: true` to the front matter. It is saved but not shown.
- **Publish a draft:** remove `draft: true` and every `TODO(...)` line.

Example request to an agent: "Add Jane Doe, doctoral student, working on urban energy, to the
people. Her bio is the text below. Do not add anything I have not given you."

## When `check` is red

| Message | Meaning |
| --- | --- |
| `holds a TODO placeholder: finish it or set draft: true` | A published entry still has `TODO(...)`. Finish it or add `draft: true`. |
| `→ draft ...: publish it too or drop the reference` | A published entry refers to a draft. Publish both or remove the link. |
| `→ missing themes/...` | A theme or person ID does not exist. Check the file name. |
| a schema error naming a field | A required field is missing or has the wrong type (for example a date or a URL). |
| `Prettier` | Run `npm run format`, or let the agent do it. |

Nothing reaches visitors until `check` passes and the pull request is merged. A merged
mistake is fixed with another pull request, or by reverting the old one.

## Who decides

The maintainer owns the code, the deployment and these instructions. Content pull requests
that pass `check` may be merged by their author; questions about facts go to the person the
entry is about.
