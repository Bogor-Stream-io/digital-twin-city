// Koordinat Patung Pancoran (EPSG:4326 -> lon, lat)
const pancoranCoords = [106.852203, -6.244299];

// Buat Map OpenLayers
const olMap = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat(pancoranCoords),
        zoom: 18
    })
});

// --- Fungsi untuk ambil snapshot map ke canvas ---
function getMapCanvas(callback) {
    olMap.once('rendercomplete', () => {
        const mapCanvas = document.createElement('canvas');
        const size = olMap.getSize();
        mapCanvas.width = size[0];
        mapCanvas.height = size[1];
        const mapContext = mapCanvas.getContext('2d');
        Array.prototype.forEach.call(
            document.querySelectorAll('.ol-layer canvas'),
            (canvas) => {
                if (canvas.width > 0) {
                    mapContext.drawImage(canvas, 0, 0);
                }
            }
        );
        callback(mapCanvas);
    });
    olMap.renderSync();
}

// --- Fungsi buat plane dengan texture map ---
function addMapPlane(scene) {
    getMapCanvas((mapCanvas) => {
        const mapTexture = new BABYLON.DynamicTexture("mapTexture", {width: mapCanvas.width, height: mapCanvas.height}, scene, false);
        const ctx = mapTexture.getContext();

        // Gambar snapshot OL ke texture
        ctx.drawImage(mapCanvas, 0, 0, mapCanvas.width, mapCanvas.height);
        mapTexture.update();

        const mat = new BABYLON.StandardMaterial("mapMat", scene);
        mat.diffuseTexture = mapTexture;

        // Buat plane
        const plane = BABYLON.MeshBuilder.CreatePlane("mapPlane", {width: 50, height: 50}, scene);
        plane.material = mat;
        plane.rotation.x = Math.PI / 2; // biar horizontal (tanah)
        plane.position = new BABYLON.Vector3(0, 0.1, 0);

        console.log("Map plane ditambahkan di Pancoran");
    });
}

// Contoh panggil setelah scene siap
addMapPlane(scene);
