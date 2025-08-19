from flask import Flask,request,jsonify, render_template, send_from_directory
import json, os
from flask_cors import CORS
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("home.html")

# route untuk asset glb atau media streaming
@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("static/assets", filename)

#add route untuk mengirimkan file sensor.json
@app.route("/save_sensors", methods=["POST"])
def save_sensors():
    try:
        new_sensors = request.get_json(force=True)

        if not isinstance(new_sensors, list):
            return jsonify({"error": "Expected a list of sensors"}), 400

        file_path = "static/data/sensor.json"

        # Baca data lama kalau ada
        existing_sensors = []
        if os.path.exists(file_path):
            try:
                with open(file_path, "r") as f:
                    existing_sensors = json.load(f)
                    if not isinstance(existing_sensors, list):
                        existing_sensors = []
            except Exception:
                existing_sensors = []

        # Convert existing ke dict by id
        sensor_dict = {s["id"]: s for s in existing_sensors if "id" in s}

        # Update atau tambahkan data baru
        for s in new_sensors:
            if "id" in s:
                sensor_dict[s["id"]] = s  # replace by id

        # Hasil akhir → list lagi
        final_sensors = list(sensor_dict.values())

        # Simpan
        with open(file_path, "w") as f:
            json.dump(final_sensors, f, indent=4)

        return jsonify({
            "status": "ok",
            "saved": len(new_sensors),
            "total": len(final_sensors)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)
CORS(app) # Ini akan mengaktifkan CORS untuk semua rute