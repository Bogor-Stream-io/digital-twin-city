const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
let scene, camera;
let gizmoManager;
let currentPanelPlacement = false;

function statusBar(msg) {
    document.getElementById('status').innerText = msg;
}

// Fungsi untuk memperbarui status UI tombol dan teks
function updateControlStatus(mesh) {
    const moveBtn = document.getElementById('moveBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const resizeBtn = document.getElementById('resizeBtn');
    const selectedObjectName = document.getElementById('selectedObjectName');

    if (mesh) {
        selectedObjectName.innerText = `Selected: ${mesh.name}`;
        moveBtn.disabled = false;
        rotateBtn.disabled = false;
        resizeBtn.disabled = false;
        gizmoManager.positionGizmoEnabled = true;
        gizmoManager.rotationGizmoEnabled = false;
        gizmoManager.scaleGizmoEnabled = false;
        gizmoManager.attachToMesh(mesh);
    } else {
        selectedObjectName.innerText = 'No object selected';
        moveBtn.disabled = true;
        rotateBtn.disabled = true;
        resizeBtn.disabled = true;
        gizmoManager.attachToMesh(null);
        gizmoManager.positionGizmoEnabled = false;
        gizmoManager.rotationGizmoEnabled = false;
        gizmoManager.scaleGizmoEnabled = false;
    }
}

function showInfo(object) {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;

    const content = infoPanel.querySelector('#infoContent');
    let html = `<p><b>Name:</b> ${object.name || 'N/A'}</p>`;
    html += `<p><b>Type:</b> ${object.type || 'N/A'}</p>`;
    
    if (object.api) {
        html += `<p><b>API:</b> ${object.api}</p>`;
    }

    content.innerHTML = html;
    infoPanel.classList.add('active');
}

/**
 * Fungsi untuk memperbaiki scene:
 * 1. Membuat ground plane dengan tekstur.
 * 2. Memastikan model yang di-load menempel pada ground.
 * 3. Menambahkan action manager ke mesh agar dapat dipilih.
 */
function fix_scene(scene) {
    // 1. Membuat ground plane dengan tekstur
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100, subdivisions: 2 }, scene);
    ground.material = new BABYLON.StandardMaterial('groundMat', scene);
    ground.material.diffuseTexture = new BABYLON.Texture('/static/assets/pattern/tanahmerah.jpg', scene);
    ground.material.diffuseTexture.uScale = 10;
    ground.material.diffuseTexture.vScale = 10;
    ground.receiveShadows = true;

    // 2. Menyesuaikan posisi model setelah di-load
    // Gunakan onNewMeshAddedObservable untuk melacak mesh baru
    scene.onNewMeshAddedObservable.add((newMesh) => {
        if (newMesh.name.includes("Gizmo") || newMesh.name === "ground") {
            return;
        }

        // Dapatkan mesh utama dari scene (biasanya root mesh)
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

const createScene = () => {
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 50, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

    gizmoManager = new BABYLON.GizmoManager(scene);
    gizmoManager.useUtilityLayer = false;
    gizmoManager.attachToMesh(null);

    fix_scene(scene);

    const MODEL_URL = 'static/assets/city.glb';
    statusBar('Loading model from local assets …');
    BABYLON.SceneLoader.Append('', MODEL_URL, scene, (scene) => {
        statusBar('Building model loaded');
        
        // Cek jika ada mesh root setelah loading selesai
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

    const sensorIcons = [
        { id: 'gate', position: new BABYLON.Vector3(0, 0, 0), type: 'gate' },
        { id: 'building', position: new BABYLON.Vector3(10, 0, 0), type: 'cctv' },
        { id: 'lab', position: new BABYLON.Vector3(-10, 0, 0), type: 'webcam' }
    ];

    sensorIcons.forEach(sensor => {
        const sphere = BABYLON.MeshBuilder.CreateSphere(sensor.id, { diameter: 1 }, scene);
        sphere.position = sensor.position;
        sphere.type = sensor.type;
        sphere.actionManager = new BABYLON.ActionManager(scene);
        sphere.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
            updateControlStatus(sphere);
            showInfo(sphere);
        }));
    });

    scene.onPointerDown = (evt) => {
        if (currentPanelPlacement) {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                const panelType = document.getElementById('panelType').value;
                const panelName = document.getElementById('panelName').value || `${panelType}__${Date.now()}`;
                const apiInput = document.getElementById('apiInput').value || 'N/A';
                
                let newObject;
                if (panelType === 'building') {
                    newObject = BABYLON.MeshBuilder.CreateBox(panelName, { size: 2 }, scene);
                } else if (panelType === 'sensor') {
                    newObject = BABYLON.MeshBuilder.CreateSphere(panelName, { diameter: 1 }, scene);
                }
                
                if (newObject) {
                    newObject.position.x = pickResult.pickedPoint.x;
                    newObject.position.z = pickResult.pickedPoint.z;
                    
                    const boundingBox = newObject.getBoundingInfo().boundingBox;
                    newObject.position.y = -boundingBox.minimumWorld.y;

                    newObject.type = panelType;
                    newObject.api = apiInput;
                    
                    newObject.actionManager = new BABYLON.ActionManager(scene);
                    newObject.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                        updateControlStatus(newObject);
                        showInfo(newObject);
                    }));
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

    return scene;
};

//end create scene function
// Event listener untuk tombol Add Panel dan form
document.getElementById('addPanelBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'flex';
    currentPanelPlacement = true;
    statusBar('Click on the scene to place the new object.');
    camera.detachControl(canvas);
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'none';
    currentPanelPlacement = false;
    camera.attachControl(canvas, true);
});

document.getElementById('placeBtn').addEventListener('click', () => {
    document.getElementById('formPanel').style.display = 'none';
});
// Function to create and place a new sensor icon
function showInfo(sensor) {
    const panel = document.getElementById('infoPanel');
    const content = document.getElementById('infoContent');
    let html = `<p><b>Sensor ID:</b> ${sensor.id}</p><p><b>Type:</b> ${sensor.type}</p>`;
    if (sensor.type === 'cctv' || sensor.type === 'webcam') {
        html += `<img src="static/assets/cctv.png" alt="${sensor.type}" class="mt-2 rounded">`;
    }
    content.innerHTML = html;
    panel.classList.add('active');
}

function focusLocation(id) {
    const mesh = scene.getMeshByName(id);
    if (mesh) {
        BABYLON.Animation.CreateAndStartAnimation(
            'cameraFocusAnimation',
            camera,
            'target',
            30,
            60,
            camera.target,
            mesh.position,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.SineEase()
        );
    }
}


scene = createScene();
//even add panel button 


// Event listener untuk tombol kontrol objek
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

// Event listener untuk tombol view kamera
document.getElementById('topViewBtn').addEventListener('click', () => {
    const radius = camera.radius;
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, 0.01, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});
document.getElementById('bottomViewBtn').addEventListener('click', () => {
    const radius = camera.radius;
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});
document.getElementById('leftViewBtn').addEventListener('click', () => {
    const radius = camera.radius;
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, 0, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});
document.getElementById('rightViewBtn').addEventListener('click', () => {
    const radius = camera.radius;
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, Math.PI, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});
document.getElementById('perspectiveViewBtn').addEventListener('click', () => {
    camera.setTarget(BABYLON.Vector3.Zero());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'alpha', 30, 60, camera.alpha, -Math.PI / 2, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
    BABYLON.Animation.CreateAndStartAnimation('cameraMove', camera, 'beta', 30, 60, camera.beta, Math.PI / 2.5, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, new BABYLON.SineEase());
});


engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());