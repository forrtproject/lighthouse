"""
Re-import data from FORRT_Lighthouse_Data.xlsx → data/data.json

Usage:
    uv run python import_xlsx.py [path_to_xlsx]
    # or via the project script entry-point:
    uv run import-data [path_to_xlsx]
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import time
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

def clean_text(value: object) -> str:
    """Normalise a spreadsheet string.

    - Repairs mojibake where UTF-8 was decoded as Latin-1/cp1252
      (e.g. "womenâ\x80\x99s" -> "women’s"). Without this, effect names in one
      sheet do not match the same names in the other sheets.
    - Decodes HTML entities ("&amp;" -> "&").
    - Drops zero-width characters and surrounding whitespace.
    """
    s = str(value)
    for codec in ("latin-1", "cp1252"):
        try:
            repaired = s.encode(codec).decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            continue
        if repaired != s:
            s = repaired
            break
    # Some cells were pasted from HTML and hold entities such as "&amp;".
    # The app escapes text itself, so store the plain character.
    s = html.unescape(s)
    return re.sub(r"[\u200b\u200c\u200d\ufeff]", "", s).strip()


RETRACTION_COLUMNS = [
    "OriginalPaperDOI",
    "RetractionDOI",
    "RetractionDate",
    "RetractionPubMedID",
    "RetractionNature",
]
RETRACTIONS_MAX_AGE_DAYS = 7
DEFAULT_RETRACTIONS_CSV = "data/retraction_watch.csv"
# Placeholders used in both sources where no DOI exists; never match on these.
NON_DOI_VALUES = {"", "unavailable", "not available", "nan", "none", "n/a", "0"}

def make_id(name):
    # No length cap: truncating made distinct long effect names share one id.
    slug = re.sub(r'[^a-z0-9]+', '_', clean_text(name).lower())
    return slug.strip('_')

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

def download_retractions_csv(
    url: str,
    dest_path: Path,
    max_age_days: float = RETRACTIONS_MAX_AGE_DAYS,
    force: bool = False,
) -> Path:
    """Make sure a recent, slimmed-down copy of the Retraction Watch CSV exists.

    The upstream file is ~65 MB with 20 columns; we need five. The cached copy
    keeps only those (~5 MB) and is reused until it is older than
    ``max_age_days``. If a refresh fails, a stale cache is used with a warning;
    with no cache at all the error propagates so a build fails loudly rather
    than publishing data without retraction flags.
    """
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists() and not force:
        age_days = (time.time() - dest_path.stat().st_mtime) / 86400
        if age_days < max_age_days:
            print(f"Using cached Retraction Watch data ({age_days:.1f} days old): {dest_path}")
            return dest_path

    tmp_raw = dest_path.with_name(dest_path.name + ".download")
    tmp_slim = dest_path.with_name(dest_path.name + ".tmp")
    try:
        print("Downloading Retraction Watch data...")
        with urlopen(url, timeout=60) as resp, open(tmp_raw, "wb") as fh:
            shutil.copyfileobj(resp, fh)
        slim = pd.read_csv(tmp_raw, dtype=str, usecols=lambda c: c in RETRACTION_COLUMNS)
        missing = set(RETRACTION_COLUMNS) - set(slim.columns)
        if missing:
            raise ValueError(f"Missing required columns in retractions CSV: {sorted(missing)}")
        slim.to_csv(tmp_slim, index=False)
        os.replace(tmp_slim, dest_path)  # atomic: never leaves a half-written cache
    except (OSError, ValueError, pd.errors.ParserError) as exc:
        if not dest_path.exists():
            raise
        print(f"WARNING: could not refresh Retraction Watch data ({exc}); using stale cache {dest_path}")
    finally:
        tmp_raw.unlink(missing_ok=True)
        tmp_slim.unlink(missing_ok=True)
    return dest_path

def normalize_doi(value: object) -> str:
    if pd.isna(value):
        return ""
    doi = str(value).strip().lower()
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi)
    return "" if doi in NON_DOI_VALUES else doi

def clean_optional(value: object) -> str | None:
    if pd.isna(value):
        return None
    s = str(value).strip()
    if not s or s.lower() in {"unavailable", "nan", "none", "0"}:
        return None
    return s

def load_retractions_index(csv_path: Path, wanted_dois: set[str] | None = None) -> dict[str, dict]:
    """Index retractions by normalised original-paper DOI.

    ``wanted_dois`` limits the index to the DOIs we actually cite, so only a
    handful of rows need per-row work instead of all ~70k.
    """
    df = pd.read_csv(csv_path, dtype=str, usecols=lambda c: c in RETRACTION_COLUMNS)
    missing = set(RETRACTION_COLUMNS) - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in retractions CSV: {sorted(missing)}")

    df["_doi"] = (
        df["OriginalPaperDOI"].fillna("").str.strip().str.lower()
        .str.replace(r"^https?://(dx\.)?doi\.org/", "", regex=True)
    )
    df = df[~df["_doi"].isin(NON_DOI_VALUES)]
    if wanted_dois is not None:
        df = df[df["_doi"].isin(wanted_dois)]

    # The dataset also lists corrections, expressions of concern and
    # reinstatements. Only a retraction that was not later reinstated counts.
    nature = df["RetractionNature"].fillna("").str.strip().str.lower()
    reinstated = set(df.loc[nature == "reinstatement", "_doi"])
    df = df[(nature == "retraction") & ~df["_doi"].isin(reinstated)]

    # Keep the first record per DOI
    df = df.drop_duplicates("_doi", keep="first")
    return {
        row["_doi"]: {
            "retracted": True,
            "retraction_doi": clean_optional(row["RetractionDOI"]),
            "retraction_date": format_retraction_date(row["RetractionDate"]),
            "retraction_pubmed_id": clean_optional(row["RetractionPubMedID"]),
        }
        for _, row in df.iterrows()
    }

def run(
    xlsx_path: str,
    retractions_csv_path: str = DEFAULT_RETRACTIONS_CSV,
    max_age_days: float = RETRACTIONS_MAX_AGE_DAYS,
    refresh_retractions: bool = False,
):
    csv_path = download_retractions_csv(
        RETRACTIONS_CSV_URL, Path(retractions_csv_path),
        max_age_days=max_age_days, force=refresh_retractions,
    )
    xl = pd.ExcelFile(xlsx_path)
    effects_df = pd.read_excel(xl, 'effects_review')
    papers_df  = pd.read_excel(xl, 'papers_review')
    cited_dois = {normalize_doi(d) for d in papers_df.get('doi', [])} - {""}
    retractions_index = load_retractions_index(csv_path, cited_dois)
    effects_wikipaedia_df = pd.read_excel(xl, 'effects_wikipedia')

    effects = []
    for _, row in effects_df.iterrows():
        name = clean_text(row['effect_name'])
        disc = str(row.get('discipline', row.get('sub_discipline',''))).strip()
        sub  = str(row.get('sub_discipline', disc)).strip()
        desc = clean_text(row.get('description', row.get('cleaned_description','')))
        if not desc or desc == 'nan': desc = ''
        
        # Extract clusters from cluster_a, cluster_b, cluster_c columns
        clusters = []
        for col in ['cluster_a', 'cluster_b', 'cluster_c']:
            cluster_val = clean_optional(row.get(col))
            if cluster_val:
                clusters.append(cluster_val)
        
        effects.append({
            'id': make_id(name), 'name': name,
            'discipline': disc, 'sub_discipline': sub,
            'field': FIELD_MAP.get(disc, row.get('field','Other')),
            'description': desc,
            'status': norm_status(row.get('current_status_normalised') or row.get('current_status')),
            'clusters': clusters,
        })
    print(f"Parsed {len(effects)} effects from {xlsx_path}")

    papers = []
    for _, row in papers_df.iterrows():
        en = clean_text(row['effect_name']) if pd.notna(row.get('effect_name')) else ''
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
            'title': clean_text(row.get('title','')) if pd.notna(row.get('title')) else '',
            'doi':   doi,
            'year':  int(row['year']) if pd.notna(row.get('year')) else None,
            'apa':   clean_text(row.get('apa_reference','')) if pd.notna(row.get('apa_reference')) else '',
            'classification': norm_class(row.get('current_classification')),
            'summary': clean_text(row.get('summary','')) if pd.notna(row.get('summary')) else '',
            "retracted": retraction_meta["retracted"],
            "retraction_doi": retraction_meta["retraction_doi"],
            "retraction_date": retraction_meta["retraction_date"],
            "retraction_pubmed_id": retraction_meta["retraction_pubmed_id"],
            "type": "paper",
        })
    print(f"Parsed {len(papers)} papers from {xlsx_path} with retraction metadata from {csv_path}")

    wikis = []
    for _, row in effects_wikipaedia_df.iterrows():
        name = clean_text(row['effect_name'])
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
        default=DEFAULT_RETRACTIONS_CSV,
        help="Local cache path for the slimmed-down Retraction Watch CSV",
    )
    parser.add_argument(
        "--retractions-max-age-days",
        type=float,
        default=RETRACTIONS_MAX_AGE_DAYS,
        help=f"Re-download the Retraction Watch data once the cache is older than this (default: {RETRACTIONS_MAX_AGE_DAYS})",
    )
    parser.add_argument(
        "--refresh-retractions",
        action="store_true",
        help="Ignore the cache and download the Retraction Watch data now",
    )
    args = parser.parse_args(argv)
    run(args.xlsx, args.retractions_csv, args.retractions_max_age_days, args.refresh_retractions)


if __name__ == "__main__":
    main()
