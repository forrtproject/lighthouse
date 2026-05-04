# FORRT Lighthouse

Interactive network explorer for replication and open science evidence.

## Setup with uv

```bash
# Install uv if you don't have it
curl -Lsf https://astral.sh/uv/install.sh | sh

# Clone / enter the project folder
cd forrt_lighthouse

# Create venv and install dependencies
uv sync

# Run the development server
uv run flask --app app run --debug --port 5000
```

Then open http://localhost:5000

## Deploy to GitHub Pages (static export)

For a fully static version (no Flask), run:

```bash
uv run python export_static.py
```

This produces a `docs/` folder you can push directly to GitHub Pages.

## Data format

| Sheet | Purpose |
|-------|---------|
| `fields_disciplines` | Maps academic fields → disciplines |
| `effects_review` | One row per effect/phenomenon |
| `papers_review` | One row per paper linked to an effect |
| `status_legend` | Color and meaning legend |

### Status values (effects_review)
- `replicated` — effect has been successfully replicated
- `not_replicated` — failed to replicate or retracted
- `mixed` — inconsistent results across studies
- `reversed` — replicated but in opposite direction
- `unknown` — not yet determined

### Classification values (papers_review)
- `foundational` — original study
- `critique` — replication or critical evaluation
- `meta_analysis` — systematic review
- `replication` — pre-registered replication
- `reproduction` — computational reproduction

## Updating data

Edit `FORRT_Lighthouse_Data.xlsx` and run:

```bash
uv run python import_xlsx.py FORRT_Lighthouse_Data.xlsx
```

This regenerates `data/data.json` which the app reads at startup.
