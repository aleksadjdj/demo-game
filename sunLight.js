export function createSunLight(scene, options = {}) {

    const config = {
        updateEveryMs: options.updateEveryMs || 60000,
        forceHour: options.forceHour ?? null
    };

    // =====================================
    // SUN LIGHT
    // =====================================

    const sunLight = new BABYLON.DirectionalLight(
        "sunLight",
        new BABYLON.Vector3(-1, -1, -1),
        scene
    );

    sunLight.position = new BABYLON.Vector3(80, 120, 80);

    // =====================================
    // AMBIENT LIGHT
    // =====================================

    const ambientLight = new BABYLON.HemisphericLight(
        "ambientLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );

    // =====================================
    // DEBUG SUN SPHERE
    // =====================================

    const sunSphere = BABYLON.MeshBuilder.CreateSphere(
        "debug_sun_sphere",
        {
            diameter: 6,
            segments: 24
        },
        scene
    );

    sunSphere.isPickable = false;
    sunSphere.checkCollisions = false;

    const sunMat = new BABYLON.StandardMaterial(
        "debugSunMat",
        scene
    );

    sunMat.emissiveColor = new BABYLON.Color3(1, 0.85, 0.35);
    sunMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.35);

    sunSphere.material = sunMat;

    function updateLight() {

        const date = new Date();

        const hour = config.forceHour !== null
            ? config.forceHour
            : date.getHours() + date.getMinutes() / 60;

        const sunData = getSunDataByHour(hour);

        sunLight.position.copyFrom(sunData.position);

        sunLight.direction = sunData.position
            .scale(-1)
            .normalize();

        sunLight.intensity = sunData.sunIntensity;
        ambientLight.intensity = sunData.ambientIntensity;

        sunLight.diffuse = sunData.sunColor;
        sunLight.specular = sunData.sunColor;

        ambientLight.diffuse = sunData.ambientColor;
        ambientLight.groundColor = sunData.groundColor;

        sunSphere.position.copyFrom(sunData.position);
        sunSphere.setEnabled(sunData.showSun);

        scene.clearColor = sunData.clearColor;

        scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogStart = sunData.fogStart;
        scene.fogEnd = sunData.fogEnd;
        scene.fogColor = sunData.fogColor;
    }

    updateLight();

    let lastUpdate = 0;

    scene.onBeforeRenderObservable.add(() => {

        const now = performance.now();

        if (now - lastUpdate < config.updateEveryMs) {
            return;
        }

        lastUpdate = now;

        updateLight();
    });

    return {
        sunLight,
        ambientLight,
        sunSphere,
        updateLight
    };
}

function getSunDataByHour(hour) {

    // night: 20:00 - 06:00
    if (hour >= 20 || hour < 6) {
        return {
            position: new BABYLON.Vector3(-40, 20, -80),
            sunIntensity: 0.08,
            ambientIntensity: 0.18,
            sunColor: new BABYLON.Color3(0.25, 0.35, 0.65),
            ambientColor: new BABYLON.Color3(0.18, 0.22, 0.35),
            groundColor: new BABYLON.Color3(0.05, 0.06, 0.10),
            clearColor: new BABYLON.Color4(0.03, 0.04, 0.09, 1),
            fogColor: new BABYLON.Color3(0.03, 0.04, 0.09),
            fogStart: 35,
            fogEnd: 95,
            showSun: false
        };
    }

    // morning: 06:00 - 08:00
    if (hour >= 6 && hour < 8) {
        return {
            position: new BABYLON.Vector3(-90, 35, 40),
            sunIntensity: 0.55,
            ambientIntensity: 0.45,
            sunColor: new BABYLON.Color3(1.0, 0.65, 0.35),
            ambientColor: new BABYLON.Color3(0.55, 0.60, 0.75),
            groundColor: new BABYLON.Color3(0.20, 0.20, 0.22),
            clearColor: new BABYLON.Color4(0.50, 0.62, 0.78, 1),
            fogColor: new BABYLON.Color3(0.50, 0.62, 0.78),
            fogStart: 50,
            fogEnd: 130,
            showSun: true
        };
    }

    // day: 08:00 - 18:00
    if (hour >= 8 && hour < 18) {
        const dayProgress = (hour - 8) / 10;

        const x = BABYLON.Scalar.Lerp(-100, 100, dayProgress);
        const y = Math.sin(dayProgress * Math.PI) * 120 + 40;
        const z = BABYLON.Scalar.Lerp(60, -60, dayProgress);

        return {
            position: new BABYLON.Vector3(x, y, z),
            sunIntensity: 1.15,
            ambientIntensity: 0.65,
            sunColor: new BABYLON.Color3(1.0, 0.95, 0.82),
            ambientColor: new BABYLON.Color3(0.70, 0.75, 0.85),
            groundColor: new BABYLON.Color3(0.28, 0.30, 0.32),
            clearColor: new BABYLON.Color4(0.60, 0.75, 0.95, 1),
            fogColor: new BABYLON.Color3(0.60, 0.75, 0.95),
            fogStart: 70,
            fogEnd: 160,
            showSun: true
        };
    }

    // evening: 18:00 - 20:00
    return {
        position: new BABYLON.Vector3(90, 30, -40),
        sunIntensity: 0.35,
        ambientIntensity: 0.35,
        sunColor: new BABYLON.Color3(1.0, 0.42, 0.22),
        ambientColor: new BABYLON.Color3(0.35, 0.32, 0.45),
        groundColor: new BABYLON.Color3(0.12, 0.10, 0.15),
        clearColor: new BABYLON.Color4(0.22, 0.20, 0.32, 1),
        fogColor: new BABYLON.Color3(0.22, 0.20, 0.32),
        fogStart: 45,
        fogEnd: 110,
        showSun: true
    };
}