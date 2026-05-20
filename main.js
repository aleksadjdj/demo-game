import { preloadAssets } from "./preloadAssets.js";
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
import { KeyHoldTimerDebug } from "./ui/keyHoldTimerDebug.js";

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas, true, {
    stencil: true
});

const createScene = async () => {

    const scene = new BABYLON.Scene(engine);

    console.log("01 scene created");

    engine.displayLoadingUI();

    try {

        console.log("02 preload start");
        const assets = await preloadAssets(scene);
        console.log("03 preload complete", assets);

        console.log("04 light start");
        createSunLight(scene);
        console.log("05 light complete");

        console.log("06 terrain start");
        const ground = createTerrain(scene);
        console.log("07 terrain complete", ground);

        console.log("08 models start");
        await loadAllNatureModels(scene, ground, assets);
        console.log("09 all nature models complete");

        await loadCommonTreeOnly(scene, ground, assets);
        console.log("10 common tree complete");

        console.log("11 player start");
        const playerController = new PlayerController(scene, {
            groundMeshes: [ground],
            speed: 8.33,
            turnSpeed: 2.5,
            gravity: -20,
            jumpPower: 6.3
        });
        console.log("12 player complete");

        console.log("13 cubes start");
        createCubeLine(scene);
        createCube(scene);
        console.log("14 cubes complete");

        console.log("15 camera start");
        const camera = createWowCamera(
            scene,
            canvas,
            playerController.mesh
        );

        playerController.setCamera(camera);
        console.log("16 camera complete");

        createDebugSceneStats(scene, camera, {
            axisSize: 8,
            axisPosition: new BABYLON.Vector3(0, 3, 0),
            updateEveryMs: 500
        });

        createDebugHoverGlow(scene);
        createDebugHoverBrightness(scene);

        new KeyHoldTimerDebug(scene);

        scene.collisionsEnabled = true;
        camera.checkCollisions = false;

        console.log("17 scene ready");

        return scene;

    } catch (error) {

        console.error("SCENE LOAD FAILED:", error);

        return scene;

    } finally {

        console.log("18 hiding loading UI");

        engine.hideLoadingUI();

        const loadingDiv = document.getElementById("babylonjsLoadingDiv");

        if (loadingDiv) {
            loadingDiv.remove();
        }

        document.body.classList.remove("loading");
    }
};


createScene()
    .then((scene) => {

        console.log("19 render loop start");

        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener("resize", () => {
            engine.resize();
        });
    })
    .catch((error) => {
        console.error("FATAL MAIN ERROR:", error);
        engine.hideLoadingUI();
    });