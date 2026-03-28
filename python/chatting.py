"""
╔══════════════════════════════════════════════════════════════╗
║      NLP-Based Crowd Intelligence System — Flask API         ║
║                                                              ║
║  Endpoints:                                                  ║
║    GET  /              → health check                        ║
║    POST /chat          → classify message + store report     ║
║    GET  /alerts        → active crowd alerts                 ║
║    GET  /heatmap       → per-station intensity data          ║
║    GET  /stats         → model + runtime stats               ║
╚══════════════════════════════════════════════════════════════╝
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import re
import os
import json
import threading
import time
from datetime import datetime, timedelta
from collections import deque
from pathlib import Path

# ─────────────────────────────────────────────
#  App Setup
# ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # allow all origins — safe for local dev

BASE_DIR        = Path(__file__).parent
MODEL_PATH      = BASE_DIR / "model" / "model.pkl"
VECTORIZER_PATH = BASE_DIR / "model" / "vectorizer.pkl"
STATIONS_PATH   = BASE_DIR.parent / "backend" / "data" / "mumbai_local_stations.json"

# ─────────────────────────────────────────────
#  Load Model & Vectorizer
# ─────────────────────────────────────────────
print("🔄 Loading NLP model and vectorizer...")

if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
    raise FileNotFoundError(
        f"❌ Model files not found at {MODEL_PATH} or {VECTORIZER_PATH}"
    )

with open(MODEL_PATH, "rb") as f:
    nlp_model = pickle.load(f)
with open(VECTORIZER_PATH, "rb") as f:
    tfidf = pickle.load(f)

print("✅ NLP model loaded.")

# ─────────────────────────────────────────────
#  Load Station List
# ─────────────────────────────────────────────
print("🔄 Loading Mumbai station list...")

if not STATIONS_PATH.exists():
    raise FileNotFoundError(f"❌ Station file not found at {STATIONS_PATH}")

with open(STATIONS_PATH, "r", encoding="utf-8") as f:
    station_data = json.load(f)

STATIONS = [s.lower() for s in station_data.get("stations", [])]
STATION_ORIGINAL = {s.lower(): s for s in station_data.get("stations", [])}

print(f"✅ Loaded {len(STATIONS)} stations.")

# ─────────────────────────────────────────────
#  Station Coordinates (Mumbai local lines)
# ─────────────────────────────────────────────
STATION_COORDS = {
    "churchgate":       [18.9322, 72.8264],
    "marine lines":     [18.9436, 72.8231],
    "charni road":      [18.9524, 72.8195],
    "grant road":       [18.9639, 72.8139],
    "mumbai central":   [18.9691, 72.8199],
    "mahalaxmi":        [18.9820, 72.8192],
    "lower parel":      [18.9943, 72.8255],
    "elphinstone road": [19.0038, 72.8282],
    "dadar":            [19.0186, 72.8430],
    "matunga road":     [19.0280, 72.8446],
    "mahim":            [19.0433, 72.8430],
    "bandra":           [19.0543, 72.8396],
    "khar road":        [19.0683, 72.8367],
    "santacruz":        [19.0814, 72.8355],
    "vile parle":       [19.0990, 72.8481],
    "andheri":          [19.1195, 72.8469],
    "jogeshwari":       [19.1352, 72.8495],
    "goregaon":         [19.1625, 72.8499],
    "malad":            [19.1867, 72.8484],
    "kandivali":        [19.2052, 72.8518],
    "borivali":         [19.2289, 72.8567],
    "dahisar":          [19.2521, 72.8583],
    "thane":            [19.1945, 72.9615],
    "kurla":            [19.0734, 72.8788],
    "ghatkopar":        [19.0858, 72.9081],
    "vikhroli":         [19.1075, 72.9270],
    "bhandup":          [19.1297, 72.9395],
    "mulund":           [19.1715, 72.9589],
    "csmt harbour":     [18.9398, 72.8354],
    "chhatrapati shivaji maharaj terminus": [18.9398, 72.8354],
    "masjid":           [18.9503, 72.8360],
    "sandhurst road":   [18.9598, 72.8366],
    "byculla":          [18.9695, 72.8337],
    "chinchpokli":      [18.9786, 72.8336],
    "currey road":      [18.9896, 72.8304],
    "parel":            [18.9961, 72.8342],
    "dockyard road":    [18.9527, 72.8484],
    "reay road":        [18.9617, 72.8476],
    "cotton green":     [18.9714, 72.8454],
    "sewri":            [18.9790, 72.8574],
    "wadala road":      [18.9929, 72.8588],
    "matunga":          [19.0225, 72.8622],
    "sion":             [19.0403, 72.8624],
    "tilak nagar":      [19.0559, 72.8804],
    "chembur":          [19.0626, 72.8991],
    "govandi":          [19.0721, 72.9151],
    "mankhurd":         [19.0650, 72.9348],
    "panvel":           [18.9941, 73.1189],
    "vashi":            [19.0773, 72.9988],
    "nerul":            [19.0337, 73.0173],
    "seawoods":         [19.0120, 73.0233],
    "belapur cbd":      [19.0224, 73.0398],
    "airoli":           [19.1490, 72.9987],
    "ghansoli":         [19.1222, 73.0067],
    "koparkhairane":    [19.1059, 73.0130],
    "turbhe":           [19.0896, 73.0165],
    "sanpada":          [19.0721, 73.0063],
    "juinagar":         [19.0494, 73.0072],
    "dombivli":         [19.2146, 73.0896],
    "kalyan":           [19.2435, 73.1296],
    "ambivli":          [19.2001, 73.1019],
    "thakurli":         [19.2297, 73.1006],
    "vidyavihar":       [19.0875, 72.9006],
    "ghatkopar":        [19.0858, 72.9081],
    "vikhroli":         [19.1075, 72.9270],
    "kanjurmarg":       [19.1186, 72.9432],
    "nahur":            [19.1519, 72.9517],
    "titwala":          [19.3006, 73.1972],
    "shahad":           [19.2721, 73.1595],
    "ambernath":        [19.1968, 73.1907],
    "vasai road":       [19.3699, 72.8267],
    "nalasopara":       [19.4249, 72.7999],
    "virar":            [19.4616, 72.7997],
    "mira road":        [19.2851, 72.8688],
    "bhayandar":        [19.3073, 72.8527],
    "naigaon":          [19.3508, 72.8377],
    "diva":             [19.2286, 73.0720],
    "mumbra":           [19.2113, 73.0199],
    "kalwa":            [19.2050, 72.9862],
    "gtb nagar":        [19.2456, 72.8685],
    "ram mandir":       [19.1930, 72.8565],
    "chunabhatti":      [19.0521, 72.8730],
}

# ─────────────────────────────────────────────
#  In-Memory State
# ─────────────────────────────────────────────
# station_reports: station_name → deque of {"ts": datetime, "label": "CROWD_ALERT"|"NORMAL"}
station_reports = {}
station_intensity = {}   # station_name → float [0..100]
state_lock = threading.Lock()

WINDOW_MINUTES   = 5
ALERT_THRESHOLD  = 5       # crowd messages in window
ALERT_RATIO      = 0.60    # crowd / total ratio threshold
DECAY_RATE       = 0.90    # per-minute multiplier
DECAY_INTERVAL   = 60      # seconds between decay ticks
ALERT_BOOST      = 20      # intensity added per CROWD_ALERT
NORMAL_REDUCE    = 5       # intensity reduced per NORMAL message

# Runtime stats
runtime_stats = {
    "total_messages":  0,
    "crowd_alerts":    0,
    "normals":         0,
    "start_time":      datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
}

# ─────────────────────────────────────────────
#  Helper: Text Preprocessing
# ─────────────────────────────────────────────
def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ─────────────────────────────────────────────
#  Helper: NLP Classification
# ─────────────────────────────────────────────
def classify_message(text: str) -> dict:
    clean  = preprocess_text(text)
    vector = tfidf.transform([clean])
    label  = int(nlp_model.predict(vector)[0])
    proba  = nlp_model.predict_proba(vector)[0]
    conf   = round(float(max(proba)) * 100, 2)
    result = "CROWD_ALERT" if label == 1 else "NORMAL"

    with state_lock:
        runtime_stats["total_messages"] += 1
        if label == 1:
            runtime_stats["crowd_alerts"] += 1
        else:
            runtime_stats["normals"] += 1

    return {
        "text":       text,
        "clean_text": clean,
        "prediction": result,
        "label":      label,
        "confidence": f"{conf}%",
    }


# ─────────────────────────────────────────────
#  Helper: Station Extraction
# ─────────────────────────────────────────────
def extract_station(text: str):
    """Case-insensitive substring match. Returns canonical name or None."""
    lower = text.lower()
    # Try longest match first
    for station in sorted(STATIONS, key=len, reverse=True):
        if station in lower:
            return STATION_ORIGINAL[station]
    return None


# ─────────────────────────────────────────────
#  Helper: Rolling Window Cleanup
# ─────────────────────────────────────────────
def prune_window(q: deque):
    cutoff = datetime.now() - timedelta(minutes=WINDOW_MINUTES)
    while q and q[0]["ts"] < cutoff:
        q.popleft()


# ─────────────────────────────────────────────
#  Helper: Compute Alert Status for a Station
# ─────────────────────────────────────────────
def station_alert_status(station: str) -> dict:
    with state_lock:
        q = station_reports.get(station, deque())
        prune_window(q)
        total  = len(q)
        crowd  = sum(1 for r in q if r["label"] == "CROWD_ALERT")
        ratio  = crowd / total if total > 0 else 0
        alerted = (crowd >= ALERT_THRESHOLD) or (ratio > ALERT_RATIO and crowd > 0)
        return {
            "station":      station,
            "crowd_count":  crowd,
            "total_count":  total,
            "ratio":        round(ratio, 3),
            "alerted":      alerted,
            "intensity":    round(station_intensity.get(station, 0), 1),
        }


# ─────────────────────────────────────────────
#  Background: Heatmap Decay Thread
# ─────────────────────────────────────────────
def decay_loop():
    while True:
        time.sleep(DECAY_INTERVAL)
        with state_lock:
            for st in list(station_intensity.keys()):
                station_intensity[st] = max(0.0, station_intensity[st] * DECAY_RATE)
        print(f"[Decay] Applied ×{DECAY_RATE} to all station intensities.")

decay_thread = threading.Thread(target=decay_loop, daemon=True)
decay_thread.start()
print("✅ Heatmap decay thread started.")


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status":    "running",
        "service":   "Crowd Intelligence NLP API",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "endpoints": {
            "POST /chat":    "Submit a message for classification",
            "GET  /alerts":  "Get active crowd alerts",
            "GET  /heatmap": "Get per-station intensity data",
            "GET  /stats":   "Runtime statistics",
        }
    }), 200


# ── POST /chat ─────────────────────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    """
    Classify a user message, extract station, store report.

    Request JSON: { "text": "Dadar is very crowded right now" }
    Response:
    {
        "prediction":   "CROWD_ALERT",
        "confidence":   "94.1%",
        "station":      "Dadar",
        "alert":        true,
        "intensity":    60.0,
        "message":      "⚠️ Crowd Alert at Dadar"
    }
    """
    data = request.get_json(force=True, silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field."}), 400

    text = str(data["text"]).strip()
    if not text:
        return jsonify({"error": "'text' cannot be empty."}), 400

    # 1. NLP classification
    result    = classify_message(text)
    prediction = result["prediction"]

    # 2. Station extraction
    station = extract_station(text)

    # 3. Store report + update intensity
    response = {
        "prediction": prediction,
        "confidence": result["confidence"],
        "station":    station,
        "alert":      False,
        "intensity":  0.0,
        "message":    None,
    }

    if station:
        with state_lock:
            if station not in station_reports:
                station_reports[station] = deque()
            station_reports[station].append({
                "ts":    datetime.now(),
                "label": prediction,
                "text":  text,
            })

            # Update intensity
            current = station_intensity.get(station, 0.0)
            if prediction == "CROWD_ALERT":
                station_intensity[station] = min(100.0, current + ALERT_BOOST)
            else:
                station_intensity[station] = max(0.0, current - NORMAL_REDUCE)

        # Compute alert status
        status = station_alert_status(station)
        response["alert"]     = status["alerted"]
        response["intensity"] = status["intensity"]
        if status["alerted"]:
            response["message"] = f"⚠️ Crowd Alert at {station}"

    return jsonify(response), 200


# ── GET /alerts ────────────────────────────────────────────────
@app.route("/alerts", methods=["GET"])
def get_alerts():
    """Return all stations currently in alert state."""
    alerts = []
    with state_lock:
        all_stations = list(station_reports.keys())

    for station in all_stations:
        status = station_alert_status(station)
        if status["alerted"]:
            alerts.append({
                "station":     station,
                "crowd_count": status["crowd_count"],
                "ratio":       status["ratio"],
                "intensity":   status["intensity"],
                "message":     f"⚠️ Crowd Alert at {station}",
            })

    return jsonify({"alerts": alerts, "count": len(alerts)}), 200


# ── GET /heatmap ───────────────────────────────────────────────
@app.route("/heatmap", methods=["GET"])
def get_heatmap():
    """Return per-station intensity + coordinates for map rendering."""
    stations_out = []

    # Include all stations that have known coords
    with state_lock:
        intensities_copy = dict(station_intensity)

    for canonical, coords in STATION_COORDS.items():
        orig_name = STATION_ORIGINAL.get(canonical, canonical.title())
        intensity = intensities_copy.get(orig_name, 0.0)

        # Determine color level
        if intensity >= 60:
            level = "HIGH"
        elif intensity >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Check alert
        status = station_alert_status(orig_name)

        stations_out.append({
            "station":   orig_name,
            "lat":       coords[0],
            "lng":       coords[1],
            "intensity": round(intensity, 1),
            "level":     level,
            "alerted":   status["alerted"],
        })

    return jsonify({"stations": stations_out}), 200


# ── GET /stats ─────────────────────────────────────────────────
@app.route("/stats", methods=["GET"])
def get_stats():
    with state_lock:
        stats_copy = dict(runtime_stats)
        active_stations = len([
            s for s, q in station_reports.items() if len(q) > 0
        ])

    return jsonify({
        "model":            "Logistic Regression + TF-IDF",
        "total_messages":   stats_copy["total_messages"],
        "crowd_alerts":     stats_copy["crowd_alerts"],
        "normals":          stats_copy["normals"],
        "active_stations":  active_stations,
        "uptime_since":     stats_copy["start_time"],
        "window_minutes":   WINDOW_MINUTES,
        "alert_threshold":  ALERT_THRESHOLD,
        "alert_ratio":      ALERT_RATIO,
    }), 200


# ─────────────────────────────────────────────
#  Error Handlers
# ─────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found.", "status": 404}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed.", "status": 405}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error.", "status": 500}), 500


# ─────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "="*58)
    print("  🚆 Crowd Intelligence NLP API")
    print("  Model : TF-IDF + Logistic Regression")
    print("  URL   : http://127.0.0.1:5001")
    print("  Decay : Every 60s × 0.90")
    print("="*58 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5001)
