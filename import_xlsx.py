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
import sys
from pathlib import Path

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

def run(xlsx_path):
    xl = pd.ExcelFile(xlsx_path)
    effects_df = pd.read_excel(xl, 'effects_review')
    papers_df  = pd.read_excel(xl, 'papers_review')

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

    papers = []
    for _, row in papers_df.iterrows():
        en = str(row['effect_name']).strip() if pd.notna(row.get('effect_name')) else ''
        papers.append({
            'effect_name': en, 'effect_id': make_id(en),
            'title': str(row.get('title','')).strip() if pd.notna(row.get('title')) else '',
            'doi':   str(row.get('doi','')).strip()   if pd.notna(row.get('doi'))   else '',
            'year':  int(row['year']) if pd.notna(row.get('year')) else None,
            'apa':   str(row.get('apa_reference','')).strip() if pd.notna(row.get('apa_reference')) else '',
            'classification': norm_class(row.get('current_classification')),
            'summary': str(row.get('summary','')).strip() if pd.notna(row.get('summary')) else '',
        })

    out = Path(__file__).parent / 'data' / 'data.json'
    out.parent.mkdir(exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'effects': effects, 'papers': papers}, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(effects)} effects and {len(papers)} papers to {out}")

def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Import FORRT Lighthouse data from xlsx")
    parser.add_argument(
        "xlsx",
        nargs="?",
        default="FORRT_Lighthouse_Data.xlsx",
        help="Path to the Excel workbook (default: FORRT_Lighthouse_Data.xlsx)",
    )
    args = parser.parse_args(argv)
    run(args.xlsx)


if __name__ == "__main__":
    main()
