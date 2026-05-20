import { ASSET_MANIFEST } from "./assetsManifest.js";

function timeoutPromise(label, ms = 15000) {

    return new Promise((_, reject) => {

        setTimeout(() => {
            reject(new Error(`Asset timeout: ${label}`));
        }, ms);
    });
}

function loadTexture(scene, textureUrl) {

    const loadPromise = new Promise((resolve, reject) => {

        console.log("Loading texture:", textureUrl);

        const texture = new BABYLON.Texture(
            textureUrl,
            scene,
            false,
            false,
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            () => {
                console.log("Loaded texture:", textureUrl);
                resolve(texture);
            },
            (message, exception) => {
                console.error("Texture failed:", textureUrl, message, exception);
                reject(new Error(`Texture failed: ${textureUrl}`));
            }
        );
    });

    return Promise.race([
        loadPromise,
        timeoutPromise(textureUrl)
    ]);
}

async function loadModel(scene, modelData) {

    const label = `${modelData.rootUrl}${modelData.fileName}`;

    console.log("Loading model:", label);

    const loadPromise =
        BABYLON.SceneLoader.LoadAssetContainerAsync(
            modelData.rootUrl,
            modelData.fileName,
            scene
        );

    const container = await Promise.race([
        loadPromise,
        timeoutPromise(label, 30000)
    ]);

    console.log("Loaded model:", modelData.name);

    return container;
}

export async function preloadAssets(scene) {

    const assets = {
        textures: {},
        models: {}
    };

    const textureResults = await Promise.allSettled(
        ASSET_MANIFEST.textures.map(async (textureUrl) => {

            const texture = await loadTexture(scene, textureUrl);

            assets.textures[textureUrl] = texture;
        })
    );

    textureResults.forEach((result) => {
        if (result.status === "rejected") {
            console.warn("Texture preload skipped:", result.reason);
        }
    });

    const modelResults = await Promise.allSettled(
        ASSET_MANIFEST.models.map(async (modelData) => {

            const container = await loadModel(scene, modelData);

            assets.models[modelData.name] = container;
        })
    );

    modelResults.forEach((result) => {
        if (result.status === "rejected") {
            console.warn("Model preload skipped:", result.reason);
        }
    });

    console.log("PRELOAD COMPLETE:", assets);

    return assets;
}