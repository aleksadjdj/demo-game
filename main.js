
import { createDebugUI } from "./ui/debugUI.js";
import { createDebugMouseLaser, createDebugHoverGlow, createDebugHoverBrightness } from "./ui/debugMouse.js";
import { createDebugSceneStats } from "./ui/debugSceneStats.js";
import { createWowCamera } from "./camera.js";
import { createCubeLine } from "./cube.js";
import { createCube } from "./cube2.js";
import { createTerrain } from "./terrain.js";
import { loadCommonTreeOnly, loadAllNatureModels   } from "./modelLoader.js";
import { PlayerController } from "./player.js";
import { createSunLight } from "./sunLight.js";

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas, true, {
    stencil: true
});

const createScene = () => {

    const scene = new BABYLON.Scene(engine);

    // =========================================
    // LIGHT
    // =========================================

    // createSunLight(scene, {
    //     forceHour: 12
    // });

    createSunLight(scene);

    // =========================================
    // TERRAIN
    // =========================================
    const ground = createTerrain(scene);

    // =========================================
    // LOAD ALL NATURE MODELS
    // =========================================
    loadAllNatureModels(scene, ground);
    loadCommonTreeOnly(scene, ground);

    // =========================================
    // PLAYER
    // =========================================
    const playerController = new PlayerController(scene);

    // =========================================
    // CUBES
    // =========================================
    createCubeLine(scene);
    createCube(scene);

    // =========================================
    // CAMERA
    // =========================================
    const camera = createWowCamera(scene, canvas, playerController.mesh);

    playerController.setCamera(camera);

    createDebugSceneStats(scene, camera, {
        axisSize: 8,
        axisPosition: new BABYLON.Vector3(0, 3, 0),
        updateEveryMs: 500
    });

    
    // =========================================
    // DEBUG MOUSE UI
    // =========================================
    // createDebugUI(engine, scene);



    // =========================================
    // DEBUG MOUSE LASER
    // =========================================
    // createDebugMouseLaser(scene, camera);
    createDebugHoverGlow(scene);
    createDebugHoverBrightness(scene);

    // =========================================wa
    // COLLISIONS
    // =========================================
    scene.collisionsEnabled = false;
    camera.checkCollisions = false;
    
    return scene;
};




const scene = createScene();



engine.runRenderLoop(() => { scene.render(); });
window.addEventListener("resize", () => { engine.resize(); });