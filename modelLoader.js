import { natureModels } from "./modelsManifest.js";

async function loadSingleNatureModel(scene, ground, modelConfig, position) {

    try {
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

        let y = position.y;

        if (ground && typeof ground.getHeightAtCoordinates === "function") {
            y = ground.getHeightAtCoordinates(position.x, position.z);
        }

        root.position = new BABYLON.Vector3(
            position.x,
            y + (modelConfig.yOffset || 0),
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

            // turn on only while debugging
            mesh.showBoundingBox = true;
        });

        console.log("Loaded model:", modelConfig.name, {
            file: modelConfig.fileName,
            position: root.position,
            scale: root.scaling
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

    return loadedModels;
}

export async function loadCommonTreeOnly(scene, ground) {

    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "./assets/nature_models/",
            "CommonTree_1.gltf",
            scene
        );

        // console.log("CommonTree_1 raw result:", result);

        const root = result.meshes[0];

        if (!root) {
            console.error("CommonTree_1 has no meshes.");
            return null;
        }

        const x = 10;
        const z = 10;

        let y = 5;

        if (ground && typeof ground.getHeightAtCoordinates === "function") {
            y = ground.getHeightAtCoordinates(x, z) + 1;
        }

        root.position = new BABYLON.Vector3(x, y, z);

        root.scaling = new BABYLON.Vector3(
            1,
            1,
            1
        );

        result.meshes.forEach((mesh) => {
            mesh.isPickable = true;
            mesh.checkCollisions = false;
            mesh.showBoundingBox = false;
        });

        // console.log("CommonTree_1 placed at:", root.position);
        // console.log("CommonTree_1 scale:", root.scaling);

        // visible debug marker next to tree
        const marker = BABYLON.MeshBuilder.CreateBox(
            "tree_debug_marker",
            { size: 2 },
            scene
        );

        marker.position = new BABYLON.Vector3(
            x + 3,
            y + 1,
            z
        );

        const markerMat = new BABYLON.StandardMaterial(
            "treeDebugMarkerMat",
            scene
        );

        markerMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        marker.material = markerMat;

        return root;

    } catch (error) {
        console.error("CommonTree_1 load failed:", error);
        return null;
    }
}