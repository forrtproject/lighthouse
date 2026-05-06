# FORRT Lighthouse

Interactive network explorer for replication and open science evidence.

## Local setup with uv

```bash
# Install uv if you don't have it
curl -Lsf https://astral.sh/uv/install.sh | sh

# Clone / enter the project folder
cd lighthouse

# Create venv and install dependencies
uv sync

# Run the development server
uv run flask --app app run --port 8080
```

Then open http://localhost:8080

> **macOS note:** port 5000 is occupied by AirPlay Receiver — use 8080 or any other free port.

## Project structure

```
lighthouse/
├── app.py                  # Flask server and API endpoints
├── import_xlsx.py          # Script to convert Excel data → data/data.json
├── data/
│   └── data.json           # Data read by the app at startup (generated, don't edit manually)
├── content/
│   └── about.md            # Content of the About page (edit this to update it)
├── templates/
│   ├── index.html          # Main app shell
│   └── about.html          # About page wrapper (layout only)
├── static/
│   ├── css/
│   │   ├── style.css       # All app styles
│   │   └── about.css       # Styles specific to the About page
│   └── js/
│       └── app.js          # All frontend logic (visualization, navigation, search)
└── FORRT_Lighthouse_Data.xlsx  # Source data (edit this, then run import_xlsx.py)
```

## How data flows

1. We are currently using a local copy of the data stored in:  **`FORRT_Lighthouse_Data.xlsx`**, with three main sheets:
   - `effects_review` — one row per effect/phenomenon
   - `papers_review` — one row per paper linked to an effect
   - `effects_wikipedia` — Wikipedia entries linked to effects (entries marked as `non-related` in the `validation` column are excluded from the app)
2. Running `import_xlsx.py` converts the Excel into **`data/data.json`**
3. The Flask app loads `data.json` once at startup into memory
4. The frontend fetches data through the API as the user navigates

**In the near future we will start reading directly from Google Sheets**

## Updating data

Edit `FORRT_Lighthouse_Data.xlsx` and run:

```bash
uv run python import_xlsx.py
# or with an explicit path:
uv run python import_xlsx.py path/to/FORRT_Lighthouse_Data.xlsx
```

This regenerates `data/data.json`. Restart the server to pick up the changes.

### Key columns in effects_review

| Column | Description |
|--------|-------------|
| `effect_name` | Name of the effect |
| `field` | Broad academic field |
| `subfield` | Academic sub-field |
| `cluster_a`, `cluster_b`, `cluster_c` | Thematic groupings used for sub-navigation within a discipline |
| `description` | Plain-text description |

### Key columns in papers_review

| Column | Description |
|--------|-------------|
| `effect_name` | Links the paper to an effect |
| `title` | Paper title |
| `doi` | DOI |
| `year` | Publication year |
| `apa_reference` | APA citation |
| `current_classification` | Paper type (`foundational`, `critique`, `meta_analysis`, `replication`, `reproduction`) |
| `summary` | Plain-text summary |

### Key columns in effects_wikipedia

| Column | Description |
|--------|-------------|
| `effect_name` | Links the entry to an effect |
| `wiki_title` | Title of the Wikipedia article |
| `validation` | Relevance check — entries marked `non-related` are excluded from the app |
| `wiki_url` | URL of the Wikipedia article |
| `year` | Year the article was last reviewed |

## Editing the About page

The About page content lives in **`content/about.md`** — edit that file directly using Markdown. The app converts it to HTML automatically on each request; no restart needed.

## Production

The app is configured for deployment on [Render](https://render.com) via `render.yaml`. Each push to `main` triggers an automatic redeploy.

To run in production manually:

```bash
uv run gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 4
```

## Previous work

A previous iteration of this project is available [on this repository](https://github.com/forrtproject/lighthouse-v1).