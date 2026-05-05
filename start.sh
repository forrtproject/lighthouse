#!/bin/sh
set -e
echo "Running data import..."
python import_xlsx.py FORRT_Lighthouse_Data.xlsx --retractions-csv data/retraction_watch.csv
echo "Starting server..."
exec gunicorn app:app --bind "0.0.0.0:${PORT:-10000}" --workers 2