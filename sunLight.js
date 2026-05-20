export function createSunLight(scene, options = {}) {

    const config = {
        updateEveryMs: options.updateEveryMs || 60000,
        forceHour: options.forceHour ?? null,
        shadowMapSize: options.shadowMapSize || 4096,  // ← this line was missing
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
    // SHADOW GENERATOR
    // =====================================
    const shadowGenerator = new BABYLON.ShadowGenerator(
        config.shadowMapSize || 512,
        sunLight
    );

    // SIMPLE / FAST SHADOWS
    shadowGenerator.useBlurExponentialShadowMap = false;
    shadowGenerator.useExponentialShadowMap = false;
    shadowGenerator.usePoissonSampling = false;
    shadowGenerator.usePercentageCloserFiltering = false;
    shadowGenerator.useBlurVarianceShadowMap = false;
    shadowGenerator.useVarianceShadowMap = false;

    // Hard simple shadow
    shadowGenerator.bias = 0.002;
    shadowGenerator.normalBias = 0.02;

    // Shadow strength
    shadowGenerator.darkness = 0.35;

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

    // Sun sphere should NOT cast a shadow of itself
    sunSphere.receiveShadows = false;

    const sunMat = new BABYLON.StandardMaterial(
        "debugSunMat",
        scene
    );

    sunMat.emissiveColor = new BABYLON.Color3(1, 0.85, 0.35);
    sunMat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.35);

    sunSphere.material = sunMat;


    // =====================================
    // UPDATE
    // =====================================

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


        // Fade shadow darkness: sharp at noon, gone at night
        shadowGenerator.darkness = sunData.showSun ? 0.35 : 1.0;
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
        shadowGenerator,   // ← exported so other files can register casters
        updateLight,
    };
}


 export function addSceneShadowCasters(scene, shadowGenerator, ground) {
     scene.meshes.forEach((mesh) => {
         if (!mesh) return;
         if (mesh === ground) return;
         if (mesh.name === "terrain") return;
         if (mesh.name === "debug_sun_sphere") return;
         // Skip invisible/root/helper meshes without real geometry
         if (typeof mesh.getTotalVertices === "function" && mesh.getTotalVertices() === 0) {
             return;
         }
         shadowGenerator.addShadowCaster(mesh, true);
     });
    // console.log("Shadow casters:",   shadowGenerator.getShadowMap().renderList.length   );
    // console.log("Ground receive shadows:", ground.receiveShadows);
    // console.log("Shadow render list:", shadowGenerator.getShadowMap().renderList);
    // console.log("Sun direction:", shadowGenerator.getLight().direction);
    // console.log("Sun intensity:", shadowGenerator.getLight().intensity);
 }



/**
 * Converts a time-of-day (0–24, supports fractional minutes) into
 * a world-space position on a circular orbit around the scene origin.
 *
 *  Sun  rises at 06:00, peaks at 12:00, sets at 20:00  → 14-hour arc
 *  Moon rises at 20:00, peaks at 02:00, sets at 06:00  → 10-hour arc
 *
 * @param {number} hour        - e.g. new Date().getHours() + new Date().getMinutes()/60
 * @param {number} riseHour    - hour the body crosses the horizon going up
 * @param {number} setHour     - hour the body crosses the horizon going down
 * @param {number} radius      - orbit radius (distance from origin)
 * @param {number} tiltZ       - sideways tilt of the orbit plane (scene units)
 * @returns {BABYLON.Vector3}
 */
function orbitalPosition(hour, riseHour, setHour, radius = 120, tiltZ = 0) {
    // Normalise hour into [0, 1] across the arc.
    // Works even when the arc crosses midnight (e.g. 20→06).
    let arcLength = setHour - riseHour;
    if (arcLength <= 0) arcLength += 24;          // crosses midnight

    let elapsed = hour - riseHour;
    if (elapsed < 0) elapsed += 24;

    const t = Math.min(elapsed / arcLength, 1);   // 0 = rise, 0.5 = peak, 1 = set

    // Semi-circle: angle goes from 0° (horizon east) → 180° (horizon west)
    const angle = t * Math.PI;

    const x = Math.cos(angle) * radius;           // east → west
    const y = Math.sin(angle) * radius;           // up arc
    const z = tiltZ;                              // slight depth offset

    return new BABYLON.Vector3(x, y, z);
}


function getSunDataByHour(hour) {

    // ── night: 20:00 – 06:00  (moon is up) ──────────────────────────────────
    if (hour >= 20 || hour < 6) {
        return {
            position: orbitalPosition(hour, 20, 6, 110, -30),
            sunIntensity: 0.18,
            ambientIntensity: 0.42,
            sunColor:     new BABYLON.Color3(0.55, 0.65, 0.90),
            ambientColor: new BABYLON.Color3(0.32, 0.38, 0.55),
            groundColor:  new BABYLON.Color3(0.12, 0.14, 0.22),
            clearColor:   new BABYLON.Color4(0.06, 0.08, 0.18, 1),
            fogColor:     new BABYLON.Color3(0.06, 0.08, 0.18),
            fogStart: 40, fogEnd: 110,
            showSun: false   // swap in your moon mesh here
        };
    }

    // ── morning: 06:00 – 08:00 ───────────────────────────────────────────────
    if (hour < 8) {
        return {
            position: orbitalPosition(hour, 6, 20, 120, 40),
            sunIntensity: 0.55,
            ambientIntensity: 0.45,
            sunColor:     new BABYLON.Color3(1.0, 0.65, 0.35),
            ambientColor: new BABYLON.Color3(0.55, 0.60, 0.75),
            groundColor:  new BABYLON.Color3(0.20, 0.20, 0.22),
            clearColor:   new BABYLON.Color4(0.50, 0.62, 0.78, 1),
            fogColor:     new BABYLON.Color3(0.50, 0.62, 0.78),
            fogStart: 50, fogEnd: 130,
            showSun: true
        };
    }

    // ── day: 08:00 – 18:00 ───────────────────────────────────────────────────
    if (hour < 18) {
        return {
            position: orbitalPosition(hour, 6, 20, 120, 0),
            sunIntensity: 1.15,
            ambientIntensity: 0.65,
            sunColor:     new BABYLON.Color3(1.0, 0.95, 0.82),
            ambientColor: new BABYLON.Color3(0.70, 0.75, 0.85),
            groundColor:  new BABYLON.Color3(0.28, 0.30, 0.32),
            clearColor:   new BABYLON.Color4(0.60, 0.75, 0.95, 1),
            fogColor:     new BABYLON.Color3(0.60, 0.75, 0.95),
            fogStart: 70, fogEnd: 160,
            showSun: true
        };
    }

    // ── evening: 18:00 – 20:00 ───────────────────────────────────────────────
    return {
        position: orbitalPosition(hour, 6, 20, 120, -20),
        sunIntensity: 0.35,
        ambientIntensity: 0.35,
        sunColor:     new BABYLON.Color3(1.0, 0.42, 0.22),
        ambientColor: new BABYLON.Color3(0.35, 0.32, 0.45),
        groundColor:  new BABYLON.Color3(0.12, 0.10, 0.15),
        clearColor:   new BABYLON.Color4(0.22, 0.20, 0.32, 1),
        fogColor:     new BABYLON.Color3(0.22, 0.20, 0.32),
        fogStart: 45, fogEnd: 110,
        showSun: true
    };
}