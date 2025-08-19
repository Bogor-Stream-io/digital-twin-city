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
