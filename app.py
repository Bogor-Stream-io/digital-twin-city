from flask import Flask,request,jsonify, render_template, send_from_directory
import json, os
from flask_cors import CORS
app = Flask(__name__)
SENSOR_FILE = "static/data/sensor.json"

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal Server Error", "detail": str(error)}), 500

@app.route("/")
def index():
    return render_template("home.html")

# route untuk asset glb atau media streaming
@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("static/assets", filename)
# hapus sensor routing 
@app.route("/delete_sensor", methods=["POST"])
def delete_sensor():
    data = request.get_json()
    sensor_id = data.get("id")

    file_path = SENSOR_FILE
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    with open(file_path, "r") as f:
        sensors = json.load(f)

    # Filter keluar sensor yang dihapus
    sensors = [s for s in sensors if s["id"] != sensor_id]

    with open(file_path, "w") as f:
        json.dump(sensors, f, indent=2)

    return jsonify({"status": "deleted", "id": sensor_id})

#add route untuk mengirimkan file sensor.json
@app.route("/save_sensors", methods=["POST"])
def save_sensors():
    try:
        new_sensors = request.get_json(force=True)

        if not isinstance(new_sensors, list):
            return jsonify({"error": "Expected a list of sensors"}), 400

        file_path = SENSOR_FILE

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

#route untuk update atau simpan sensor edit
@app.route("/save_edit", methods=["POST"])
def save_edit():
    """
    Terima array data sensor dari frontend, hapus data lama,
    lalu overwrite file sensor.json dengan data baru.
    """
    try:
        data = request.get_json(force=True)

        # Validasi: harus list
        if not isinstance(data, list):
            return jsonify({"error": "Data harus berupa list sensor"}), 400

        # Optional: validasi setiap sensor ada ID
        for sensor in data:
            if "id" not in sensor:
                return jsonify({"error": f"Sensor tanpa ID ditemukan: {sensor}"}), 400

        # Simpan langsung ke file (overwrite semua)
        os.makedirs(os.path.dirname(SENSOR_FILE), exist_ok=True)
        with open(SENSOR_FILE, "w") as f:
            json.dump(data, f, indent=4)

        return jsonify({"message": "Semua sensor berhasil disimpan"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
CORS(app) # Ini akan mengaktifkan CORS untuk semua rute