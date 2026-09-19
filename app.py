"""
FORRT Lighthouse — Flask application.

Run in development:
    uv run flask --app app run --port 8080

Run in production:
    uv run gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 4
"""
from __future__ import annotations

import json
import logging
import os
from collections import defaultdict
from pathlib import Path
import markdown

from flask import Blueprint, Flask, jsonify, render_template, request

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent / "data" / "data.json"


# ---------------------------------------------------------------------------
# In-memory store with pre-built indexes
# ---------------------------------------------------------------------------

class DataStore:
    """Loads data.json once and builds O(1) lookup indexes."""

    def __init__(self, path: Path) -> None:
        with open(path, encoding="utf-8") as fh:
            raw = json.load(fh)

        self.effects: list[dict] = raw["effects"]
        self.papers: list[dict] = raw["papers"]

        self._by_id: dict[str, dict] = {e["id"]: e for e in self.effects}
        self._by_disc: dict[str, list[dict]] = defaultdict(list)
        self._by_sub: dict[str, list[dict]] = defaultdict(list)
        self._by_cluster: dict[str, list[dict]] = defaultdict(list)
        self._clusters_by_disc: dict[str, set[str]] = defaultdict(set)
        self._papers_by_effect: dict[str, list[dict]] = defaultdict(list)
        self._wikis_by_effect: dict[str, list[dict]] = defaultdict(list)

        for e in self.effects:
            self._by_disc[e["discipline"]].append(e)
            self._by_sub[e["sub_discipline"]].append(e)
            for cluster in e.get("clusters", []):
                self._by_cluster[cluster].append(e)
                self._clusters_by_disc[e["discipline"]].add(cluster)

        for p in self.papers:
            self._papers_by_effect[p["effect_id"]].append(p)

        for w in raw.get("wikis", []):
            self._wikis_by_effect[w["effect_id"]].append(w)

        self.fields: dict[str, list[str]] = self._build_fields()
        self.disciplines: list[dict] = self._build_disciplines()
        self._field_by_disc: dict[str, str] = {d["name"]: d["field"] for d in self.disciplines}

        logger.info(
            "DataStore loaded: %d effects, %d papers, %d disciplines",
            len(self.effects), len(self.papers), len(self.disciplines),
        )

    def _build_fields(self) -> dict[str, list[str]]:
        seen: dict[str, set[str]] = {}
        for e in self.effects:
            field = e.get("field") or "Other"
            seen.setdefault(field, set()).add(e["discipline"])
        return {k: sorted(v) for k, v in sorted(seen.items())}

    def _build_disciplines(self) -> list[dict]:
        disc_map: dict[str, dict] = {}
        for e in self.effects:
            d = e["discipline"]
            if d not in disc_map:
                disc_map[d] = {
                    "name": d,
                    "field": e.get("field") or "Other",
                    "sub_disciplines": set(),
                }
            disc_map[d]["sub_disciplines"].add(e["sub_discipline"])
        return [
            {**v, "sub_disciplines": sorted(v["sub_disciplines"])}
            for v in disc_map.values()
        ]

    def effects_for(
        self,
        *,
        discipline: str | None = None,
        sub_discipline: str | None = None,
        cluster: str | None = None,
    ) -> list[dict]:
        if cluster:
            return self._by_cluster.get(cluster, [])
        if sub_discipline:
            return self._by_sub.get(sub_discipline, [])
        if discipline:
            return self._by_disc.get(discipline, [])
        return self.effects

    def clusters_for_discipline(self, discipline: str) -> list[str]:
        return sorted(self._clusters_by_disc.get(discipline, set()))

    def effect_by_id(self, effect_id: str) -> dict | None:
        return self._by_id.get(effect_id)

    def papers_for_effect(self, effect_id: str) -> list[dict]:
        return self._papers_by_effect.get(effect_id, [])
    
    def wikis_for_effect(self, effect_id: str) -> list[dict]:
        return self._wikis_by_effect.get(effect_id, [])

    def search(self, query: str, limit: int = 20) -> dict[str, list[dict]]:
        q = query.lower()
        # Rank: name starts with the query, then name contains it, then only
        # the description mentions it. Previously results came in sheet order,
        # so an exact name match could be cut off by the limit.
        ranked: list[tuple[int, str, dict]] = []
        for e in self.effects:
            name = e["name"].lower()
            if name.startswith(q):
                rank = 0
            elif q in name:
                rank = 1
            elif q in (e.get("description") or "").lower():
                rank = 2
            else:
                continue
            ranked.append((rank, name, e))
        ranked.sort(key=lambda t: (t[0], t[1]))
        effect_results = [
            {
                "id": e["id"],
                "name": e["name"],
                "field": e.get("field") or "Other",
                "discipline": e["discipline"],
                "clusters": e.get("clusters", []),
                "status": e["status"],
            }
            for _, _, e in ranked[:limit]
        ]

        cluster_results: list[dict] = []
        for disc, clusters in self._clusters_by_disc.items():
            for cluster in sorted(clusters):
                if q in cluster.lower():
                    count = sum(
                        1
                        for e in self._by_disc.get(disc, [])
                        if cluster in e.get("clusters", [])
                    )
                    cluster_results.append({
                        "name": cluster,
                        "field": self._field_by_disc.get(disc, "Other"),
                        "discipline": disc,
                        "effect_count": count,
                    })

        return {"effects": effect_results, "clusters": cluster_results[:limit]}


# ---------------------------------------------------------------------------
# Blueprint
# ---------------------------------------------------------------------------

api_bp = Blueprint("api", __name__, url_prefix="/api")


def _store() -> DataStore:
    return api_bp.store  # type: ignore[attr-defined]


@api_bp.get("/fields")
def get_fields():
    return jsonify(_store().fields)


@api_bp.get("/disciplines")
def get_disciplines():
    return jsonify(_store().disciplines)


@api_bp.get("/sub_disciplines/<disc>")
def get_sub_disciplines(disc: str):
    subs: dict[str, dict] = {}
    for e in _store().effects_for(discipline=disc):
        s = e["sub_discipline"]
        entry = subs.setdefault(s, {"name": s, "discipline": disc, "effect_count": 0})
        entry["effect_count"] += 1
    return jsonify(list(subs.values()))


@api_bp.get("/clusters/<disc>")
def get_clusters(disc: str):
    clusters = _store().clusters_for_discipline(disc)
    return jsonify([{"name": c, "discipline": disc} for c in clusters])


@api_bp.get("/effects")
def get_effects():
    disc = request.args.get("discipline") or None
    sub = request.args.get("sub_discipline") or None
    cluster = request.args.get("cluster") or None
    effects = _store().effects_for(discipline=disc, sub_discipline=sub, cluster=cluster)
    return jsonify([
        {
            "id": e["id"],
            "name": e["name"],
            "discipline": e["discipline"],
            "sub_discipline": e["sub_discipline"],
            "status": e["status"],
        }
        for e in effects
    ])


@api_bp.get("/effect/<effect_id>")
def get_effect(effect_id: str):
    effect = _store().effect_by_id(effect_id)
    if effect is None:
        return jsonify({"error": "Not found"}), 404

    papers = _store().papers_for_effect(effect_id)
    # Entries a curator marked as unrelated are never sent to the client.
    wikis = [
        w for w in _store().wikis_for_effect(effect_id)
        if (w.get("validation") or "").strip().lower() != "non-related"
    ]

    foundational = [p for p in papers if p.get("classification") == "foundational"]
    retracted = next((p for p in foundational if p.get("retracted")), None) or {}
    foundational_retraction = {
        "retracted": bool(retracted),
        "original_doi": retracted.get("doi") or None,
        "retraction_doi": retracted.get("retraction_doi"),
        "retraction_date": retracted.get("retraction_date"),
        "retraction_pubmed_id": retracted.get("retraction_pubmed_id"),
    }

    # One timeline of papers and Wikipedia entries, oldest first; undated last.
    combined = [{**p, "_type": "paper"} for p in papers] + [{**w, "_type": "wiki"} for w in wikis]
    combined.sort(key=lambda x: (x.get("year") is None, x.get("year") or 0))

    return jsonify({**effect, "papers_and_wikis": combined, "foundational_retraction": foundational_retraction, "wikis": wikis})


@api_bp.get("/search")
def search():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify({"effects": [], "clusters": []})
    return jsonify(_store().search(q))


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app(data_path: Path = DATA_PATH) -> Flask:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    flask_app = Flask(__name__)
    api_bp.store = DataStore(data_path)  # type: ignore[attr-defined]
    flask_app.register_blueprint(api_bp)

    @flask_app.get("/")
    def index():
        return render_template("index.html")

    @flask_app.get("/about")
    def about():
        md_path = Path(__file__).parent / "content" / "about.md"
        html = markdown.markdown(md_path.read_text(encoding="utf-8"), extensions=["extra", "toc"])
        return render_template("about.html", content=html)

    @flask_app.errorhandler(Exception)
    def handle_exception(exc: Exception):
        logger.exception("Unhandled exception: %s", exc)
        code = getattr(exc, "code", 500)
        return jsonify({"error": str(exc)}), code

    return flask_app


# ---------------------------------------------------------------------------
# Module-level app — used by `flask --app app run` and `gunicorn app:app`
# ---------------------------------------------------------------------------

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=port)
