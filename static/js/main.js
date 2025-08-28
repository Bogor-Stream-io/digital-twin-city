const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
let scene, camera;
let gizmoManager;
let currentPanelPlacement = false;
let isPanningModeActive = false;

// Inisialisasi scene
scene = createScene();
    // Variabel global mesh terpilih
let selectedMesh = null;

    // Klik mesh -> set selectedMesh
scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
            const pickedMesh = pointerInfo.pickInfo.pickedMesh;
            if (pickedMesh) {
                selectedMesh = pickedMesh;
                console.log("Mesh dipilih:", selectedMesh.name);
            }
        }
    });
// glow halus
const glowLayer = new BABYLON.GlowLayer("glow", scene);
glowLayer.intensity = 0.7;

// highlight border
const hl = new BABYLON.HighlightLayer("hl1", scene);

// Render loop
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
