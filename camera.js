export function createWowCamera(scene, canvas, target) {

    // 0 = one side
    // Math.PI = opposite side
    // If camera still shows player front, switch this to Math.PI
    const CAMERA_BACK_OFFSET =  Math.PI / 2;

    const initialAlpha =
        target.rotation.y + CAMERA_BACK_OFFSET;

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        initialAlpha,
        1.2,
        12,
        target.position.clone(),
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

    // Force camera to start behind player immediately
    camera.alpha = initialAlpha;
    camera.target.copyFrom(target.position);

    // =====================================
    // AUTO FOLLOW BEHIND PLAYER WHEN W HELD
    // =====================================

    const keys = {
        w: false
    };

    window.addEventListener("keydown", (event) => {
        if (event.code === "KeyW") {
            keys.w = true;
        }
    });

    window.addEventListener("keyup", (event) => {
        if (event.code === "KeyW") {
            keys.w = false;
        }
    });

    function normalizeAngle(angle) {
        while (angle > Math.PI) {
            angle -= Math.PI * 2;
        }

        while (angle < -Math.PI) {
            angle += Math.PI * 2;
        }

        return angle;
    }

    function lerpAngle(current, target, amount) {
        const difference = normalizeAngle(target - current);
        return current + difference * amount;
    }

    const lastTargetPosition = target.position.clone();

    scene.onBeforeRenderObservable.add(() => {

        if (!target || target.isDisposed()) {
            return;
        }

        const deltaTime =
            scene.getEngine().getDeltaTime() / 1000;

        camera.target = BABYLON.Vector3.Lerp(
            camera.target,
            target.position,
            8 * deltaTime
        );

        const movementDirection =
            target.position.subtract(lastTargetPosition);

        movementDirection.y = 0;

        if (keys.w && movementDirection.lengthSquared() > 0.00001) {

            movementDirection.normalize();

            // Camera goes behind real movement direction
            const desiredAlpha =
                Math.atan2(
                    -movementDirection.z,
                    -movementDirection.x
                );

            camera.alpha = lerpAngle(
                camera.alpha,
                desiredAlpha,
                2.2 * deltaTime
            );
        }

        lastTargetPosition.copyFrom(target.position);
    });

    return camera;
}