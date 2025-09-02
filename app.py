from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import sqlite3, os, json

app = Flask(__name__)
CORS(app)

DB_FILE = "static/data/sensor.db"
def get_db():
    # Return object koneksi SQLite, bukan string
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# --- Helper DB ---
def init_db():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sensors (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def get_all_sensors():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT data FROM sensors")
    rows = cur.fetchall()
    conn.close()
    return [json.loads(r[0]) for r in rows]

def save_sensor(sensor):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("REPLACE INTO sensors (id, data) VALUES (?, ?)",
                (sensor["id"], json.dumps(sensor)))
    conn.commit()
    conn.close()

def delete_sensor_by_id(sensor_id):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("DELETE FROM sensors WHERE id=?", (sensor_id,))
    conn.commit()
    conn.close()

def overwrite_all_sensors(sensors):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("DELETE FROM sensors")  # hapus semua dulu
    for s in sensors:
        cur.execute("INSERT INTO sensors (id, data) VALUES (?, ?)",
                    (s["id"], json.dumps(s)))
    conn.commit()
    conn.close()

# --- Error handler ---
@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal Server Error", "detail": str(error)}), 500

# --- Routes ---
@app.route("/")
def index():
    return render_template("home.html")

@app.route("/api/sensors", methods=["GET"])
def api_sensors():
    try:
        sensors = get_all_sensors()
        return jsonify(sensors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("static/assets", filename)

# --- Hapus sensor ---
@app.route("/delete_sensor", methods=["POST"])
def delete_sensor():
    data = request.get_json()
    sensor_id = data.get("id")
    if not sensor_id:
        return jsonify({"error": "ID tidak diberikan"}), 400
    
    delete_sensor_by_id(sensor_id)
    return jsonify({"status": "deleted", "id": sensor_id})

# --- Simpan batch sensors (merge by ID) ---
@app.route("/save_sensors", methods=["POST"])
def save_sensors():
    try:
        new_sensors = request.get_json(force=True)
        if not isinstance(new_sensors, list):
            return jsonify({"error": "Expected a list of sensors"}), 400

        existing_sensors = {s["id"]: s for s in get_all_sensors()}
        for s in new_sensors:
            if "id" in s:
                existing_sensors[s["id"]] = s

        overwrite_all_sensors(list(existing_sensors.values()))
        return jsonify({
            "status": "ok",
            "saved": len(new_sensors),
            "total": len(existing_sensors)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Overwrite total sensor (save_edit) ---
@app.route("/save_edit", methods=["POST"])
def save_edit():
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"error": "Data harus berupa list sensor"}), 400

        # Ambil semua sensor dari DB dulu
        existing_sensors = {s["id"]: s for s in get_all_sensors()}

        updated_sensors = []
        for new_sensor in data:
            sid = new_sensor.get("id")
            if not sid:
                return jsonify({"error": f"Sensor tanpa ID ditemukan: {new_sensor}"}), 400

            old_sensor = existing_sensors.get(sid, {})
            # Merge: update field lama dengan yang baru
            merged = {**old_sensor, **new_sensor}
            updated_sensors.append(merged)

        # Simpan hasil merge
        overwrite_all_sensors(updated_sensors)

        return jsonify({"message": "Semua sensor berhasil diupdate (merge)"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/save_panel", methods=["POST"])
def save_panel():
    try:
        data = request.get_json(force=True)  # Ambil JSON body dari frontend
        panel_id = data.get("id")

        if not panel_id:
            return jsonify({"error": "Field 'id' wajib ada di frontend"}), 400

        # Simpan semua data panel ke kolom 'data' (dalam format JSON string)
        panel_data = json.dumps(data)

        with get_db() as conn:
            conn.execute("""
                INSERT INTO sensors (id, data)
                VALUES (?, ?)
                ON CONFLICT(id) DO UPDATE SET data=excluded.data
            """, (panel_id, panel_data))
            conn.commit()

        return jsonify({"message": f"Panel {panel_id} berhasil disimpan/diupdate"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
CORS(app) # Ini akan mengaktifkan CORS untuk semua rute