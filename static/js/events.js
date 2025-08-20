// Event listener untuk tombol Add Panel
document.getElementById('addPanelBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'flex';
    currentPanelPlacement = true;
    statusBar('Click on the scene to place the new object.');
    camera.detachControl(canvas);
});

// Event listener untuk Cancel
document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'none';
    currentPanelPlacement = false;
    camera.attachControl(canvas, true);
});

// Event listener untuk Place
document.getElementById('placeBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'none';
});

// Tombol kontrol gizmo (Move, Rotate, Resize)
document.getElementById('moveBtn').addEventListener('click', () => {
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;
});

document.getElementById('rotateBtn').addEventListener('click', () => {
    gizmoManager.positionGizmoEnabled = false;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.scaleGizmoEnabled = false;
});

document.getElementById('resizeBtn').addEventListener('click', () => {
    gizmoManager.positionGizmoEnabled = false;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = true;
});

// Tombol kontrol kamera
document.getElementById('topViewBtn').addEventListener('click', () => {
    
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, 0.01, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});

document.getElementById('bottomViewBtn').addEventListener('click', () => {
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});

document.getElementById('leftViewBtn').addEventListener('click', () => {
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});

document.getElementById('rightViewBtn').addEventListener('click', () => {
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, Math.PI, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});

document.getElementById('perspectiveViewBtn').addEventListener('click', () => {
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, -Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI / 2.5, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});

// Tombol Panning mode
document.getElementById('panViewBtn').addEventListener('click', () => {
    isPanningModeActive = !isPanningModeActive; // toggle status

    const canvas = scene.getEngine().getRenderingCanvas();

    if (isPanningModeActive) {
        camera.panningSensibility = 2000;
        canvas.style.cursor = "grab"; // kursor tangan
        statusBar('Panning mode: On');

        // Saat mouse ditekan → kursor "grabbing"
        canvas.addEventListener("mousedown", () => {
            if (isPanningModeActive) canvas.style.cursor = "grabbing";
        });
        canvas.addEventListener("mouseup", () => {
            if (isPanningModeActive) canvas.style.cursor = "grab";
        });
    } else {
        camera.panningSensibility = 0;
        canvas.style.cursor = "default"; // balik normal
        statusBar('Panning mode: Off');
    }
});

// hapus event sensor 
let selectedMesh = null;

document.getElementById("deleteSensorBtn").addEventListener("click", () => {
    deleteSensor(selectedMesh);
});

//event listener untuk tombol Edit Sensor
// Tombol Edit Sensor
document.getElementById("editSensorBtn").addEventListener("click", () => {
    const formPanel = document.getElementById("formPanel");
    formPanel.style.display = (formPanel.style.display === "block") ? "none" : "block";

    // Jika ada mesh yang dipilih, isi form dengan datanya
    if (selectedMesh) {
        document.getElementById("panelType").value = selectedMesh.type || "wall";
        document.getElementById("panelName").value = selectedMesh.id || "";
        document.getElementById("apiInput").value = selectedMesh.api || "";
    }
});

// Cancel
document.getElementById("cancelBtn").addEventListener("click", () => {
    document.getElementById("formPanel").style.display = "none";
    document.getElementById("placeBtn").textContent = "Place Object";
    editMode = false;
    selectedMesh = null;
});

// Place / Update Object
let editMode = false; // Flag untuk mode edit
document.getElementById("placeBtn").addEventListener("click", async () => {
    const type = document.getElementById("panelType").value;
    const name = document.getElementById("panelName").value;
    const api = document.getElementById("apiInput").value;

    if (editMode && selectedMesh) {
        // Mode Edit
        selectedMesh.type = type;
        selectedMesh.id = name;
        selectedMesh.api = api;

        const sensorData = {
            id: name,
            type: type,
            position: selectedMesh.position || {x:0,y:0,z:0},
            scaling: selectedMesh.scaling || {x:1,y:1,z:1},
            api: api
        };

        try {
            const res = await fetch("/update-sensor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sensorData)
            });
            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error("Update error:", err);
            alert("Gagal update sensor");
        }

        // Reset form
        document.getElementById("placeBtn").textContent = "Place Object";
        editMode = false;
        selectedMesh = null;
        document.getElementById("formPanel").style.display = "none";
    } else {
        // Mode Tambah Baru
        console.log("Tambah objek baru:", { type, name, api });
        // 👉 di sini lanjutkan logic Place Object sesuai kode awalmu
    }
});
// Kamu bisa sambungkan ini dengan event click BabylonJS
function selectMesh(mesh) {
    selectedMesh = mesh;
    console.log("Selected:", mesh);
}