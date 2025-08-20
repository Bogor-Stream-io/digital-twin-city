function statusBar(msg) {
    document.getElementById('status').innerText = msg;
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

function focusLocation(id) {
    const mesh = scene.getMeshByName(id);
    if (mesh && camera instanceof BABYLON.ArcRotateCamera) {
        // Hitung sudut (alpha) tujuan dari posisi kamera ke mesh
        const direction = mesh.position.subtract(camera.target);
        const targetAlpha = Math.atan2(direction.x, direction.z);

        // Animasi alpha (putaran horizontal kamera)
        BABYLON.Animation.CreateAndStartAnimation(
            'cameraAlphaAnimation',
            camera,
            'alpha',
            30, // fps
            60, // durasi frame
            camera.alpha,
            targetAlpha,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.SineEase()
        );

        // Animasi target kamera supaya fokus ke mesh
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
    }
}
