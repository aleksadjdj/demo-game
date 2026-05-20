import { natureModels } from "./modelsManifest.js";

function getTerrainY(ground, position, yOffset = 0) {

    let y = position.y;

    if (
        ground &&
        typeof ground.getHeightAtCoordinates === "function"
    ) {
        y = ground.getHeightAtCoordinates(
            position.x,
            position.z
        );
    }

    return y + yOffset;
}

async function loadSingleNatureModel(scene, ground, modelConfig, position) {

    try {

        console.log("Loading model:", modelConfig.name);

        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            modelConfig.rootUrl,
            modelConfig.fileName,
            scene
        );

        const root = result.meshes[0];

        if (!root) {
            console.error(`${modelConfig.name} has no root mesh.`);
            return null;
        }

        const y = getTerrainY(
            ground,
            position,
            modelConfig.yOffset || 0
        );

        root.position = new BABYLON.Vector3(
            position.x,
            y,
            position.z
        );

        const scale = modelConfig.scale || 1;

        root.scaling = new BABYLON.Vector3(
            scale,
            scale,
            scale
        );

        root.rotation.y = modelConfig.rotationY || 0;

        result.meshes.forEach((mesh) => {
            mesh.isPickable = true;
            mesh.checkCollisions = modelConfig.collisions || false;
            mesh.showBoundingBox = modelConfig.showBoundingBox || false;
            mesh.setEnabled(true);
        });

        console.log("Loaded and placed model:", modelConfig.name, {
            file: modelConfig.fileName,
            position: root.position,
            scale: root.scaling,
            meshCount: result.meshes.length
        });

        return root;

    } catch (error) {

        console.error("Failed to load model:", modelConfig.name, error);
        return null;
    }
}

export async function loadAllNatureModels(scene, ground) {

    const loadedModels = [];

    const startX = 10;
    const startZ = 10;
    const spacing = 8;

    for (let i = 0; i < natureModels.length; i++) {

        const modelConfig = natureModels[i];

        const x = startX + i * spacing;
        const z = startZ;

        const model = await loadSingleNatureModel(
            scene,
            ground,
            modelConfig,
            new BABYLON.Vector3(x, 0, z)
        );

        if (model) {
            loadedModels.push(model);
        }
    }

    console.log("All nature models loaded:", loadedModels.length);

    return loadedModels;
}

export async function loadCommonTreeOnly(scene, ground) {

    const modelConfig = {
        name: "CommonTree_1",
        rootUrl: "./assets/nature_models/",
        fileName: "CommonTree_1.gltf",
        scale: 10,
        yOffset: 1,
        rotationY: 0,
        collisions: false,
        showBoundingBox: false
    };

    const root = await loadSingleNatureModel(
        scene,
        ground,
        modelConfig,
        new BABYLON.Vector3(10, 0, 10)
    );

    if (!root) {
        return null;
    }

    const marker = BABYLON.MeshBuilder.CreateBox(
        "tree_debug_marker",
        { size: 2 },
        scene
    );

    marker.position = new BABYLON.Vector3(
        root.position.x + 3,
        root.position.y + 1,
        root.position.z
    );

    const markerMat = new BABYLON.StandardMaterial(
        "treeDebugMarkerMat",
        scene
    );

    markerMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    marker.material = markerMat;

    return root;
}