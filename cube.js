export function createCubeLine(scene) {

    const whiteMat = new BABYLON.StandardMaterial(
        "whiteMat",
        scene
    );

    whiteMat.diffuseColor =
        new BABYLON.Color3(1, 1, 1);

    const blackMat = new BABYLON.StandardMaterial(
        "blackMat",
        scene
    );

    blackMat.diffuseColor =
        new BABYLON.Color3(0, 0, 0);

    for (let i = 0; i < 100; i++) {

        const cube = BABYLON.MeshBuilder.CreateBox(
            `cube_${i}`,
            { size: 1 },
            scene
        );
        
        cube.isPickable = true;

        // 1 meter spacing
        cube.position.x = i;

        // half cube height
        cube.position.y = 0.5;

        // alternating colors
        cube.material =
            i % 2 === 0
                ? whiteMat
                : blackMat;
    }
}