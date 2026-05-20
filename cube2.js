const CUBE_TEXTURES = [
    "./assets/textures/cobblestone_1.png",
    "./assets/textures/dirty_1.png",
    "./assets/textures/grass_1.png",
    "./assets/textures/sand_1.png",
    "./assets/textures/aca.jpg",
];

export function createCube(scene) {

    const cubeSize = 1;

    let cubeIndex = 0;

    const textureMaterials = new Map();
    const rotatingCubes = [];

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

    function getRandomTextureMaterial() {

        if (!CUBE_TEXTURES.length) {
            return null;
        }

        const texturePath =
            CUBE_TEXTURES[
                Math.floor(Math.random() * CUBE_TEXTURES.length)
            ];

        if (textureMaterials.has(texturePath)) {
            return textureMaterials.get(texturePath);
        }

        const mat = new BABYLON.StandardMaterial(
            `mat_${texturePath}`,
            scene
        );

        mat.diffuseTexture =
            new BABYLON.Texture(texturePath, scene);

        mat.specularColor =
            new BABYLON.Color3(0, 0, 0);

        textureMaterials.set(texturePath, mat);

        return mat;
    }

    function getRandomRotationSpeed() {

        const minSpeed = 0.05;
        const maxSpeed = 0.25;

        function randomAxisSpeed() {

            const speed =
                minSpeed + Math.random() * (maxSpeed - minSpeed);

            return Math.random() > 0.5
                ? speed
                : -speed;
        }

        return new BABYLON.Vector3(
            randomAxisSpeed(),
            randomAxisSpeed(),
            randomAxisSpeed()
        );
    }

    function createSingleCube(position) {

        const cube = BABYLON.MeshBuilder.CreateBox(
            `cube_${cubeIndex}`,
            { size: cubeSize },
            scene
        );

        cube.isPickable = true;

        cube.position.x = position.x;
        cube.position.y = position.y + cubeSize / 2;
        cube.position.z = position.z;

        cube.rotation.x = Math.random() * Math.PI * 2;
        cube.rotation.y = Math.random() * Math.PI * 2;
        cube.rotation.z = Math.random() * Math.PI * 2;

        cube.metadata = cube.metadata || {};
        cube.metadata.rotationSpeed = getRandomRotationSpeed();

        const randomTextureMat = getRandomTextureMaterial();

        const baseMaterial =
            randomTextureMat ||
            (
                cubeIndex % 2 === 0
                    ? whiteMat
                    : blackMat
            );

        cube.material = baseMaterial;

        rotatingCubes.push(cube);

        cubeIndex++;

        return cube;
    }

    scene.onBeforeRenderObservable.add(() => {

        const deltaTime =
            scene.getEngine().getDeltaTime() / 1000;

        rotatingCubes.forEach((cube) => {

            if (!cube || cube.isDisposed()) {
                return;
            }

            const rotationSpeed =
                cube.metadata?.rotationSpeed;

            if (!rotationSpeed) {
                return;
            }

            cube.rotation.x += rotationSpeed.x * deltaTime;
            cube.rotation.y += rotationSpeed.y * deltaTime;
            cube.rotation.z += rotationSpeed.z * deltaTime;
        });
    });

    scene.onPointerObservable.add((pointerInfo) => {

        if (
            pointerInfo.type !== BABYLON.PointerEventTypes.POINTERPICK
        ) {
            return;
        }

        if (
            pointerInfo.event.button !== 0
        ) {
            return;
        }

        if (
            !pointerInfo.pickInfo ||
            !pointerInfo.pickInfo.hit ||
            !pointerInfo.pickInfo.pickedPoint
        ) {
            return;
        }

        createSingleCube(pointerInfo.pickInfo.pickedPoint);
    });
}