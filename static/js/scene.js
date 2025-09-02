/**
 * Membuat skybox menggunakan aset yang paling sering digunakan.
 * @param {BABYLON.Scene} scene - Objek scene saat ini.
 * @param {string} skyboxType - Jenis skybox yang akan dibuat. Pilihan: 'default_pbr', 'clear_sky', atau 'dusk'.
 */
function createSkybox(scene, skyboxType) {
    let skybox = null;

    if (skyboxType !== 'default_pbr' && skyboxType !== 'glb') {
        skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        skybox.isPickable = false;
    }

    switch (skyboxType) {
        case 'default_pbr': {
            // Skybox PBR (pakai environment HDR)
            const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
                "https://assets.babylonjs.com/environments/environmentSpecular.env",
                scene
            );
            scene.createDefaultSkybox(hdrTexture, true, 1000, 0.2, true);
            break;
        }
        case 'clear_sky': {
            // Langit biru cerah
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxClearSky", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("static/assets/clear-air-sky.jpg", scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skybox.material = skyboxMaterial;
            break;
        }
        case 'dusk': {
            // Langit sore
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxDusk", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
                "https://assets.babylonjs.com/textures/skybox/dusk/dusk",
                scene
            );
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skybox.material = skyboxMaterial;
            break;
        }
        case 'glb': {
            // Skybox dari file GLB
            BABYLON.SceneLoader.ImportMesh(
                "",
                "static/assets/pattern/",
                "skybox-blue-desert.glb",
                scene,
                function (meshes) {
                    const glbSkybox = meshes[0];
                    glbSkybox.scaling = new BABYLON.Vector3(1000, 1000, 1000);
                    glbSkybox.isPickable = false;

                    if (glbSkybox.material) {
                        glbSkybox.material.backFaceCulling = false;
                        glbSkybox.material.disableLighting = true;
                    }

                    // Supaya selalu berada jauh di belakang
                    glbSkybox.infiniteDistance = true;
                }
            );
            break;
        }
        default:
            console.warn("Tipe skybox tidak valid. Pilih: 'default_pbr', 'clear_sky', 'dusk', atau 'glb'.");
            if (skybox) {
                skybox.dispose();
            }
            break;
    }
}

//fix scene function
function fix_scene(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100, subdivisions: 2 }, scene);
    ground.material = new BABYLON.StandardMaterial('groundMat', scene);
    ground.material.diffuseTexture = new BABYLON.Texture('/static/assets/pattern/tanah1.jpg', scene);
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
 const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 4,
    10,
    new BABYLON.Vector3(0, 0, 0),
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
    const MODEL_URL = 'static/assets/beautiful_city.glb';
    statusBar('Loading model from local assets …');
    BABYLON.SceneLoader.Append('', MODEL_URL, scene, (scene) => {
        statusBar('Building model loaded');
        
        const rootMesh = scene.meshes.find(mesh => mesh.name.includes("__root__"));
        if (rootMesh) {
            // --- Skala 2x semua sumbu ---
            rootMesh.scaling = new BABYLON.Vector3(3, 3, 3);

            // Hitung bounding box
            const boundingInfo = rootMesh.getHierarchyBoundingVectors(true);
            const min = boundingInfo.min;
            const max = boundingInfo.max;
            const center = min.add(max).scale(0.5);

            // Geser posisi ke tengah ground (0,0,0)
            rootMesh.position = rootMesh.position.subtract(center);
            rootMesh.position.y = rootMesh.position.y - min.y; // supaya menempel di ground plane

            // Kamera diarahkan ke tengah model
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));

            // Atur jarak kamera supaya pas
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
        const response = await fetch("/api/sensors"); // 🔥 Panggil API Flask SQLite
        const sensorIcons = await response.json();

        sensorIcons.forEach(sensor => {
            let mesh;

            if (sensor.type === "wall") {
                const dims = sensor.dimensions || { width: 1, height: 1, depth: 1 };
                mesh = BABYLON.MeshBuilder.CreateBox(sensor.id, {
                    width: dims.width,
                    height: dims.height,
                    depth: dims.depth
                }, scene);

                const mat = new BABYLON.StandardMaterial(`${sensor.id}_mat`, scene);
                mat.diffuseColor = new BABYLON.Color3(1, 0, 0); 
                mat.alpha = 0.5;
                mesh.material = mat;

            } else if (sensor.type === "cctv") {
                mesh = BABYLON.MeshBuilder.CreatePlane(sensor.id, { width: 2, height: 2 }, scene);

                const mat = new BABYLON.StandardMaterial(`${sensor.id}_mat`, scene);
                mat.diffuseTexture = new BABYLON.Texture("static/assets/pattern/webcam.png", scene);
                mat.diffuseTexture.hasAlpha = true;
                mat.backFaceCulling = false;
                mesh.material = mat;

            } else if (sensor.type === "zone") {
                mesh = BABYLON.MeshBuilder.CreatePlane(sensor.id, { width: 5, height: 5 }, scene);

                const mat = new BABYLON.StandardMaterial(`${sensor.id}_mat`, scene);
                mat.diffuseColor = new BABYLON.Color3(0, 1, 0); 
                mat.alpha = 0.5;
                mat.backFaceCulling = false;
                mesh.material = mat;

                mesh.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
                mesh.rotation.x = Math.PI / -2;
            }

            if (mesh) {
                // Posisi
                if (sensor.position) {
                    mesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
                }

                // Rotasi
                if (sensor.rotation) {
                    mesh.rotation = new BABYLON.Vector3(sensor.rotation.x, sensor.rotation.y, sensor.rotation.z);
                }

                // Scaling
                if (sensor.scaling) {
                    mesh.scaling = new BABYLON.Vector3(sensor.scaling.x, sensor.scaling.y, sensor.scaling.z);
                }

                mesh.type = sensor.type;
                mesh.api = sensor.api || '';

                mesh.actionManager = new BABYLON.ActionManager(scene);

                // Hover effect
                mesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPointerOverTrigger,
                        () => {
                            glowLayer.addIncludedOnlyMesh(mesh);

                            let borderColor;
                            if (mesh.material && mesh.material.diffuseColor) {
                                borderColor = mesh.material.diffuseColor.clone();
                            } else {
                                borderColor = new BABYLON.Color3(0.2, 0.8, 0.2);
                            }

                            hl.addMesh(mesh, borderColor);
                            scene.getEngine().getRenderingCanvas().style.cursor = "pointer";
                        }
                    )
                );

                // Hover out
                mesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        BABYLON.ActionManager.OnPointerOutTrigger,
                        () => {
                            glowLayer.removeIncludedOnlyMesh(mesh);
                            hl.removeMesh(mesh);
                            scene.getEngine().getRenderingCanvas().style.cursor = "default";
                        }
                    )
                );
            }
        });
    } catch (err) {
        console.error("Gagal load sensors dari API:", err);
    }
}


/* Fungsi hapus sensor  */
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
                        // buat plane
                    newObject = BABYLON.MeshBuilder.CreatePlane(panelName, { width: 2, height: 2 }, scene);

                    // buat material dengan texture gambar
                    mat = new BABYLON.StandardMaterial("mat_cctv", scene);
                    mat.diffuseTexture = new BABYLON.Texture("static/assets/pattern/webcam.png", scene);
                    mat.diffuseTexture.hasAlpha = true; // aktifkan transparansi dari gambar
                    mat.backFaceCulling = false;        // biar gambar terlihat dari dua sisi
                    mat.emissiveTexture = mat.diffuseTexture; // biar terang tanpa pengaruh cahaya

                    // optional: rotasi supaya tegak (facing camera)
                    newObject.rotation.y = Math.PI; // atau sesuaikan sesuai scene
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

/* save scene state not Panel Edit */
document.getElementById("saveSceneBtn").addEventListener("click", () => {
    const sensorsData = [];
    console.log("Save Panel Edit Btn");

    scene.meshes.forEach(mesh => {
        if (mesh.type === "wall" || mesh.type === "cctv" || mesh.type === "zone") {
            mesh.computeWorldMatrix(true); // pastikan transform up-to-date

            // ambil rotasi sebagai quaternion
            let q;
            if (mesh.rotationQuaternion) {
                q = mesh.rotationQuaternion.clone();
            } else {
                q = BABYLON.Quaternion.FromEulerVector(mesh.rotation);
            }

            const sensorObj = {
                id: mesh.id,
                type: mesh.type,
                position: {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z
                },
                scaling: {
                    x: 1,
                    y: 1,
                    z: 1
                }
            };

            // khusus wall → simpan dimensions final & tandai scaling diabaikan
            if (mesh.type === "wall") {
                const { min, max } = mesh.getHierarchyBoundingVectors();
                const dimensions = max.subtract(min);

                sensorObj.dimensions = {
                    width: dimensions.x,
                    height: dimensions.y,
                    depth: dimensions.z
                };

                sensorObj.ignoreScaling = true; // supaya saat load tidak double-scale
            }

            sensorsData.push(sensorObj);
        }
    });

    console.log("Saving sensors btn SaveScene :", sensorsData);
    statusBar('Saving sensors data...');

    fetch("/save_edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorsData)  // <-- simpan array sensor
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
    createSkybox(scene, 'default_pbr'); // ganti dengan skybox dinamis
    loadModel(scene, camera);
    addSensorIcons(scene);
    registerPointerEvents(scene, camera);
        // panggil realtime visitor BLE AoA
    initRealtimeVisitors(scene);
    return scene;
}

//end create scene function