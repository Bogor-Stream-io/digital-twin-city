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
    if (isPanningModeActive) {
        camera.panningSensibility = 2000;
        statusBar('Panning mode: On');
    } else {
        camera.panningSensibility = 0;
        statusBar('Panning mode: Off');
    }
});
// hapus event sensor 
let selectedMesh = null;

function updateControlStatus(mesh) {
    selectedMesh = mesh;  // simpan mesh yang sedang dipilih
    console.log("Selected:", selectedMesh ? selectedMesh.id : "None");
}

document.getElementById("deleteSensorBtn").addEventListener("click", () => {
    deleteSensor(selectedMesh);
});
