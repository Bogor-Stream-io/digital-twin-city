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