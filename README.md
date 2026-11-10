# AffectiveVisSTAR

Source for <https://affectivevisstar.github.io/>

## Repository layout

- `inf219/` – the Next.js web app (the published site). See [`inf219/README.md`](inf219/README.md) for development and for how to refresh the table data.
- `scripts/` – Python tools for exporting/processing the corpus data. `scripts/corpus260130_to_json.py` writes the app's JSON files into `inf219/public/`. See `scripts/docs/` for the individual tools.
- `docs/ai-log.md` – log of AI assistance used in the project.
- `.github/workflows/nextjs.yml` – builds `inf219/` and deploys it to GitHub Pages.

An earlier prototype app used to live at the repository root (`src/`, `public/`, …). It was removed; it is still available in git history at the `pre-cleanup` tag / commit `89529e8`, e.g. `git show 89529e8:src/app/page.tsx`.

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

The Next.js app uses a static export (`output: "export"` in `inf219/next.config.ts`) so the workflow can upload the generated `inf219/out/` directory to GitHub Pages.
