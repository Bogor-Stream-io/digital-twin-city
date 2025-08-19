from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("home.html")

# route untuk asset glb atau media streaming
@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory("static/assets", filename)

if __name__ == "__main__":
    app.run(debug=True)
CORS(app) # Ini akan mengaktifkan CORS untuk semua rute