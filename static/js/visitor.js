function initRealtimeVisitors(scene) {
    const visitors = {}; // simpan visitor mesh berdasarkan id

    // === Skala area 2 hektar ===
    const areaWidth = 200;   // meter (sumbu X)
    const areaLength = 100;  // meter (sumbu Z)

    // Material untuk avatar visitor
    const visitorMaterial = new BABYLON.StandardMaterial("visitorMat", scene);
    visitorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.7, 1);
    visitorMaterial.alpha = 0.9;

    // Definisi subzona berdasarkan sektor (misalnya 4 sektor: kiri/kanan depan/belakang)
    const sectors = [
        { name: "A", xRange: [-areaWidth/2, 0], zRange: [-areaLength/2, 0] },
        { name: "B", xRange: [0, areaWidth/2],  zRange: [-areaLength/2, 0] },
        { name: "C", xRange: [-areaWidth/2, 0], zRange: [0, areaLength/2] },
        { name: "D", xRange: [0, areaWidth/2],  zRange: [0, areaLength/2] }
    ];

    // Visitor class
    class Visitor {
        constructor(id, x, z, sector) {
            this.id = id;
            this.sector = sector;

            // Visitor lebih kecil
            this.mesh = BABYLON.MeshBuilder.CreateCylinder(`visitor_${id}`, {
                diameter: 0.4,
                height: 1.6
            }, scene);
            this.mesh.material = visitorMaterial;
            this.mesh.position = new BABYLON.Vector3(x, 0.8, z);

            this.speed = 1.2 + Math.random() * 0.6; // 1.2–1.8 m/s
            this.target = this.getRandomTarget();
        }

        getRandomTarget() {
            // Target hanya di dalam sektor masing-masing
            const tx = this.sector.xRange[0] + Math.random() * (this.sector.xRange[1] - this.sector.xRange[0]);
            const tz = this.sector.zRange[0] + Math.random() * (this.sector.zRange[1] - this.sector.zRange[0]);
            return new BABYLON.Vector3(tx, 0.8, tz);
        }

        update(deltaTime) {
            const dir = this.target.subtract(this.mesh.position);
            const dist = dir.length();

            if (dist < 0.5) {
                // ganti target baru dalam subzona sektor
                this.target = this.getRandomTarget();
                return;
            }

            const move = this.speed * deltaTime;
            const step = dir.normalize().scale(move);
            if (step.length() > dist) {
                this.mesh.position = this.target;
            } else {
                this.mesh.position.addInPlace(step);
            }
        }
    }

    // === Buat 50 visitor dengan pembagian sektor AoA ===
    for (let i = 0; i < 50; i++) {
        const sector = sectors[i % sectors.length]; // round-robin per sektor
        const x = sector.xRange[0] + Math.random() * (sector.xRange[1] - sector.xRange[0]);
        const z = sector.zRange[0] + Math.random() * (sector.zRange[1] - sector.zRange[0]);
        visitors[`visitor${i+1}`] = new Visitor(`visitor${i+1}`, x, z, sector);
    }

    // Update realtime per frame
    let lastTime = performance.now();
    scene.registerBeforeRender(() => {
        const now = performance.now();
        const deltaTime = (now - lastTime) / 1000; // detik
        lastTime = now;

        for (const id in visitors) {
            visitors[id].update(deltaTime);
        }
    });
}
