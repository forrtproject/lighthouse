# Lighthouse: functionality inventory

This is the list of everything the site does today. A redesign may change how any of
it looks or where it sits on the page. It must not remove or break any of it. Tick each
item off against the redesigned build before merging.

Sources: `templates/index.html`, `templates/about.html`, `static/js/app.js`, `app.py`.

## Redesign check (FLoRA Replication Atlas theme)

The site was restyled to match the visual language of the
[FLoRA Replication Atlas](https://forrt.org/flora-replication-atlas/). It uses the FORRT
design tokens (`static/css/tokens.css`) and the self-hosted Domine and Source Sans 3
fonts (`static/fonts/`), both copied from `flora-explorer`.

**What changed in the layout:**

- **Charcoal top bar.** It holds the brand, the search, the navigation and the theme
  toggle.
- **White context bar.** It holds Back, the breadcrumb and the legend.
- **Map cards.** The map sits on a grey dotted surface. Its nodes are white cards with a
  coloured category rail.
- **"You are here" in maroon.** The current anchor (the level you are in) and the hub
  are maroon.
- **Edges.**
  - The edges are smooth curves.
  - A multi-column grid gets a dashed group frame, and the curves only fan into the
    first column, so no lines cross the gaps between columns.
- **Evidence panel.** It is styled like the Atlas detail card. Effect and paper titles
  use the Domine serif, and DOIs use a monospace font.
- **Footer.** A dark footer was added.

**Additions:** none of these change behaviour.

- Map nodes and breadcrumb crumbs can be reached with Tab and opened with Enter or
  Space.
- There is a skip link.
- Evidence-type colours are CSS variables, so they stay readable in dark mode.
- The tour highlight now sits above the dimmed backdrop. Before, the bar's stacking
  context hid it.

**Checked in a browser** (1440×900 and 390×844, light and dark):

- **Map**:
  - level 0 → 1 → 2 → 3
  - Back
  - breadcrumb jumps
  - Back hidden at the top level
- **Evidence panel**:
  - opens, closes with Escape, and relays out the map beside it
  - the selected outline
  - the retraction footer (`signing_at_the_top_and_dishonesty`)
  - the Suggest link
  - the last of several fast clicks wins
- **Search**:
  - tag chip opens its cluster
  - effect result opens its cluster and the panel
  - the input clears afterwards
- **Theme toggle**: recolours the live map without a redraw.
- **Tour**:
  - Tour button
  - step 3 highlight
  - Escape skips
- **About page**:
  - `/about#suggest-a-new-item` scrolls to the section
  - shared theme
- **Phone width**:
  - no horizontal scroll
  - full-width panel
  - zig-zag disciplines clear of the anchor
- **Console**: no JS errors.

**Not checked by hand yet:**

- the first-visit automatic tour
- touch taps compared with dragging on a real device
- the 600–1000 px tablet range
- the API error and "No results" messages
- Enter opening the first search result
- closing search results with a click outside the search

## 1. Pages and routes

- [ ] `/` serves the landing page (`templates/landing.html`, `static/js/landing.js`).
      It has:
  - a search hero
  - field and discipline cards
  - featured effects
  - "how it works"
  - the data sources
  It links into the map through deep links.
- [ ] `/explore` serves the explorer (`templates/index.html`). It was served at `/`
      before the landing page was added.
- [ ] **Explorer deep links**: `/explore?field=…&discipline=…&cluster=…&effect=…` opens
      that view, and the effect's panel if one is given.
  - The URL follows the map through `history.replaceState`, so no history entries are
    added.
- [ ] The landing page uses `GET /api/overview`, which returns `totals`, `fields`
      (each with its disciplines and counts) and `featured` (the effects with the widest
      mix of evidence kinds).
- [ ] `/about` renders `content/about.md` as HTML with heading anchors (`toc` extension),
      so that `/about#suggest-a-new-item` scrolls to the "Suggest a new item" section.
- [ ] The API endpoints the frontend uses must not change:
  - `GET /api/fields` returns `{ field: [disciplines…] }`
  - `GET /api/disciplines` returns `[{ name, field, … }]`
  - `GET /api/clusters/<disc>` returns `[{ name, discipline }]`
  - `GET /api/effects?cluster=…` returns `[{ id, name, discipline, sub_discipline, status }]`
  - `GET /api/effect/<id>` returns the effect plus `papers_and_wikis` and `foundational_retraction`
  - `GET /api/search?q=…` returns `{ effects: [...], clusters: [...] }`, with an empty
    result for queries shorter than 2 characters
- [ ] `/api/sub_disciplines/<disc>` exists but the frontend doesn't use it. Leave it alone.

## 2. Global header (both pages)

- [ ] The logo and "Lighthouse" wordmark link to `/`. The logo is inverted in light mode.
- [ ] Home link (`/`) and About link (`/about`).
- [ ] Theme toggle:
  - It switches between light and dark.
  - The choice is saved to `localStorage.theme`.
  - With no saved choice, it follows `prefers-color-scheme`.
  - The sun or moon icon shows the current state.
  - On the explorer, toggling also recolours the node fills and labels that are already
    drawn (`draw()`).
- [ ] Explorer only: a Tour button that restarts the onboarding tour.
- [ ] Explorer only: a "Work in progress, data not fully validated" warning badge.
- [ ] Explorer only: a Back button, shown only below the top level. It goes up one level.

## 3. Navigation model (explorer)

The explorer is a drill-down with four levels, held in `state`:

| Level | Shows | Click target leads to |
|---|---|---|
| 0 | All fields arranged around an "All Disciplines" hub | field, which goes to level 1 |
| 1 | The disciplines in the chosen field, with the field anchor on the left | discipline, which goes to level 2 |
| 2 | The clusters (tags) in the chosen discipline, with the discipline anchor | cluster, which goes to level 3 |
| 3 | The effects in the chosen cluster, with the cluster anchor | effect, which opens the evidence panel |

- [ ] **Breadcrumb**: All fields › field › discipline › cluster. Every crumb except the
      last can be clicked and jumps to that level. The last crumb is shown as active.
- [ ] **Anchor nodes**: the left-hand node at levels 1–3 (and the hub at level 0) can be
      clicked to go up a level (the hub resets to level 0).
- [ ] **`jumpTo(level)`**: if the target level has no state (for example, the user
      arrived from search without a field), keep going up instead of hitting a dead end.
- [ ] Changing level closes the evidence panel.
- [ ] **Hint line** at the bottom of the map. Its text depends on context:
  - level 0: "Click a field to explore disciplines"
  - level 1: "Click a discipline"
  - level 2: "Click a cluster to filter effects"
  - level 3: "Click an effect to see evidence", plus "· scroll for more" when the list
    overflows
  - an empty cluster: "No effects found for this discipline"
  - when loading fails: "Could not load data. Check your connection and try again."
- [ ] **Colours**:
  - Each field, discipline and cluster name gets a stable colour from `DISC_COLORS`, in
    the order it first appears.
  - Effects use the colour of their discipline.
  - The hub is `#22ABA6`.
- [ ] **Render race safety**: every render gets a sequence number. A stale render
      (the user clicked again before the data arrived) must never draw on the map.
- [ ] **Animation**:
  - Child nodes spawn from the anchor, moving and scaling in.
  - Edges fade in from the anchor to each child.
  - The spawn delays are staggered so the last node appears within about 600 ms
    whatever the count.

## 4. Layout rules (explorer map)

- [ ] **Level 0**:
  - The fields are arranged in a ring around the hub.
  - On portrait phones (width under 600 px and narrower than tall) the ring is
    stretched vertically and the nodes shrink.
- [ ] **Level 1**:
  - The disciplines are arranged in a zig-zag column.
  - The map scrolls vertically if they don't fit.
- [ ] **Level 2**:
  - The clusters are arranged in a grid of columns.
  - Font size, wrap width and node size shrink once there are more than 12 clusters,
    and again above 20.
  - The map scrolls vertically if they don't fit.
- [ ] **Level 3**:
  - The effects are fixed-size boxes in a grid.
  - The layout uses extra columns before it resorts to scrolling.
  - Boxes grow into spare column width, up to 300 px.
  - A long name is cut with "…", and the full name shows as a hover tooltip
    (`<title>`).
- [ ] **Scrolling**:
  - The map scrolls vertically when its content is taller than the screen.
  - A bottom fade (`.more-below`) shows while more content sits below the fold.
  - Every render resets the scroll position to the top.
- [ ] **Space for the evidence panel**:
  - While the panel is open, levels 2–3 are laid out in the space beside it.
  - This only applies if at least 260 px of map width is left (`mapRightEdge`).
    Otherwise the map keeps its full width underneath the panel.
- [ ] **Relayout when the panel opens or closes**:
  - At level 3, the effects are laid out again.
  - The scroll position is restored so that the selected effect stays in view.
- [ ] **Resize**: on window resize, the map is laid out again after a 150 ms debounce.
- [ ] **Touch**: a tap opens a node only if the finger moved 10 px or less, so dragging
      to scroll doesn't open the node the finger started on.

## 5. Evidence panel (effect detail)

- [ ] **Opening and closing**:
  - The panel slides in from the right.
  - It is full width at 600 px wide or less.
  - It closes with the × button or Escape.
- [ ] **Selected effect**: its node gets a high-contrast outline and a bold label
      (`.lh-selected`). Only one effect is selected at a time.
- [ ] **Header**: the effect name and its description. A long description scrolls
      inside the header.
- [ ] **Timeline**:
  - It lists the papers and Wikipedia entries together, oldest first.
  - Entries with no year sort first on the client (`-Infinity`); the server sorts them
    last. Keep this as it is unless it is fixed on purpose.
  - The rows are joined by a dashed vertical spine.
  - The rows animate in with a stagger.
- [ ] **Paper row**:
  - The year and the classification (type) label, both in the type colour.
  - A marker shape for the type (■ ● ■ ◆ ▲ ○).
  - The title, or "Untitled" if there is none.
  - A "Retracted" badge if the paper is retracted.
  - The APA citation, cut at 120 characters. It is hidden when it is the same as the
    DOI or is `nan`.
  - The summary.
  - A DOI link. The DOI is cleaned, and an invalid DOI is hidden.
  - Types: foundational, critique, meta_analysis, replication, reproduction, other.
- [ ] **Wikipedia row**:
  - The year (from `year` or `wiki_year`), a "W" marker and the "Wikipedia" label.
  - The title.
  - A link, but only if the URL is http(s). The link text reads
    "Featured in: <title>" when `validation` contains "more general".
- [ ] **Empty state**: "No papers on record for this effect."
- [ ] **Foundational retraction footer**, shown when `foundational_retraction.retracted`
      is true:
  - the retraction date
  - the original DOI link
  - the retraction DOI link
  - a PubMed link, shown only if the ID is numeric
- [ ] **Footer link**: "Suggest a new item", which goes to `/about#suggest-a-new-item`.
- [ ] **Race safety**: when the user clicks effects quickly, only the last click fills
      the panel.
- [ ] **Load failure**: if the effect can't be loaded, the hint line shows the load
      error and the panel doesn't change.

## 6. Search

- [ ] A search input labelled "Search effects and tags…". It has no browser
      autocomplete.
- [ ] **Querying**:
  - Search starts at 2 characters, with a 250 ms debounce.
  - Stale responses are dropped.
- [ ] **Results dropdown**:
  - **Tags** (clusters) are shown as chips: name - discipline. Each chip is tinted with
    a colour that is a hash of the tag name.
  - **Effects** are listed with the name and the discipline.
  - The two sections are separated by a divider.
- [ ] **Clicking a tag**:
  - It sets the field, discipline and cluster, then opens level 3 for that cluster.
  - It clears the input and closes the results.
- [ ] **Clicking an effect**:
  - The map moves to the effect's first cluster, unless that cluster is already
    showing.
  - The effect's evidence panel opens.
  - The input is cleared and the results close.
- [ ] **Keyboard and outside clicks**:
  - Enter opens the first result.
  - A click outside the search closes the results.
- [ ] **Messages**:
  - "No results" when nothing matches.
  - "Search is unavailable right now" when the request fails.
- [ ] **Mobile**: the input is 16 px or larger so that iOS doesn't zoom in on focus.

## 7. Keyboard

- [ ] **Escape** closes the topmost open thing, in this order:
  1. the tour
  2. the search results (and takes focus out of the input)
  3. the evidence panel (which relays out the effects at level 3)

## 8. Onboarding tour

- [ ] It runs automatically once, 700 ms after load. Afterwards the key
      `localStorage['lighthouse.onboarding.v1']` stops it running again.
- [ ] The Tour button restarts it.
- [ ] It has five steps, and each step highlights its target element:
  1. logo (`#logo-wrap`)
  2. Home link (`#home-link`)
  3. search (`#search-wrap`)
  4. map (`#stage`)
  5. theme toggle (`#theme-toggle`)
- [ ] **The tour depends on these selectors.** If an element is renamed, update
      `TOUR_STEPS` to match.
- [ ] **Controls**:
  - Skip, Back (hidden on the first step), and Next (reads "Finish" on the last step).
  - "Step n of 5".
  - Escape skips the tour.
  - Skipping and finishing both mark the tour as seen.
- [ ] **Placement**: the card sits below its target, flips above when there isn't room,
      stays inside the viewport, and is placed again on window resize.
- [ ] **Backdrop**: the page is dimmed and the target element is raised above the dim.

## 9. Legend

- [ ] The evidence types shown: Foundational, Critique, Meta-analysis, Replication and
      Wikipedia article, each with its colour and shape.
- [ ] The Status group (Replicated, Not replicated and so on) is commented out in the
      HTML and the status ring is commented out in the JS. Both stay disabled; keep
      them available to switch back on.

## 10. About page

- [ ] Shares the header with the explorer (logo, Home, About, theme toggle).
- [ ] Renders the markdown content in a readable column: headings, links, lists and
      blockquote (the citation).
- [ ] The theme is shared with the explorer through `localStorage`.

## 11. Responsive behaviour

- [ ] **1000 px wide or less**, the header wraps:
  - The wordmark and the Home link are hidden. The logo still links home.
  - The breadcrumb moves onto its own row and scrolls sideways.
  - Search goes full width.
  - The work-in-progress badge goes full width.
  - Search results go full width, with a 60vh maximum height.
- [ ] **600 px wide or less**: the evidence panel is full width.
- [ ] `#app` is a flex column, so the map fills whatever height the header and legend
      leave, using `100dvh`.

## 12. Security and robustness (keep these as they are)

- [ ] All text from the spreadsheet goes through `esc()` before it is put into
      `innerHTML`.
- [ ] DOIs go through `cleanDoi()`. URLs go through `safeUrl()`, which allows http(s)
      only.
- [ ] External links use `target="_blank" rel="noopener"`.
- [ ] A failed API call throws, and the user sees the error message instead of a blank
      map.
