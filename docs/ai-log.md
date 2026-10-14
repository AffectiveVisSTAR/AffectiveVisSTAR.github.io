# AI Usage Log

This log documents how we use AI tools in the INF219 project. Add one short entry
per AI session or pull request, with the newest entry at the top.

## Entry template

Copy this block and fill it in:

```markdown
## YYYY-MM-DD – <short title>
- **Who:** <group member>
- **Tool:** <e.g. Claude Code (Opus 5.5), ChatGPT, Copilot>
- **Purpose:** <what we wanted to achieve>
- **What the AI did:** <code / text / explanation / debugging + files touched>
- **What we did / verified:** <review, testing, own changes>
- **Link:** <PR / commit>
```

---

## 2026-10-14 – Deploy inf219 app to GitHub Pages
- **Who:** Aimee Hong
- **Tool:** Claude Code (Opus 5.5)
- **Purpose:** 
  Make our new app the page people see on affectivevisstar.github.io, instead of the old website.
- **What the AI did:** 
  Found out why the old website was still showing, suggested how to fix it, and changed the settings so that GitHub builds and publishes our new app instead.
- **What we did / verified:** 
  We approved the plan and checked that the project still built on our machine. 
- **Link:** [202ddad](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/commit/202ddad5f49d60a97878e0cfd65d51cf9f7dddae)

## 2026-10-08 – Add corpus table with grouped classification panels
- **Who:** Aimee Hong
- **Tool:** Claude Code (Opus 5.5)
- **Purpose:** 
  Show all papers in a table with colored panels for each classification group,based on our sketch of the page.
- **What the AI did:** 
  Wrote the code for the table: loading the data, grouping the columns into panels, and drawing one row per paper with colored squares. It also removed our first test table, and explained each file to us.
- **What we did / verified:** 
  We gave the AI our plan and sketch, read through the explanation of each file, checked that the table looked right in the browser, and made the commit ourselves.
- **Link:** [04326a8](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/commit/04326a886ae85d00eca9d201fffb9844bf0c498b)

## 2026-10-01 – Set up new project
- **Who:** Aimee Hong
- **Tool:** ChatGPT
- **Purpose:** 
  Get started with a new website project for our corpus visualization.
- **What the AI did:** 
  Explained how to create a new Next.js project and which
  commands to type in the terminal.
- **What we did / verified:** 
  We ran the commands ourselves, chose the  project
  settings, removed the example content from the start page, and checked that the site opened in the browser. No code written by the AI was added to the project.
- **Link:** [d28ad39](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/commit/d28ad399d0071c990d54678a19a2a1efdec47dff)
