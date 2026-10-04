# Oden Lab website

The website of the Oden Lab research group at KTH, built with [Astro](https://astro.build)
as a static site and published at <https://oden.abe.kth.se/>.

## Run it locally

```sh
nvm use          # Node version from .nvmrc
npm ci
npm run dev      # http://localhost:4321
```

Before pushing: `npm run lint && npm test`.

## Edit content

All content is Markdown files under `src/content/`. The file name is the entry's ID,
in kebab-case. Each folder has a `README.md` listing the fields.

- **Add a research theme:** create `src/content/themes/<theme-id>.md` with `title` and
  `summary`.
- **Add a person:** create `src/content/people/<first-last>.md` with `name` and `role`.
  List their themes by ID (`themes: [urban-energy]`). Put a photo next to the file and
  point `photo:` at it.
- **Add a project:** create `src/content/projects/<project-id>.md` with `title`,
  `summary` and at least one theme ID; list members by person ID.

If a field is missing or an ID points at an entry that does not exist, the build fails
and tells you which file to fix, so a mistake never reaches the live site.

## Publishing

Merging to `main` publishes the site to the shared KTH server folder. A publish
removes only files the site itself published or a maintainer approved, and stops
before changing anything when something looks wrong. How it decides, the rules files
and the rollout steps: [`deploy/README.md`](deploy/README.md).

## Deploy

GitHub Actions (`.github/workflows/publish.yaml`):

- **Pull requests:** install, lint, test and build. Merge only when it is green.
- **Push to `main`:** the same checks, then the built `dist/` is copied over SSH to the
  KTH server, using the repository secrets `SSH_HOST`, `SSH_USERNAME`,
  `SSH_PRIVATE_KEY` and `SSH_TARGET_DIR`.

So publishing an update is: edit a file, open a pull request, merge.
