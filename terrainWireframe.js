export function createTerrainWireframe(scene, ground) {

    const wire = ground.clone("terrain_wireframe");

    wire.position.y += 0.08;
    wire.isPickable = false;
    wire.checkCollisions = false;

    const wireMat = new BABYLON.StandardMaterial(
        "terrainWireframeMat",
        scene
    );

    wireMat.wireframe = true;
    wireMat.disableLighting = true;
    wireMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
    wireMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
    wireMat.alpha = 0.45;
    wireMat.backFaceCulling = false;

    wire.material = wireMat;

    return wire;
}