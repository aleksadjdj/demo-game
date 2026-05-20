export function createGiantSkyCube(scene) {

    const cube = BABYLON.MeshBuilder.CreateBox(
        "giant_sky_cube",
        {
            size: 28
        },
        scene
    );

    // position in the sky
    cube.position = new BABYLON.Vector3(25, 25, 0);

    cube.rotation.x = Math.random() * Math.PI * 2;
    cube.rotation.y = Math.random() * Math.PI * 2;
    cube.rotation.z = Math.random() * Math.PI * 2;

    cube.isPickable = false;
    cube.checkCollisions = false;
    cube.receiveShadows = false;

    const mat = new BABYLON.StandardMaterial(
        "giantSkyCubeMat",
        scene
    );

    mat.diffuseTexture = new BABYLON.Texture(
        "./assets/textures/aca.jpg",
        scene
    );

    mat.specularColor = new BABYLON.Color3(0, 0, 0);

    // make it visible even in darker light
    mat.emissiveColor = new BABYLON.Color3(0.35, 0.35, 0.35);

    cube.material = mat;

    const rotationSpeed = new BABYLON.Vector3(
        0.08,
        0.05,
        0.035
    );

    scene.onBeforeRenderObservable.add(() => {

        if (!cube || cube.isDisposed()) {
            return;
        }

        const deltaTime =
            scene.getEngine().getDeltaTime() / 1000;

        cube.rotation.x += rotationSpeed.x * deltaTime;
        cube.rotation.y += rotationSpeed.y * deltaTime;
        cube.rotation.z += rotationSpeed.z * deltaTime;
    });

    return cube;
}