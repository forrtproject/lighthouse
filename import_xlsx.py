"""
Re-import data from FORRT_Lighthouse_Data.xlsx → data/data.json

Usage:
    uv run python import_xlsx.py [path_to_xlsx]
    # or via the project script entry-point:
    uv run import-data [path_to_xlsx]
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.request import urlopen
from datetime import datetime

import pandas as pd

FIELD_MAP = {
    'Social Psychology':'Psychology','Cognitive Psychology':'Psychology',
    'Developmental Psychology':'Psychology','Positive Psychology':'Psychology',
    'Personality Psychology':'Psychology','Differential psychology':'Psychology',
    'Educational Psychology':'Psychology','Judgment and Decision Making':'Behavioral Economics',
    'Marketing':'Behavioral Economics','Neuroscience (humans)':'Neuroscience',
    'Comparative Psychology':'Biology','Evolutionary psychology':'Biology',
    'Evolutionary Linguistics':'Linguistics','Applied Linguistics':'Linguistics',
    'Speech Language Therapy':'Clinical Science','Psychiatry':'Clinical Science',
    'Health Psychology':'Clinical Science','Psychophysiology':'Neuroscience',
    'Behavioural Genetics':'Neuroscience','Political Psychology':'Political Science',
    'Experimental Philosophy':'Philosophy',
}

RETRACTIONS_CSV_URL = (
    "https://gitlab.com/crossref/retraction-watch-data/-/raw/main/"
    "retraction_watch.csv?ref_type=heads&inline=false"
)

def make_id(name):
    return re.sub(r'[^a-z0-9_]', '_', str(name).lower().strip())[:60].strip('_')

def norm_status(s):
    if pd.isna(s): return 'unknown'
    s = str(s).strip().lower()
    if 'not replicated' in s or 'retracted' in s: return 'not_replicated'
    if 'reversed' in s: return 'reversed'
    if 'mixed' in s: return 'mixed'
    if s.startswith('replicated'): return 'replicated'
    return 'unknown'

def norm_class(c):
    if pd.isna(c): return 'other'
    mapping = {'foundational':'foundational','critique':'critique',
               'meta_analysis':'meta_analysis','meta analysis':'meta_analysis',
               'replication':'replication','reproduction':'reproduction'}
    return mapping.get(str(c).strip().lower(), str(c).strip().lower())

def format_retraction_date(value: object) -> str | None:
    raw = clean_optional(value)
    if raw is None:
        return None

    # Handle common Retraction Watch / CSV date formats
    for fmt in ("%m/%d/%Y %H:%M", "%m/%d/%Y %H:%M:%S", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(raw, fmt)
            return f"{dt.day} {dt.strftime('%B %Y')}"
        except ValueError:
            pass

    # Fallback: let pandas try parsing it
    dt = pd.to_datetime(raw, errors="coerce")
    if pd.isna(dt):
        return raw

    return f"{dt.day} {dt.strftime('%B %Y')}"

def download_retractions_csv(url: str, dest_path: Path) -> Path:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url, timeout=30) as resp:
        data = resp.read()
    dest_path.write_bytes(data)
    return dest_path

def normalize_doi(value: object) -> str:
    if pd.isna(value):
        return ""
    doi = str(value).strip().lower()
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi)
    return doi

def clean_optional(value: object) -> str | None:
    if pd.isna(value):
        return None
    s = str(value).strip()
    if not s or s.lower() in {"unavailable", "nan", "none", "0"}:
        return None
    return s

def load_retractions_index(csv_path: Path) -> dict[str, dict]:
    df = pd.read_csv(csv_path, dtype=str, keep_default_na=True)

    expected = {
        "OriginalPaperDOI",
        "RetractionDOI",
        "RetractionDate",
        "RetractionPubMedID",
    }
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in retractions CSV: {sorted(missing)}")

    idx: dict[str, dict] = {}
    for _, row in df.iterrows():
        original_doi = normalize_doi(row.get("OriginalPaperDOI"))
        if not original_doi:
            continue

        # Keep first record per DOI (or adjust policy if you prefer latest date)
        if original_doi not in idx:
            idx[original_doi] = {
                "retracted": True,
                "retraction_doi": clean_optional(row.get("RetractionDOI")),
                "retraction_date": format_retraction_date(row.get("RetractionDate")),
                "retraction_pubmed_id": clean_optional(row.get("RetractionPubMedID")),
            }

    return idx

def run(xlsx_path: str, retractions_csv_path: str = "data/retractions.csv"):
    csv_path = download_retractions_csv(RETRACTIONS_CSV_URL, Path(retractions_csv_path))
    retractions_index = load_retractions_index(csv_path)
    xl = pd.ExcelFile(xlsx_path)
    effects_df = pd.read_excel(xl, 'effects_review')
    papers_df  = pd.read_excel(xl, 'papers_review')
    effects_wikipaedia_df = pd.read_excel(xl, 'effects_wikipedia')

    effects = []
    for _, row in effects_df.iterrows():
        name = str(row['effect_name']).strip()
        disc = str(row.get('discipline', row.get('sub_discipline',''))).strip()
        sub  = str(row.get('sub_discipline', disc)).strip()
        desc = str(row.get('description', row.get('cleaned_description',''))).strip()
        if not desc or desc == 'nan': desc = ''
        effects.append({
            'id': make_id(name), 'name': name,
            'discipline': disc, 'sub_discipline': sub,
            'field': FIELD_MAP.get(disc, row.get('field','Other')),
            'description': desc,
            'status': norm_status(row.get('current_status_normalised') or row.get('current_status')),
        })
    print(f"Parsed {len(effects)} effects from {xlsx_path}")

    papers = []
    for _, row in papers_df.iterrows():
        en = str(row['effect_name']).strip() if pd.notna(row.get('effect_name')) else ''
        doi = str(row.get('doi','')).strip() if pd.notna(row.get('doi')) else ''
        doi_norm = normalize_doi(doi)
        retraction_meta = retractions_index.get(
            doi_norm,
            {
                "retracted": False,
                "retraction_doi": None,
                "retraction_date": None,
                "retraction_pubmed_id": None,
            },
        )

        papers.append({
            'effect_name': en, 'effect_id': make_id(en),
            'title': str(row.get('title','')).strip() if pd.notna(row.get('title')) else '',
            'doi':   doi,
            'year':  int(row['year']) if pd.notna(row.get('year')) else None,
            'apa':   str(row.get('apa_reference','')).strip() if pd.notna(row.get('apa_reference')) else '',
            'classification': norm_class(row.get('current_classification')),
            'summary': str(row.get('summary','')).strip() if pd.notna(row.get('summary')) else '',
            "retracted": retraction_meta["retracted"],
            "retraction_doi": retraction_meta["retraction_doi"],
            "retraction_date": retraction_meta["retraction_date"],
            "retraction_pubmed_id": retraction_meta["retraction_pubmed_id"],
            "type": "paper",
        })
    print(f"Parsed {len(papers)} papers from {xlsx_path} with retraction metadata from {csv_path}")

    wikis = []
    for _, row in effects_wikipaedia_df.iterrows():
        name = str(row['effect_name']).strip()
        wikis.append({
            'effect_id': make_id(name),
            'name': name,
            'title': str(row.get('wiki_title','')).strip() if pd.notna(row.get('wiki_title')) else '',
            'snippet': str(row.get('wiki_snippet','')).strip() if pd.notna(row.get('wiki_snippet')) else '',
            'year': int(row['year']) if pd.notna(row.get('year')) else None,
            'validation': str(row.get('validation','')).strip() if pd.notna(row.get('validation')) else '',
            'url': str(row.get('wiki_url','')).strip() if pd.notna(row.get('wiki_url')) else '',
            "type": "wiki",
        })
    print(f"Parsed {len(wikis)} Wikipedia entries from {xlsx_path}")

    out = Path(__file__).parent / 'data' / 'data.json'
    out.parent.mkdir(exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'effects': effects, 'papers': papers, 'wikis': wikis}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(effects)} effects, {len(papers)} papers, and {len(wikis)} Wikipedia entries to {out}")

def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Import FORRT Lighthouse data from xlsx")
    parser.add_argument(
        "xlsx",
        nargs="?",
        default="FORRT_Lighthouse_Data.xlsx",
        help="Path to the Excel workbook (default: FORRT_Lighthouse_Data.xlsx)",
    )
    parser.add_argument(
        "--retractions-csv",
        default="data/retraction_watch.csv",
        help="Local cache path for downloaded Retraction Watch CSV",
    )
    args = parser.parse_args(argv)
    run(args.xlsx, args.retractions_csv)


if __name__ == "__main__":
    main()
