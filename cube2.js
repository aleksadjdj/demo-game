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
    const hoverMaterials = new Map();

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

    function getHoverMaterial(baseMaterial) {

        if (hoverMaterials.has(baseMaterial.name)) {
            return hoverMaterials.get(baseMaterial.name);
        }

        const hoverMat = baseMaterial.clone(
            `${baseMaterial.name}_hover`
        );

        // keep original texture
        hoverMat.diffuseTexture = baseMaterial.diffuseTexture || null;

        // brighten using the same texture, not flat gray
        if (baseMaterial.diffuseTexture) {
            hoverMat.emissiveTexture = baseMaterial.diffuseTexture;
            hoverMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        } else {
            hoverMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        }

        hoverMat.specularColor = new BABYLON.Color3(0, 0, 0);

        hoverMaterials.set(baseMaterial.name, hoverMat);

        return hoverMat;
    }

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

        const randomTextureMat = getRandomTextureMaterial();

        const baseMaterial =
            randomTextureMat ||
            (
                cubeIndex % 2 === 0
                    ? whiteMat
                    : blackMat
            );

        cube.material = baseMaterial;


        cubeIndex++;

        return cube;
    }

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