function statusBar(msg) {
    document.getElementById('status').innerText = msg;
}

function showInfo(object) {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;

    const content = infoPanel.querySelector('#infoContent');
    let html = `<p><b>Name:</b> ${object.name || 'N/A'}</p>`;
    html += `<p><b>Type Sensor:</b> ${object.type || 'N/A'}</p>`;
    
    
    if (object.api) {
        html += `<p><b>API:</b> ${object.api}</p>`;
    }

    content.innerHTML = html;
    infoPanel.classList.add('active');
}

function focusLocation(id) {
    const mesh = scene.getMeshByName(id);
    if (mesh && camera instanceof BABYLON.ArcRotateCamera) {
        // Hitung arah sudut alpha tujuan dari posisi kamera ke mesh
        const direction = mesh.position.subtract(camera.target);
        const targetAlpha = Math.atan2(direction.x, direction.z);

        // Ambil bounding sphere dari mesh
        const boundingInfo = mesh.getBoundingInfo();
        const boundingRadius = boundingInfo.boundingSphere.radiusWorld;

        // Radius target kamera = bounding radius + margin (biar ga nembus mesh)
        const margin = 5; // jarak aman
        const targetRadius = Math.max(boundingRadius + margin, 10);

        // Atur minimal radius kamera supaya tidak bisa nembus mesh
        camera.lowerRadiusLimit = boundingRadius + margin;

        // Animasi alpha (rotasi horizontal kamera)
        BABYLON.Animation.CreateAndStartAnimation(
            'cameraAlphaAnimation',
            camera,
            'alpha',
            30,
            60,
            camera.alpha,
            targetAlpha,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.SineEase()
        );

        // Animasi target kamera fokus ke mesh
        BABYLON.Animation.CreateAndStartAnimation(
            'cameraTargetAnimation',
            camera,
            'target',
            30,
            60,
            camera.target,
            mesh.position,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.SineEase()
        );

        // Animasi radius kamera (zoom in) dengan batas aman
        BABYLON.Animation.CreateAndStartAnimation(
            'cameraRadiusAnimation',
            camera,
            'radius',
            30,
            60,
            camera.radius,
            targetRadius,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.SineEase()
        );  
    }
}
// Reset form
function resetPanellAddForm() {
    document.getElementById("panelName").value = "";
    document.getElementById("panelType").value = "wall";
    document.getElementById("apiInput").value = "";
}