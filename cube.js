export function createCubeLine(scene) {

    const whiteMat = new BABYLON.StandardMaterial(
        "whiteMat",
        scene
    );

    whiteMat.diffuseColor = new BABYLON.Color3(1, 1, 1);

    const blackMat = new BABYLON.StandardMaterial(
        "blackMat",
        scene
    );

    blackMat.diffuseColor =  new BABYLON.Color3(0, 0, 0);

    const redMat = new BABYLON.StandardMaterial(
    "redMat",
        scene
    );

    redMat.diffuseColor = new BABYLON.Color3(1, 0, 0);

    const wallGroundY = 0.13;

    for (let i = 0; i < 50; i++) {

        for (let j = 0; j < 10; j++) {

            const cube = BABYLON.MeshBuilder.CreateBox(
                `cube_${i}_${j}`,
                { size: 1 },
                scene
            );

            cube.isPickable = true;

            // 1 meter spacing on X
            cube.position.x = i;

            // stack cubes vertically up to 10m
            cube.position.y = wallGroundY + j + 0.5;

            // keep Z in same line
            cube.position.z = 0;

            // every 10th vertical cube column is red
            if (i % 10 === 0) {
                cube.material = redMat;
            } else {
                cube.material =
                    (i + j) % 2 === 0
                        ? whiteMat
                        : blackMat;
            }
        }
    }
}