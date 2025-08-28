// Event listener untuk tombol Add Panel
document.getElementById('addPanelBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'flex';
    currentPanelPlacement = true;
    statusBar('Click on the scene to place the new object.');
    // Reset form fields
    resetPanellAddForm();
    camera.detachControl(canvas);
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
    if (isPanningModeActive) {
        camera.panningSensibility = 2000;
        statusBar('Panning mode: On');
    } else {
        camera.panningSensibility = 0;
        statusBar('Panning mode: Off');
    }
});
// hapus event sensor 

document.getElementById("deleteSensorBtn").addEventListener("click", () => {
    console.log("Delete sensor:", selectedMesh);
    deleteSensor(selectedMesh);
});

//event listener untuk tombol Edit Sensor
// Tombol Edit Sensor
document.getElementById("editSensorBtn").addEventListener("click", () => {
    const formPanel = document.getElementById("formEditPanel");
    formPanel.style.display = (formPanel.style.display === "block") ? "none" : "block";

    // Jika ada mesh yang dipilih, isi form dengan datanya
    if (selectedMesh) {
        document.getElementById("EditpanelType").value = selectedMesh.type || "wall";
        document.getElementById("EditpanelName").value = selectedMesh.id || "";
        document.getElementById("EditapiInput").value = selectedMesh.api || "";
    }
});

// Cancel Add
document.getElementById("cancelAddBtn").addEventListener("click", () => {
    document.getElementById("formPanel").style.display = "none";
    document.getElementById("placeBtn").textContent = "Place Object";
    editMode = false;
    selectedMesh = null;
});

// Cancel Edit
document.getElementById("cancelEditBtn").addEventListener("click", () => {
    document.getElementById("formEditPanel").style.display = "none";
    editMode = false;
    selectedMesh = null;
});


// Place / Update Object
let editMode = false; // Flag untuk mode edit
document.getElementById("placeBtn").addEventListener("click", async () => {
    document.getElementById('formPanel').style.display = 'none';
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

// Save  Update Object Form panel
document.getElementById("saveBtn").addEventListener("click", async () => {
    const type = document.getElementById("EditpanelType").value.trim();
    const name = document.getElementById("EditpanelName").value.trim();
    const api = document.getElementById("EditapiInput").value.trim();

    if (!name) {
        alert("ID/Name sensor tidak boleh kosong");
        return;
    }

    console.log("Saving sensor editBtn Panel :", { type, name, api });

    // Default values
    let pos = { x: 0, y: 0, z: 0 };
    let scl = { x: 1, y: 1, z: 1 };
    let dim = { width: 2, height: 2, depth: 2 };

    if (selectedMesh && selectedMesh.position) {
        pos = {
            x: selectedMesh.position.x,
            y: selectedMesh.position.y,
            z: selectedMesh.position.z
        };
    }

    if (selectedMesh && selectedMesh.scaling) {
        scl = {
            x: selectedMesh.scaling.x,
            y: selectedMesh.scaling.y,
            z: selectedMesh.scaling.z
        };
    } 
        // dimensi (support mesh gabungan / hierarki)
    if (selectedMesh && selectedMesh.getHierarchyBoundingVectors) {
        const { min, max } = selectedMesh.getHierarchyBoundingVectors();
        const dimensions = max.subtract(min);
        dim = {
            width: dimensions.x,
            height: dimensions.y,
            depth: dimensions.z
        };
    }
    const sensorData = {
        id: name,
        type: type || "default",
        position: pos,
        scaling: scl,
        dimension: dim,
        api: api || ""
    };

        try {
        const saveRes = await fetch("/save_panel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sensorData)
        });

        const text = await saveRes.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error("Server tidak mengembalikan JSON: " + text);
        }

        if (!saveRes.ok) {
            throw new Error(result.error || "Gagal menyimpan sensor");
        }

        alert(result.message || `Sensor ${sensorData.id} berhasil disimpan/diupdate`);

        // Reset form
        document.getElementById("saveBtn").textContent = "Save";
        editMode = false;
        selectedMesh = null; // kalau mau clear selection
        document.getElementById("formEditPanel").style.display = "none";

    } catch (err) {
        console.error("Error saat menyimpan sensor:", err);
        alert("Gagal menyimpan sensor: " + err.message);
    }
});


// Kamu bisa sambungkan ini dengan event click BabylonJS
function selectMesh(mesh) {
    selectedMesh = mesh;
    console.log("Selected:", mesh);
}