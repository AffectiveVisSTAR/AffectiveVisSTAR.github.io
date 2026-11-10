# AffectiveVisSTAR

Source for <https://affectivevisstar.github.io/>

## Repository layout

- `app/`, `components/`, `lib/`, `public/` – the Next.js web app (the published site).
- `scripts/` – Python tools for exporting/processing the corpus data. See `scripts/docs/` for the individual tools.
- `docs/ai-log.md` – log of AI assistance used in the project.
- `.github/workflows/nextjs.yml` – builds the app and deploys it to GitHub Pages.

History notes:

- The app used to live in an `inf219/` subfolder and was moved to the repository root. To follow a file's history across the move, use `git log --follow <file>`.
- An earlier prototype app used to live at the repository root (`src/`, `public/`, …). It was removed; it is still available at the `pre-cleanup` tag / commit `89529e8`, e.g. `git show 89529e8:src/app/page.tsx`.

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000> in your browser. `npm run build` produces the static export in `out/`, and `npm run lint` runs ESLint.

## Updating table data

The app reads JSON files from `public/`. To refresh them from the main
Google Sheet, install the Python dependencies in a virtual environment and run
the exporter from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r scripts/requirements.txt
python3 scripts/corpus260130_to_json.py
```

The exporter reads the `classificationtable` and `emotionmapping` tabs and writes
`classtable.json`, `emotions_by_everything.json`, `classtable_metadata.json` and
`classtable_column_mapping.json` directly to `public/`. Default output
paths are based on the script location, so no manual copying is needed regardless
of the terminal's working directory. Explicit `--output*` arguments still override
these defaults; relative overrides are relative to the terminal's working directory.

The sheet must be readable without signing in. Use `--input-url` to select a
different Google Sheet, and `--help` to see all options.

Review the generated changes and test Corpus and Emotions locally before committing
the updated data. Push and deploy the changes to update the published site.
Editing the sheet alone does not automatically refresh the site.

## GitHub Pages

This repository is configured as an organization/user GitHub Pages site:

- Repository: `AffectiveVisSTAR/AffectiveVisSTAR.github.io`
- Site URL: `https://affectivevisstar.github.io/`
- Pages source: GitHub Actions

If the repository is renamed, renamed back, or the site starts returning 404:

1. Confirm the repository name is exactly `AffectiveVisSTAR.github.io`.
2. In GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` or rerun the `Deploy Next.js site to Pages` workflow.
4. Check the workflow deploy URL is `https://affectivevisstar.github.io/`.

The Next.js app uses a static export (`output: "export"` in `next.config.ts`) so the workflow can upload the generated `out/` directory to GitHub Pages.
