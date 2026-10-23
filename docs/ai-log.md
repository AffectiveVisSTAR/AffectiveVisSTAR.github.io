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

## 2026-10-23 – Highlight emotion rows on hover
- **Who:** Elise
- **Tool:** ChatGPT (Codex)
- **Purpose:** Make it easier to follow an emotion row across all table panels.
- **What the AI did:** Added shared hover state in `EmotionTable.tsx` and synchronised row emphasis in `EmotionColumn.tsx` and `EmotionGroupPanel.tsx`. Memoised visible groups and matching article lists so hovering does not repeat paper matching. Used the original corpus table’s 40% opacity for other rows, leaving the hovered row at normal visibility. Applied fading to row content rather than individual squares. Kept all heatmap squares at their normal colours. Hovering a square emphasises its emotion labels on the left and column label above, while other labels fade to 40%. Added shared column hover state and bold text for both the active emotion labels and column, without row backgrounds or guide lines. Preserved square colours and article tooltips.
- **What we did / verified:** The AI checked the production build, TypeScript and lint. Browser interaction and Safari scrolling still need to be checked locally.
- **Link:** [Issue #30](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/issues/30)

## 2026-10-23 – Use consistent colours within emotion panels
- **Who:** Elise
- **Tool:** ChatGPT
- **Purpose:** Fix misleading colour differences between subgroups in the emotions table.
- **What the AI did:** Identified that Data and Vis used different base colours. Explained two possible solutions and suggested changing group.color to color in inf219/components/emotions/EmotionGroupPanel.tsx, so squares use their main panel’s colour.
- **What we did / verified:** I reviewed the colour definitions and explanation, chose to use the main panel’s colour, and made the code change locally.
- **Link:** [PR #36](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/pull/36)

## 2026-10-21 – Show matching articles on hover
- **Who:** Elise
- **Tool:** ChatGPT
- **Purpose:** Show which articles contribute to each square in the emotions table.
- **What the AI did:** Suggested code changes in `inf219/lib/emotion-layout.ts` and `inf219/components/emotions/EmotionGroupPanel.tsx` to return an alphabetical list of unique articles and display it below the count in the hover tooltip. Explained the changes step by step.
- **What we did / verified:** I added the changes locally, reviewed the explanations, and checked the tooltips in the browser. I verified that Anger/Engagement showed eight distinct articles matching the original page.
- **Link:** [PR #29](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/pull/29)

## 2026-10-21 – Use a fixed emotion colour scale
- **Who:** Elise
- **Tool:** ChatGPT
- **Purpose:** Apply the paper-count colour intervals specified in issue #18 consistently across the emotions table.
- **What the AI did:** Suggested code changes in `inf219/components/emotions/EmotionGroupPanel.tsx` to replace the relative scale with fixed intervals, make zero-count squares white, and darken the colour for 11 or more papers. Kept the opaque colour calculation used for the Safari fix and explained the code.
- **What we did / verified:** I implemented the changes locally, reviewed the code with step-by-step explanations, and compared the table visually with the original page and the requested scale.
- **Link:** [PR #27](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/pull/27)

## 2026-10-14 – Reduce Safari scrolling lag
- **Who:** Elise
- **Tool:** ChatGPT
- **Purpose:** Reduce severe scrolling lag on the emotions page in Safari.
- **What the AI did:** Changed `inf219/components/emotions/EmotionGroupPanel.tsx` on a test branch to calculate colours blended with white instead of applying CSS opacity to each square. Explained the change and how to copy the commit to an issue branch.
- **What we did / verified:** I tested the updated version locally in Safari and observed that scrolling no longer lagged. The old version still caused severe lag. I then copied the fix to the branch for issue #23. The fix was later merged on 21 October.
- **Link:** [PR #26](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/pull/26)

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

## 2026-10-13 – Build the emotions table
- **Who:** Elise
- **Tool:** ChatGPT
- **Purpose:** Build an emotions table using the corpus table layout and the original emotions page as references.
- **What the AI did:** Helped write and revise the emotion types, data loader, page and table components in `inf219/lib/types.ts`, `inf219/lib/emotion-data.ts`, `inf219/lib/emotion-layout.ts`, `inf219/app/emotions/page.tsx` and `inf219/components/emotions/`. Suggested collapsible emotion groups and counting unique articles instead of summing counts that could include duplicates. Explained the code and Git workflow step by step.
- **What we did / verified:** I contributed local changes, reviewed the explanations of the files and functions, and checked the layout and collapse behaviour in the browser. I compared Anger/Engagement with the original page and verified that the count was eight unique articles.
- **Link:** [PR #20](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/pull/20)

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

## 2026-10-14 – Adding navigation bar
- **Who:** Jenny
- **Tool:** Copilot
- **Purpose:** Create a navigation bar at the top of the website, and that is clickable so it can change between the corpus table and the emotions table
- **What the AI did:** Implemented a shared navigation bar in `NavigationBar.tsx`, and added this in `layout.tsx` so that it is visible on all websites with clickable links to the Corpus Classification Table and Emotions by Everything. AI also adjusted the height of the site such that the navigation bar is placed over the table. At the end AI ran a lint and build to controll that the changes worked.  
- **What we did / verified:** I reviewed the changes, and checked if the links where clickable and that the design looked well-organized. I added an underline effect when you hover over the tabs as well. I also went in and changed the names for the tabs so it made more sense to what it actually showed. Lastly, I approved the plan and checked that the project still built on our machine. 
- **Link:** [PR #32 / be11687](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/pull/32)

## 2026-10-22 – Added number of articles in each column to the corpus
- **Who:** Jenny
- **Tool:** Copilot, ChatGPT
- **Purpose:** Add the number of articles for each column in the corpus
- **What the AI did:** I used ChatGPT to help me explain the code in `GroupPanel.tsx`, and Copilot helped to make an implementation of code in the file. At the end Copilot ran a lint and build to controll that the changes made worked. 
- **What we did / verified:** I reviewed the changes made, Copilot added the numbers on the top in the column, so I changed it to the bottom. I approved the plan and checked that the project still built on our machine. 
- **Link:** [PR #33 / e4a5872](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/commit/e4a5872ae5ba89aec37a66d615e8a20268b26c7e)  

## 2026-10-22 – Remove color on boxes without any articles
- **Who:** Jenny
- **Tool:** ChatGPT
- **Purpose:** Remove the tinted color on the cells that doesn't have any articles
- **What the AI did:** I used GhatGPT to help me understand `GroupPanel.tsx` at first, then this explanation helped me to understand `Cell.tsx` so that I could make the change.
- **What we did / verified:** I changed a line in `Cell.tsx`from `tint(color, "1a")` to just `transparent`, this way the cells is transparent. At the end I checked that the project still built on my machine, and that the changes looked okay. 
- **Link:** [PR #34 / 16462ae](https://github.com/AffectiveVisSTAR/AffectiveVisSTAR.github.io/commit/16462aeef3a23ffbb716fd80301462ee4872415b)
