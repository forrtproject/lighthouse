# Lighthouse Beta

A React rebuild of Lighthouse focused on the evidence behind individual papers, and
later authors and institutions. The current Flask site in the repository root is
untouched. See [../BETA_PLAN.md](../BETA_PLAN.md) for the plan and the decisions taken.

> **All data in the beta is invented placeholder data.** That covers the papers,
> people, institutions, journals, comments and numbers. DOIs use the `10.5555` test
> prefix, and no ORCIDs are given. Data sources are still being decided.

## Run it

Requires Node 20.19 or later.

```sh
cd beta/web
npm install
npm run dev        # http://localhost:5180
```

Other commands:

- `npm run build` writes a production build to `dist/`.
- `npm run typecheck` runs TypeScript only.

The "Current site" link in the top bar goes to `http://localhost:8080/` by default.
Override it with `VITE_CLASSIC_URL`.

## Pages

| Route | What it shows |
|---|---|
| `/` | DOI lookup and the three sample papers, each with an animated mini trust ring |
| `/paper/<doi>` | The full evidence profile of one paper (described below) |
| `/author/<id>` | Author X-ray (described below) |
| `/explore` | Aggregates by country, field and year; `?country=DE&field=Memory` filters everything |
| `/institutions` | Every institution, with its derived departments |
| `/institution/<id>` | Institution page; `?dept=<slug>` scopes the whole page to one department |

The paper page is laid out verdict-first:
- **Hero.** The paper's identity sits beside a trust card with a gauge and six
  dimension bars. Selecting a bar opens that dimension's reasons.
- **Six key-signal tiles**, each answering one question:
  - Replicated?
  - How much of the effect survives?
  - Integrity
  - Statistics
  - Open science
  - PubPeer

  Each tile gives a number, a small graphic, a status icon and a word, and links to
  its section.
- **A sticky sidebar of sections.** Each entry shows the section's status, so the
  navigation doubles as a summary. On narrow screens it becomes a horizontal strip.
- **Answer-first sections.** Each opens with the question and the answer, for example
  "Has it held up? **No**: 1 of 4 replications succeeded…". The evidence follows:
  - how the score is built: a waterfall and every reason
  - the evidence timeline
  - the forest plot, sample sizes and reanalyses
  - statistics and openness, side by side
  - PubPeer
  - citations
  - the authors

The answers are computed in `src/lib/signals.ts` from the same evidence as the trust
model, so the tiles, the sidebar and the headings always agree.

The **author X-ray** follows the same pattern, with one deliberate difference: **people
get no score**.

- **Hero.** Identity sits beside a *replication footprint*: a waffle with one square
  per paper, grey where the paper has never been tested. Most of anyone's work is
  untested, and the waffle shows that.
- **Six tiles:**
  - papers
  - citations, with h-index
  - held up?
  - replications run
  - open science
  - integrity
- **Answer-first sections:**
  - output: papers by author position, citations, and a topic treemap that filters
    the paper list
  - has their work held up? A paper landscape, with untested papers shown in grey,
    and a detail card for the selected paper
  - do they check others' work?
  - how open is their work, over time and early versus recent?
  - integrity notices
  - co-author network: draggable, and co-authors who have their own X-ray link to it
  - affiliation timeline
  - every paper: filterable and searchable

Fairness rules live in `src/lib/authorStats.ts`:
- coverage is shown beside every replication figure
- with fewer than 3 tested papers the verdict is "Too few tested"
- untested papers are never counted as good or bad
- there is no ranking
- every page has a "report an error / this isn't me" link

Placeholder careers are generated deterministically in `src/data/authorProfiles.ts`.
They are merged with the sample papers, and with the replications each author ran in
the sample data. Self-replications are excluded from "checks others' work".

### Institution pages

Institution pages answer questions like "who here works on X?" in the same
answer-first layout.

**Scope.** Choosing a department rescopes every figure and sets `?dept=` in the URL,
so a department view can be shared and the Back button works.

**Sections:**
- departments, shown as a treemap
- **how departments were derived:** every raw affiliation string and its result
- a topic × department heatmap; clicking a cell lists those researchers
- an **alphabetical** researcher directory, never ranked
- replication evidence by department, with the share tested on every bar
- open-science trend
- output by department
- collaborating institutions, which link to their own pages

**Departments are derived.** No bibliographic source stores departments, so
`src/lib/departments.ts` parses them from the affiliation strings on papers. It
handles:
- English, German, Dutch, Portuguese/Spanish and Japanese unit words
- abbreviations such as "Dept.", "Fac." and "Sch."
- strings that carry only a subject keyword
- strings that name no department at all

Each match is labelled:
- **named unit:** a unit word plus a subject, such as "Department of Psychology"
- **keyword only:** a subject word with no unit
- **could not place**

A researcher's department is the majority vote across their strings.
`npm test` runs the parser tests.

### Explore (aggregates)

`/explore` rolls the evidence up by country, institution, field and year.

**Sections:**
- **World choropleth** with a metric switch: papers, share tested, share held up, open
  science. The geometry is Natural Earth via `world-atlas`, bundled locally and lazy
  loaded.
- **Field → outcome Sankey**, with coverage per field.
- **Year × field heatmap** of open-science practice.
- **Evidence landscape:** a scatter of share tested against share held up, one bubble
  per country or institution.
- **Sortable table with CSV download.**

**Filters.** Clicking a country or a field filters the whole page, and the filter is
kept in the URL.

**Small groups.** A group with fewer than 10 tested papers is greyed out and marked
"too few to compare" instead of being compared.

**Consistent totals.**
- A researcher with several topics counts fractionally in each, so field totals add up
  to the real number of papers.
- The figures match the institution pages. Germany, for example, shows the same 54 of
  91 tested papers held up as Halden.

## How it is built

- **React + TypeScript + Vite.** Routes are lazy-loaded.
- **Apache ECharts** is the charting library. It is configured in `src/lib/echarts.ts`:
  - only the modules in use are registered, rendered as SVG
  - the chart theme is read from the FORRT/Atlas design tokens, so charts follow
    light and dark mode
- **Charts** are rendered by `src/components/Chart.tsx`, which:
  - creates each chart when it first scrolls into view, so its entry animation is
    seen
  - resizes the chart with its container
  - rebuilds the chart on a theme change
  - passes clicks through to the page

  `src/components/ChartCard.tsx` adds a title, a one-line summary, the sources and a
  **Chart / Data table** toggle. The table is the accessible alternative for every
  chart.
- **Interaction and motion.** All charts have tooltips, hover emphasis and staggered
  entry animations. Most can also be selected:
  - a trust dimension opens its reasons
  - a study opens its details, in sync between the forest plot and the sample-size
    chart
  - a timeline marker pins its details
  - a PubPeer year or topic filters the comments

  The time charts zoom and pan, and legends toggle series. Motion is switched off
  under `prefers-reduced-motion`.
- **Trust model:** `src/lib/trust.ts`.
  - Scores are computed from the evidence records and are never entered by hand.
  - Dimensions with no evidence are left out and the remaining weights are rescaled.
    The share of the model that was assessed is shown as coverage.
  - A retraction caps the score at 10.
  - The weights are a draft, kept in one place for discussion.
- **Data layer:** `src/data/`.
  - `types.ts` mirrors the planned database schema.
  - `index.ts` holds async access functions.
  - `placeholder.ts` holds the sample data.

  Replacing `placeholder.ts` with an API or SQLite/DuckDB loader does not touch the UI.

## Known gaps

- The ECharts chunk is about 250 kB gzipped. It is split into its own cached file and
  could be trimmed further later.
- The author X-ray, institution pages, aggregates and database are later phases (see
  the plan).
