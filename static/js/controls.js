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
