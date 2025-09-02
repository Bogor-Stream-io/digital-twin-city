function updateControlStatus(mesh, mode = null) {
    const moveBtn = document.getElementById('moveBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const resizeBtn = document.getElementById('resizeBtn');
    const selectedObjectName = document.getElementById('selectedObjectName');

    if (mesh) {
        // Tampilkan nama object yang dipilih
        selectedObjectName.innerText = `Selected: ${mesh.name}`;

        // Enable tombol kontrol
        moveBtn.disabled = false;
        rotateBtn.disabled = false;
        resizeBtn.disabled = false;

        // Reset gizmo default
        gizmoManager.attachToMesh(mesh);
        gizmoManager.positionGizmoEnabled = false;
        gizmoManager.rotationGizmoEnabled = false;
        gizmoManager.scaleGizmoEnabled = false;

        // Set mode aktif berdasarkan parameter
        if (mode === 'move') {
            gizmoManager.positionGizmoEnabled = true;
            selectedObjectName.innerText = `Selected: ${mesh.name} | Mode: Move`;
        } else if (mode === 'rotate') {
            gizmoManager.rotationGizmoEnabled = true;
            selectedObjectName.innerText = `Selected: ${mesh.name} | Mode: Rotate`;
        } else if (mode === 'resize') {
            gizmoManager.scaleGizmoEnabled = true;
            selectedObjectName.innerText = `Selected: ${mesh.name} | Mode: Resize`;
        }
    } else {
        // Kalau tidak ada mesh terpilih
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
