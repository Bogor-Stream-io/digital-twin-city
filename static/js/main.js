const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
// variabel cctv 

// Elements
const cctvModal = document.getElementById("cctvModal");
const cctvBackdrop = document.getElementById("cctvBackdrop");
const cctvContainer = document.getElementById("cctvContainer");
const cctvIframe = document.getElementById("cctvIframe");
const cctvTitle = document.getElementById("cctvTitle");
const cctvCloseBtn = document.getElementById("cctvCloseBtn");
const cctvFullscreenBtn = document.getElementById("cctvFullscreenBtn");

let currentCCTVUrl = null;
let isElementFullscreen = false;

// Open modal with given URL and optional title
function openCCTVModal(url, title = "CCTV View") {
  if (!url) return console.warn("No CCTV URL provided");
  currentCCTVUrl = url;
  cctvTitle.textContent = title;
  // Use src only when opening to avoid autoplay policies until needed
  cctvIframe.src = url;

  cctvModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // lock scroll
}

// Close modal
function closeCCTVModal() {
  cctvModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // restore scroll
  // remove src to stop stream
  cctvIframe.src = "";
  currentCCTVUrl = null;
  exitElementFullscreenIfNeeded();
}

// Toggle fullscreen using Fullscreen API on the container
async function toggleCCTVFullscreen() {
  try {
    if (!isElementFullscreen) {
      if (cctvContainer.requestFullscreen) {
        await cctvContainer.requestFullscreen();
      } else if (cctvContainer.webkitRequestFullscreen) {
        await cctvContainer.webkitRequestFullscreen();
      }
      isElementFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
      isElementFullscreen = false;
    }
  } catch (err) {
    console.warn("Fullscreen toggle failed:", err);
  }
}

function exitElementFullscreenIfNeeded() {
  if (isElementFullscreen) {
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    isElementFullscreen = false;
  }
}

// Close on backdrop or close button
cctvBackdrop.addEventListener("click", closeCCTVModal);
cctvCloseBtn.addEventListener("click", closeCCTVModal);
cctvFullscreenBtn.addEventListener("click", toggleCCTVFullscreen);

// keyboard: Esc to close, F to toggle fullscreen
document.addEventListener("keydown", (ev) => {
  if (cctvModal.getAttribute("aria-hidden") === "false") {
    if (ev.key === "Escape") closeCCTVModal();
    if (ev.key.toLowerCase() === "f") toggleCCTVFullscreen();
  }
});

// Optional: keep track of fullscreen changes (to update UI if needed)
document.addEventListener("fullscreenchange", () => {
  isElementFullscreen = !!document.fullscreenElement;
});

// Helper: create a button element to be inserted in your UI
function createCCTVButton(url, title = "CCTV") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cctv-open-btn"; // style as you wish
  btn.textContent = title;
  btn.addEventListener("click", () => openCCTVModal(url, title));
  return btn;
}

//end cdtv
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
