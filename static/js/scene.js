function fix_scene(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100, subdivisions: 2 }, scene);
    ground.material = new BABYLON.StandardMaterial('groundMat', scene);
    ground.material.diffuseTexture = new BABYLON.Texture('/static/assets/pattern/tanahmerah.jpg', scene);
    ground.material.diffuseTexture.uScale = 10;
    ground.material.diffuseTexture.vScale = 10;
    ground.receiveShadows = true;

    scene.onNewMeshAddedObservable.add((newMesh) => {
        if (newMesh.name.includes("Gizmo") || newMesh.name === "ground") {
            return;
        }

        const rootMesh = newMesh.parent || newMesh;
        if (rootMesh.name.includes("__root__")) {
            const boundingBox = rootMesh.getBoundingInfo().boundingBox;
            rootMesh.position.y -= boundingBox.minimumWorld.y;

            rootMesh.actionManager = new BABYLON.ActionManager(scene);
            rootMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                updateControlStatus(rootMesh);
                rootMesh.type = rootMesh.type || 'loaded_object';
                showInfo(rootMesh);
            }));
        }
    });
}

function initScene() {
    scene = new BABYLON.Scene(engine);
    return scene;
}

function initCamera(scene) {
    camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 2.5,
        50,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);
    return camera;
}

function initLight(scene) {
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
}

function initGizmo(scene) {
    gizmoManager = new BABYLON.GizmoManager(scene);
    gizmoManager.useUtilityLayer = false;
    gizmoManager.attachToMesh(null);
}

function loadModel(scene, camera) {
    const MODEL_URL = 'static/assets/city.glb';
    statusBar('Loading model from local assets …');
    BABYLON.SceneLoader.Append('', MODEL_URL, scene, (scene) => {
        statusBar('Building model loaded');
        
        const rootMesh = scene.meshes.find(mesh => mesh.name.includes("__root__"));
        if (rootMesh) {
            const boundingInfo = rootMesh.getHierarchyBoundingVectors(true);
            const min = boundingInfo.min;
            const max = boundingInfo.max;
            const center = min.add(max).scale(0.5);
            camera.setTarget(center);

            const sizeVec = max.subtract(min);
            const maxSize = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
            camera.radius = maxSize * 1.5;
        }
    }, (evt) => {
        if (evt.lengthComputable) {
            const percent = (evt.loaded / evt.total * 100) | 0;
            statusBar(`Loading model… ${percent}%`);
        }
    }, (scene, message, exception) => {
        console.error('Model load error for', MODEL_URL, message || exception);
        statusBar('Model load error, check file path.');
    });
}

async function addSensorIcons(scene) {
    try {
        const response = await fetch("static/data/sensor.json");
        const sensorIcons = await response.json();

        sensorIcons.forEach(sensor => {
            let mesh;

            if (sensor.type === "wall") {
                mesh = BABYLON.MeshBuilder.CreateBox(sensor.id, { width: 3, height: 3, depth: 2 }, scene);
                const mat = new BABYLON.StandardMaterial(`${sensor.id}_mat`, scene);
                mat.diffuseColor = new BABYLON.Color3(1, 0, 0); // merah
                mat.alpha = 0.5;
                mesh.material = mat;

            } else if (sensor.type === "cctv") {
                mesh = BABYLON.MeshBuilder.CreateSphere(sensor.id, { diameter: 0.5 }, scene);
                const mat = new BABYLON.StandardMaterial(`${sensor.id}_mat`, scene);
                mat.diffuseColor = new BABYLON.Color3(1, 0.5, 0); // orange
                mat.alpha = 0.5;
                mesh.material = mat;

            } else if (sensor.type === "zone") {
                mesh = BABYLON.MeshBuilder.CreatePlane(sensor.id, { width: 5, height: 5 }, scene);
                const mat = new BABYLON.StandardMaterial(`${sensor.id}_mat`, scene);
                mat.diffuseColor = new BABYLON.Color3(0, 1, 0); // hijau
                mat.alpha = 0.5;
                mat.backFaceCulling = false;
                mat.sideOrientation= BABYLON.Mesh.DOUBLESIDE ;
                mesh.material = mat;
            }

            if (mesh) {
                mesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);

                if (sensor.rotation) {
                    mesh.rotation = new BABYLON.Vector3(sensor.rotation.x, sensor.rotation.y, sensor.rotation.z);
                } else if (sensor.type === "zone") {
                    // fallback kalau file lama tidak ada rotation
                    mesh.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
                    mesh.rotation.x = Math.PI / -2;
                }

                if (sensor.scaling) {
                    mesh.scaling = new BABYLON.Vector3(sensor.scaling.x, sensor.scaling.y, sensor.scaling.z);
                }

                mesh.type = sensor.type;
            }
        });
    } catch (err) {
        console.error("Gagal load sensor.json:", err);
    }
}
/* Fungsi hapus sensor  */
// Fungsi hapus sensor
function deleteSensor(mesh) {
    if (!mesh) {
        alert("Tidak ada sensor yang dipilih!");
        return;
    }

    // Konfirmasi
    if (!confirm(`Hapus sensor ${mesh.id}?`)) return;

    // Hapus dari scene
    mesh.dispose();

    // Hapus dari server (sensor.json)
    fetch("/delete_sensor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mesh.id })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Sensor dihapus:", data);
        alert("Sensor berhasil dihapus!");
    })
    .catch(err => console.error("Gagal hapus sensor:", err));
}

// Array untuk menampung objek baru sebelum disimpan
let pendingSensors = [];
//function untuk mengupdate status kontrol
function registerPointerEvents(scene, camera) {
    scene.onPointerDown = (evt) => {
        if (currentPanelPlacement) {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                const panelType = document.getElementById('panelType').value;
                const panelName = document.getElementById('panelName').value || `${panelType}__${Date.now()}`;
                const apiInput = document.getElementById('apiInput').value || 'N/A';

                let newObject, mat;

                // Pilih bentuk object sesuai tipe
                if (panelType === 'wall') {
                    newObject = BABYLON.MeshBuilder.CreateBox(panelName, { width: 3, height: 0.2, depth: 1 }, scene);
                    mat = new BABYLON.StandardMaterial("mat_wall", scene);
                    mat.diffuseColor = new BABYLON.Color3(1, 0, 0); // merah
                    mat.alpha = 0.5;
                } else if (panelType === 'cctv') {
                    newObject = BABYLON.MeshBuilder.CreateSphere(panelName, { diameter: 0.5 }, scene);
                    mat = new BABYLON.StandardMaterial("mat_cctv", scene);
                    mat.diffuseColor = new BABYLON.Color3(1, 0.5, 0); // orange
                    mat.alpha = 0.5;
                } else if (panelType === 'zone') {
                    newObject = BABYLON.MeshBuilder.CreatePlane(panelName, { width: 4, height: 4 }, scene);
                    mat = new BABYLON.StandardMaterial("mat_zone", scene);
                    mat.diffuseColor = new BABYLON.Color3(0, 1, 0); // hijau
                    mat.alpha = 0.5;
                    // rotasi supaya horizontal
                    newObject.rotation.x = Math.PI / 2;
                }

                if (newObject) {
                    newObject.material = mat;

                    // posisi di permukaan tanah
                    newObject.position.x = pickResult.pickedPoint.x;
                    newObject.position.z = pickResult.pickedPoint.z;
                    const boundingBox = newObject.getBoundingInfo().boundingBox;
                    newObject.position.y = -boundingBox.minimumWorld.y;

                    newObject.type = panelType;
                    newObject.api = apiInput;

                    // event klik
                    newObject.actionManager = new BABYLON.ActionManager(scene);
                    newObject.actionManager.registerAction(
                        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                            updateControlStatus(newObject);
                            showInfo(newObject);
                        })
                    );

                    // simpan data ke buffer
                    pendingSensors.push({
                        id: panelName,
                        type: panelType,
                        api: apiInput,
                        position: {
                            x: newObject.position.x,
                            y: newObject.position.y,
                            z: newObject.position.z
                        },
                        rotation: {
                            x: newObject.rotation.x,
                            y: newObject.rotation.y,
                            z: newObject.rotation.z
                        },
                        scaling: {
                            x: newObject.scaling.x,
                            y: newObject.scaling.y,
                            z: newObject.scaling.z
                        }
                    });

                    console.log("Ditambahkan ke pendingSensors:", pendingSensors);
                }
            }
            currentPanelPlacement = false;
            camera.attachControl(canvas, true);
        } else {
            const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
            if (pickInfo.hit && pickInfo.pickedMesh) {
                updateControlStatus(pickInfo.pickedMesh);
                if (pickInfo.pickedMesh.type) {
                    showInfo(pickInfo.pickedMesh);
                }
            } else {
                updateControlStatus(null);
            }
        }
    };
}

/* save scene state */
document.getElementById("saveSceneBtn").addEventListener("click", () => {
    const sensorsData = [];

    scene.meshes.forEach(mesh => {
        if (mesh.type === "wall" || mesh.type === "cctv" || mesh.type === "zone") {
            sensorsData.push({
                id: mesh.id,
                type: mesh.type,
                position: {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z
                },
                scaling: {
                    x: mesh.scaling.x,
                    y: mesh.scaling.y,
                    z: mesh.scaling.z
                }
            });
        }
    });
    console.log("Saving sensors:", pendingSensors); // debug log

    fetch("/save_sensors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorsData)  // <-- bungkus array
    })
    .then(res => res.json())
    .then(data => {
        console.log("Data tersimpan:", data);
        alert("Sensor berhasil disimpan!");
        pendingSensors = [];
    })
    .catch(err => console.error("Gagal simpan:", err));
});


/**
 * Fungsi utama createScene (tetap dipanggil di main.js)
 */
function createScene() {
    scene = initScene();
    camera = initCamera(scene);
    initLight(scene);
    initGizmo(scene);
    fix_scene(scene);      // fungsi lama tetap dipanggil

    loadModel(scene, camera);
    addSensorIcons(scene);
    registerPointerEvents(scene, camera);

    return scene;
}

//end create scene function