function getTerrainY(ground, x, z, offset = 0.08) {

    if (typeof ground.getHeightAtCoordinates === "function") {
        return ground.getHeightAtCoordinates(x, z) + offset;
    }

    return offset;
}

function createTerrainStrip(scene, ground, name, points, width, material, yOffset = 0.08) {

    const leftPath = [];
    const rightPath = [];

    for (let i = 0; i < points.length; i++) {

        const current = points[i];

        const previous = points[i - 1] || current;
        const next = points[i + 1] || current;

        const direction = next.subtract(previous);
        direction.y = 0;
        direction.normalize();

        const side = new BABYLON.Vector3(
            -direction.z,
            0,
            direction.x
        );

        const left = current.add(side.scale(width / 2));
        const right = current.add(side.scale(-width / 2));

        left.y = getTerrainY(ground, left.x, left.z, yOffset);
        right.y = getTerrainY(ground, right.x, right.z, yOffset);

        leftPath.push(left);
        rightPath.push(right);
    }

    const strip = BABYLON.MeshBuilder.CreateRibbon(
        name,
        {
            pathArray: [
                leftPath,
                rightPath
            ],
            closeArray: false,
            closePath: false,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        },
        scene
    );

    strip.material = material;
    strip.isPickable = false;
    strip.checkCollisions = false;

    return strip;
}

export function createRoadPath(scene, ground) {

    const roadMat = new BABYLON.StandardMaterial(
        "roadMat",
        scene
    );

    roadMat.diffuseColor = new BABYLON.Color3(
        0.32,
        0.24,
        0.15
    );

    roadMat.specularColor = new BABYLON.Color3(
        0,
        0,
        0
    );

    const roadPoints = [
        new BABYLON.Vector3(-230, 0, -120),
        new BABYLON.Vector3(-160, 0, -80),
        new BABYLON.Vector3(-80, 0, -30),
        new BABYLON.Vector3(0, 0, -10),
        new BABYLON.Vector3(80, 0, 20),
        new BABYLON.Vector3(160, 0, 60),
        new BABYLON.Vector3(230, 0, 100)
    ];

    return createTerrainStrip(
        scene,
        ground,
        "road_path",
        roadPoints,
        12,
        roadMat,
        0.12
    );
}

export function createRiverPath(scene, ground) {

    const riverMat = new BABYLON.StandardMaterial(
        "riverMat",
        scene
    );

    riverMat.diffuseColor = new BABYLON.Color3(
        0.05,
        0.25,
        0.55
    );

    riverMat.emissiveColor = new BABYLON.Color3(
        0.01,
        0.06,
        0.12
    );

    riverMat.alpha = 0.75;

    const riverPoints = [
        new BABYLON.Vector3(-220, 0, 160),
        new BABYLON.Vector3(-140, 0, 120),
        new BABYLON.Vector3(-60, 0, 130),
        new BABYLON.Vector3(20, 0, 90),
        new BABYLON.Vector3(90, 0, 110),
        new BABYLON.Vector3(170, 0, 70),
        new BABYLON.Vector3(230, 0, 40)
    ];

    return createTerrainStrip(
        scene,
        ground,
        "river_path",
        riverPoints,
        18,
        riverMat,
        0.06
    );
}