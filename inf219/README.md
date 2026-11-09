## Updating table data

The app reads JSON files from `inf219/public/`. To refresh them from the main
Google Sheet, install the Python dependencies in a virtual environment and run
the exporter from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r scripts/requirements.txt
python3 scripts/corpus260130_to_json.py
```

If your terminal is inside `inf219/`, run `python3 ../scripts/corpus260130_to_json.py`
instead (with the virtual environment activated).

The exporter reads the `classificationtable` and `emotionmapping` tabs and writes
`classtable.json`, `emotions_by_everything.json`, `classtable_metadata.json` and
`classtable_column_mapping.json` directly to `inf219/public/`. Default output
paths are based on the script location, so no manual copying is needed regardless
of the terminal's working directory. Explicit `--output*` arguments still override
these defaults; relative overrides are relative to the terminal's working directory.

The sheet must be readable without signing in. Use `--input-url` to select a
different Google Sheet, and `--help` to see all options.

Review the generated changes and test Corpus and Emotions locally before committing
the updated data. Push and deploy the changes to update the published site.
Editing the sheet alone does not automatically refresh the site.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
