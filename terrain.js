import { createRoadPath, createRiverPath } from "./terrainFeatures.js";
import { smoothTerrainMesh } from "./terrainSmooth.js";
import { createTerrainWireframe } from "./terrainWireframe.js";

export function createTerrain(scene) {

    const terrainSubdivisions = 128;
    
    let ground = null;


    ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
        "terrain",
        "./assets/maps/Heightmap_02_Hills.png",
        {
            width: 500,
            height: 500,
            subdivisions: 100,
            minHeight: 0,
            maxHeight: 0,
             onReady: () => {
                // createRoadPath(scene, ground);
                // createRiverPath(scene, ground);
                // smoothTerrainMesh(ground, terrainSubdivisions, 8, 0.65);
                createTerrainWireframe(scene, ground);
             }
        },
        scene
    );

    const groundMat = new BABYLON.StandardMaterial(
        "groundMat",
        scene
    );

    groundMat.diffuseTexture = new BABYLON.Texture(
        "./assets/maps/grass.png",
        scene
    );

    groundMat.diffuseTexture.uScale = 50;
    groundMat.diffuseTexture.vScale = 50;

    // Remove intense white highlight from sun
    groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
    groundMat.specularPower = 0;

    // Optional: make grass less overexposed
    groundMat.diffuseColor = new BABYLON.Color3(0.75, 0.75, 0.75);

    ground.material = groundMat;
    ground.checkCollisions = true;
    ground.isPickable = true;

    return ground;
}