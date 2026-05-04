# FORRT Lighthouse

Interactive network explorer for replication and open science evidence.

## Setup with uv

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

## Production

```bash
uv run gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 4
```

## Updating data

Edit `FORRT_Lighthouse_Data.xlsx` and run:

```bash
uv run python import_xlsx.py
# or with an explicit path:
uv run python import_xlsx.py path/to/FORRT_Lighthouse_Data.xlsx
```

This regenerates `data/data.json` which the app reads at startup.
