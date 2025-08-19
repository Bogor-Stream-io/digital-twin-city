const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
let scene, camera;
let gizmoManager;
let currentPanelPlacement = false;
let isPanningModeActive = false;

// Inisialisasi scene
scene = createScene();

// Render loop
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
