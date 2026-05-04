import json
from pathlib import Path
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_PATH = Path(__file__).parent / "data" / "data.json"

def load_data():
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)

data = load_data()

def _fields():
    seen = {}
    for e in data["effects"]:
        field = e.get("field", "Other")
        disc = e["discipline"]
        if field not in seen:
            seen[field] = set()
        seen[field].add(disc)
    return {k: sorted(v) for k, v in sorted(seen.items())}

def _disciplines():
    disc_map = {}
    for e in data["effects"]:
        d = e["discipline"]
        if d not in disc_map:
            disc_map[d] = {"name": d, "field": e.get("field", "Other"), "sub_disciplines": set()}
        disc_map[d]["sub_disciplines"].add(e["sub_discipline"])
    for d in disc_map:
        disc_map[d]["sub_disciplines"] = sorted(disc_map[d]["sub_disciplines"])
    return disc_map

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/fields")
def api_fields():
    return jsonify(_fields())

@app.route("/api/disciplines")
def api_disciplines():
    return jsonify(list(_disciplines().values()))

@app.route("/api/sub_disciplines/<disc>")
def api_sub_disciplines(disc):
    subs = {}
    for e in data["effects"]:
        if e["discipline"] == disc:
            s = e["sub_discipline"]
            if s not in subs:
                subs[s] = {"name": s, "discipline": disc, "effect_count": 0}
            subs[s]["effect_count"] += 1
    return jsonify(list(subs.values()))

@app.route("/api/effects")
def api_effects():
    disc = request.args.get("discipline")
    sub = request.args.get("sub_discipline")
    results = data["effects"]
    if disc:
        results = [e for e in results if e["discipline"] == disc]
    if sub:
        results = [e for e in results if e["sub_discipline"] == sub]
    # Return lightweight list
    return jsonify([{
        "id": e["id"], "name": e["name"], "discipline": e["discipline"],
        "sub_discipline": e["sub_discipline"], "status": e["status"]
    } for e in results])

@app.route("/api/effect/<effect_id>")
def api_effect(effect_id):
    for e in data["effects"]:
        if e["id"] == effect_id:
            papers = [p for p in data["papers"] if p["effect_id"] == effect_id]
            return jsonify({**e, "papers": papers})
    return jsonify({"error": "Not found"}), 404

@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").lower().strip()
    if not q or len(q) < 2:
        return jsonify([])
    results = []
    for e in data["effects"]:
        if q in e["name"].lower() or q in e.get("description", "").lower():
            results.append({"id": e["id"], "name": e["name"], "discipline": e["discipline"], "status": e["status"]})
        if len(results) >= 20:
            break
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
