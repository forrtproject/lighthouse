# Lighthouse Beta: plan

**Status: draft for discussion.** The current Flask site stays exactly as it is. The
beta is a separate React app with its own API and database. Items marked **Decision**
need a call from the team before the work they block can start.

## Decisions so far

| Question | Decision |
|---|---|
| Verdict for a DOI | A **trust score shown as graphs**, never as a bare number. The graphs are a gauge for the overall score, a bullet bar per dimension and a contribution waterfall. Every reason sits beside them. |
| Where the code lives | `beta/` in this repo |
| Database | SQLite or DuckDB, for later. **For now the beta runs on static placeholder data** shaped like the schema in §5. |
| Data sources | Still open (§2). The placeholder data is clearly fictional. |
| Charts | **Apache ECharts** is the official charting library. Every chart is interactive and animated, and respects reduced-motion settings. |
| Look | The FLoRA Replication Atlas theme: FORRT tokens, Domine and Source Sans 3. |
| UX method | UX decisions are checked against the `ui-ux-pro-max` skill guidance (chart types, accessibility, navigation). |
| First build | The paper (DOI) page, end to end. It is built in `beta/web`. |
| Aggregates | `/explore` covers country, field and year: a world map, field → outcome flows, a practice heatmap, a coverage × outcome landscape and a CSV table. Groups with fewer than 10 tested papers are marked "too few to compare". |
| Institutions | Built on generated rosters. Departments are **derived** from raw affiliation strings by a tested, multilingual parser, and every derivation is shown. Any page can be scoped to a department through the URL. Researchers are listed alphabetically, never ranked. |
| Author X-ray | Built on generated placeholder careers. It follows the paper page's layout but gives **no score to people**: the summary is a replication-coverage waffle, and verdicts fall back to "Too few tested". |

## What a researcher needs to see about a paper

This list is the brief for the paper page, in the order a researcher asks the
questions:

1. **What is it?**
   - authors and their affiliations
   - venue and date
   - design, sample and the headline effect size
   - the central claim, in one sentence
2. **Can I trust it?** A trust score across six dimensions:
   - replication
   - reproducibility
   - integrity
   - transparency
   - statistics
   - community review

   The page also shows how much of the score rests on actual evidence (coverage and
   confidence).
3. **Has it held up?**
   - every replication, with its N, effect size, 95% CI, design and outcome
   - a forest plot against the original effect
   - pooled and meta-analytic estimates
   - the original study's power to detect the effect that replications found
4. **Can it be reproduced?** Computational reproductions, robustness checks and
   multiverse reanalyses.
5. **Is it reported soundly?** Reported p-values recomputed from their test statistics
   (statcheck-style), with any change to the significance decision flagged.
6. **Is it open?**
   - preregistration and Registered Reports
   - data, code and materials
   - open access
   - conflict-of-interest statement
   - reporting guidelines
7. **What do people say?**
   - PubPeer comments, coded positive, neutral or critical
   - the topics they raise (statistics, data, images, methods and so on)
   - whether the authors replied
8. **Is the field still citing it?**
   - citations per year, by stance (supporting, mentioning, contrasting)
   - failed replications and integrity notices marked on the chart
   - citations after a retraction called out
   - attention outside academia: news, policy, syllabi, Wikipedia and social media
9. **Integrity events:** corrections, expressions of concern and retractions. These
   appear as a banner, on the timeline and in the score. A retraction caps the score.

---

## 1. What the beta does

| # | Feature | In one line |
|---|---|---|
| 1 | Graph-first UI | Every screen is built around dense, interactive charts, with a table behind each one. |
| 2 | DOI → rigour | Paste a DOI and get an evidence profile: what is known about how robust the paper is, and why. |
| 3 | Author X-ray | Click an author to see their output, open-science practice, replication footprint and network. |
| 4 | Institution and department | Who works on a topic at a given university (for example TU Chemnitz), and what their evidence record looks like. |
| 5 | Aggregates | The same measures rolled up by country, institution, field and year. |
| 6 | Database | One relational store for papers, authors, institutions, replication links and evidence signals, with provenance. |

## 2. Data sources

Most of the evidence already exists inside FORRT. The beta joins it to authorship data.

| Source | Gives us | Already used by FORRT? |
|---|---|---|
| **FLoRA** | Original ↔ replication and reproduction pairs, with coded outcomes | Yes (`FReD-data`, `flora-backend`) |
| **FReD** | Effect sizes of replications | Yes (`FReD-data`) |
| **Lighthouse sheet** | Effects, with their foundational papers, critiques, meta-analyses and Wikipedia links | Yes (this repo) |
| **Retraction Watch** (via Crossref) | Retractions, expressions of concern and corrections | Yes (`import_xlsx.py`) |
| **SCORE / COS** | Predicted replicability for about 3k papers | Yes (`FReD-data/cos_score_integration`) |
| **Registered Reports list** | Whether a paper is a Registered Report | Yes (`flora_chromium`) |
| **OpenAlex** | Authors, ORCID, institutions (ROR), countries, topics, citations, open-access status, raw affiliation strings | Yes (`flora-extractor`, for discovery) |
| **Crossref** | Fallback metadata and update notices | Partly |
| **PubPeer** | Number of post-publication comments | Planned ("work in progress" on the About page) |

**Coverage caveat.** These sources together describe a few thousand papers in depth.
For any other DOI, the beta can show metadata from OpenAlex and Crossref and the
retraction status, but it will have no replication evidence. The UI must say so
clearly: no replication on record is not the same as replicated.

## 3. Feature design

### 3.1 DOI → rigour (evidence profile)

The input is a DOI in any form (`https://doi.org/…`, `doi:…`, or a bare `10.x/y`).

The output is a **profile, not just a number**. Every signal shows its value, its
direction, its source and a one-line reason.

| Signal | Source | Effect on robustness |
|---|---|---|
| Replications and their outcomes (successful, mixed or failed) | FLoRA | Strongest signal. Weighted by the number of replications and how consistent their outcomes are. |
| Reproductions and robustness checks (same data reanalysed) | FLoRA | Strong. |
| Retracted, expression of concern, corrected | Retraction Watch | A retraction overrides everything else. A correction is noted. |
| Critiques and meta-analyses | Lighthouse | Context. A meta-analysis can strengthen or weaken the finding. |
| Registered Report or preregistered | RR list | Positive design signal. |
| Predicted replicability | SCORE | Shown only where it exists, labelled as a prediction. |
| Open access, and data or code links | OpenAlex and Unpaywall | Transparency signal. Weak, and partial coverage. |
| PubPeer comments | PubPeer | Shown as a count with a link. Never treated as a verdict. |
| Citations, and citations after a failed replication | OpenAlex | Context: is the field still citing it? |

**Charts on this page:**
- a timeline of the original paper, its replications (coloured by outcome), its
  critiques and any retraction
- a waterfall of signals that shows how each one moves the overall assessment
- citations per year, with markers for replication events
- forest-style dot plots of FReD effect sizes, original against replications, where
  FReD has them

**Decision A:** how should the verdict be presented? This is asked in chat.

### 3.2 Author X-ray (what we need)

**Identity**
- name variants, ORCID, OpenAlex ID
- an affiliation timeline: institutions and countries by year
- main topics and fields

**Output and impact**
- works and citations per year
- h-index and i10-index
- field-weighted citation impact, where OpenAlex has it
- top venues
- share of papers as first, middle or last author

**Replication footprint** (the core of the X-ray)
- *as an original author*: how many of their papers have been replicated, with the
  outcome breakdown and a link to each replication
- *as a replicator*: replications and reproductions they ran of other people's work
- retractions, corrections and expressions of concern on their papers
- critiques and meta-analyses that involve their papers (from Lighthouse)

**Open-science practice**
- share of their papers that are open access
- number of Registered Reports
- papers with data or code links, where these can be detected

**Network**
- a co-author graph. The edge weight is the number of shared papers, and node colour
  shows the co-author's replication involvement.
- institutions they have collaborated with

**Charts on this page:**
- a stacked timeline of output, citations and replication events
- a horizontal bar chart of replication outcomes
- the affiliation Gantt chart
- a topic treemap
- the force-directed co-author network
- a radar chart of open-science practice

**Fairness rules.** These are built into the X-ray because it profiles named people:
- show the coverage next to every replication statistic, for example "4 of 112 papers
  have any replication evidence"
- no league tables and no ranking of individual researchers
- every number links to the records behind it
- a "report an error / this is not me" link on every author page
- public sources only

### 3.3 Institution and department

**Institutions** come from ROR and OpenAlex IDs and are reliable. A typical query:
*TU Chemnitz → authors → filter by topic or time window*.

**Departments are not structured anywhere.** OpenAlex only keeps the raw affiliation
string, for example "Department of Psychology, Chemnitz University of Technology". The
beta needs to:
- parse department names out of those strings with rules, and an optional LLM pass for
  the hard cases
- normalise the names per institution
- mark each department as "derived" in the UI

**Page contents:**
- the authors at the institution or department, with their X-ray summary metrics
- a map of topics
- the replication footprint over time
- the institution's collaborating institutions, shown as a map or chord diagram

### 3.4 Aggregates

Group by **country, institution, field, discipline and year**. Measures:
- papers with replication evidence
- outcome distribution
- retraction rate
- open-access share
- number of Registered Reports

**Charts:**
- a world choropleth map
- a Sankey diagram of field → outcome
- a heatmap of year × field
- small multiples per country

Every aggregate shows its N and its coverage.

## 4. Architecture

```
beta/
├── web/        React + TypeScript + Vite. Charts: Apache ECharts (network, geo, sankey,
│               treemap, heatmap), plus D3 where a chart needs custom layout. Styling: the
│               FORRT tokens and fonts already used by the current site.
├── api/        Python (FastAPI). Read-only JSON API. Live OpenAlex/Crossref fallback
│               for DOIs that are not in the database, cached once fetched.
├── etl/        Python jobs: load FLoRA, FReD, Lighthouse, Retraction Watch, SCORE and
│               RR → enrich from OpenAlex → compute signals → refresh aggregates.
└── db/         SQL migrations (schema below) and seed scripts.
```

Python for the API and ETL matches the existing pipelines (this repo, `flora-extractor`
and the FReD scripts are all Python or R), so loaders can be reused.

**Decision B:** where the beta lives and which database it uses. This is asked in chat.

## 5. Database schema (first version)

```sql
-- Core bibliographic entities
work            (id, doi UNIQUE, openalex_id, title, year, type, venue_id,
                 is_oa, oa_status, cited_by_count, fwci, abstract, updated_at)
venue           (id, openalex_id, issn_l, name, publisher)
author          (id, openalex_id UNIQUE, orcid, display_name, name_variants[])
institution     (id, ror UNIQUE, openalex_id, name, type, country_code,
                 city, lat, lon, parent_id)
department      (id, institution_id, name, normalised_name, derived BOOLEAN)
topic           (id, openalex_id, name, field, domain)

-- Authorship and affiliations (one row per author per institution per paper)
work_author     (work_id, author_id, position, is_corresponding, raw_affiliation)
authorship_affiliation (work_id, author_id, institution_id, department_id NULL)
work_topic      (work_id, topic_id, score)
citation_year   (work_id, year, count)

-- Evidence
replication_link (id, original_work_id, target_work_id, kind  -- replication | reproduction | robustness
                  outcome, outcome_quote, source, source_row_id)
effect           (id, name, discipline, cluster, description)      -- from Lighthouse
effect_work      (effect_id, work_id, role)  -- foundational | critique | meta_analysis | replication
retraction       (work_id, nature, date, notice_doi, pubmed_id, source)
registered_report(work_id, source)
score_prediction (work_id, value, method, source)
pubpeer_summary  (work_id, comment_count, last_comment_at, url)

-- Derived and explainable
rigor_signal    (work_id, signal, value, weight, direction, reason, source, computed_at)
rigor_summary   (work_id, grade, evidence_level, computed_at)  -- see Decision A

-- Provenance
source_snapshot (id, source, version, fetched_at, row_count)

-- Materialised views for fast pages: author_stats, institution_stats,
-- department_stats, country_stats, field_year_stats
```

**Scope of stored data.**
1. Every paper FORRT already tracks: about 3k FLoRA pairs and the 1.5k Lighthouse papers.
2. Every author of those papers.
3. Each of those authors' full publication lists from OpenAlex. The X-ray statistics
   need the denominator, so this is needed. Expect a few hundred thousand works.

Anything else is fetched on demand and cached.

## 6. Phases

| Phase | Delivers |
|---|---|
| 0 | Repo scaffold, database schema, ETL for FORRT sources and OpenAlex enrichment, API skeleton, design tokens |
| 1 | DOI → evidence profile, with charts |
| 2 | Author X-ray, with the fairness rules in place |
| 3 | Institution and department pages, including department parsing |
| 4 | Aggregates, map and dashboards |
| 5 | PubPeer, error reporting, deploy (for example at `/beta`) |
