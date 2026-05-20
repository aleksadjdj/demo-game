export function createWowCamera(scene, canvas, target) {

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        1.2,
        12,
        target.position,
        scene
    );

    camera.attachControl(canvas, true);

    // =====================================
    // ZOOM LIMIT
    // =====================================
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 20;

    camera.wheelDeltaPercentage = 0.01;
    camera.inertia = 0.8;

    // =====================================
    // VIEW DISTANCE LIMIT
    // =====================================
    camera.minZ = 0.1;
    camera.maxZ = 200;

    // =====================================
    // CAMERA ANGLE LIMIT
    // =====================================
    camera.lowerBetaLimit = 0.25;
    camera.upperBetaLimit = 1.50;

    // =====================================
    // CAMERA COLLISION
    // =====================================

    camera.checkCollisions = false;

    camera.collisionRadius = new BABYLON.Vector3(
        0.5,
        0.5,
        0.5
    );

    return camera;
}