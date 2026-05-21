export async function loadBear(scene, player = null) {

    return new Promise((resolve, reject) => {

        BABYLON.SceneLoader.ImportMesh(
            "",
            "./assets/bear/",
            "bear.glb",
            scene,
            function(meshes, particleSystems, skeletons, animationGroups) {

                // =====================================
                // SETTINGS
                // =====================================
                const START_X = 0;
                const START_Z = 10;

                const BEAR_SCALE = 10;

                // Change if bear faces wrong direction:
                // 0
                // Math.PI
                // Math.PI / 2
                // -Math.PI / 2
                const BEAR_ROTATION_OFFSET = 0;
                const BEAR_FOLLOW_DISTANCE = 10;
                const BEAR_FOLLOW_SPEED = 4;


                // =====================================
                // CREATE ROTATABLE ROOT
                // =====================================
                const bearMesh = meshes[0];

                const bear = new BABYLON.TransformNode("bearRoot", scene);

                bear.position = new BABYLON.Vector3(
                    START_X,
                    0,
                    START_Z
                );

                bear.scaling = new BABYLON.Vector3(
                    BEAR_SCALE,
                    BEAR_SCALE,
                    BEAR_SCALE
                );

                // parent imported GLB root to our controllable root
                bearMesh.parent = bear;

                // reset child transform
                bearMesh.position = BABYLON.Vector3.Zero();
                bearMesh.rotation = BABYLON.Vector3.Zero();
                bearMesh.rotationQuaternion = null;
                bearMesh.scaling = BABYLON.Vector3.One();

                meshes.forEach(mesh => {
                    mesh.checkCollisions = true;
                    mesh.computeWorldMatrix(true);
                });

                // =====================================
                // PLACE BEAR ON GROUND
                // =====================================
                placeMeshOnGround(scene, bear, meshes);

                const bearGroundOffset = getGroundOffsetFromFeet(bear, meshes);

                // =====================================
                // ROTATE BEAR TOWARD PLAYER
                // =====================================
                let rotateObserver = null;
             
                if (player) {

                    rotateObserver = scene.onBeforeRenderObservable.add(() => {
                        followTargetAtDistance(
                            scene,
                            bear,
                            player,
                            BEAR_FOLLOW_DISTANCE,
                            BEAR_FOLLOW_SPEED,
                            meshes,
                            BEAR_ROTATION_OFFSET,
                            bearGroundOffset
                        );

                    });

                }


                if (animationGroups.length > 0) {
                    animationGroups[0].play(true);
                }

                resolve({
                    bear,
                    meshes,
                    skeletons,
                    animationGroups,
                    rotateObserver
                });
            },
            null,
            function(scene, message, exception) {
                console.error("Failed loading bear:", message);
                reject(exception);
            }
        );
    });
}


// =====================================================
// Detect ground height using raycast
// =====================================================
function getGroundY(scene, x, z, ignoredMeshes = []) {

    const rayOrigin = new BABYLON.Vector3(
        x,
        5000,
        z
    );

    const rayDirection = new BABYLON.Vector3(
        0,
        -1,
        0
    );

    const rayLength = 10000;

    const ray = new BABYLON.Ray(
        rayOrigin,
        rayDirection,
        rayLength
    );

    const ignoredSet = new Set(ignoredMeshes);

    const hit = scene.pickWithRay(
        ray,
        function(mesh) {

            if (!mesh || !mesh.isEnabled()) {
                return false;
            }

            if (ignoredSet.has(mesh)) {
                return false;
            }

            const name = mesh.name.toLowerCase();

            return (
                name === "terrain" ||
                name === "ground" ||
                name.includes("terrain") ||
                name.includes("ground")
            );
        }
    );

    if (hit && hit.hit && hit.pickedPoint) {
        return hit.pickedPoint.y;
    }

    return 0;
}


// =====================================================
// Place bear bottom exactly on ground
// =====================================================
function placeMeshOnGround(scene, rootNode, meshes) {

    const groundY = getGroundY(
        scene,
        rootNode.position.x,
        rootNode.position.z,
        meshes
    );

    rootNode.computeWorldMatrix(true);

    meshes.forEach(mesh => {
        mesh.computeWorldMatrix(true);
    });

    const bounds = getMeshesWorldBounds(meshes);

    const currentBottomY = bounds.min.y;

    const offsetY = groundY - currentBottomY;

    rootNode.position.y += offsetY;

}


// =====================================================
// Get combined bounds from imported GLB meshes
// =====================================================
function getMeshesWorldBounds(meshes) {

    let min = new BABYLON.Vector3(
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY
    );

    let max = new BABYLON.Vector3(
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY
    );

    meshes.forEach(mesh => {

        if (!mesh.getBoundingInfo) {
            return;
        }

        const boundingBox = mesh.getBoundingInfo().boundingBox;

        min = BABYLON.Vector3.Minimize(
            min,
            boundingBox.minimumWorld
        );

        max = BABYLON.Vector3.Maximize(
            max,
            boundingBox.maximumWorld
        );

    });

    return {
        min,
        max
    };
}


// =====================================================
// Rotate only around Y axis toward player
// =====================================================
function rotateMeshTowardTargetYawOnly(mesh, target, rotationOffset = 0) {

    if (!mesh || !target) {
        return;
    }

    const meshPos = mesh.getAbsolutePosition();
    const targetPos = target.getAbsolutePosition();

    const dx = targetPos.x - meshPos.x;
    const dz = targetPos.z - meshPos.z;

    if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) {
        return;
    }

    const yaw = Math.atan2(dx, dz) + rotationOffset;

    mesh.rotation.y = yaw;
}


function followTargetAtDistance(
    scene,
    mesh,
    target,
    minDistance = 10,
    speed = 4,
    ignoredMeshes = [],
    rotationOffset = 0,
    groundOffset = 0
) {

    if (!mesh || !target) {
        return;
    }

    const deltaTime = scene.getEngine().getDeltaTime() / 1000;

    const meshPos = mesh.getAbsolutePosition();
    const targetPos = target.getAbsolutePosition();

    const dx = targetPos.x - meshPos.x;
    const dz = targetPos.z - meshPos.z;

    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.001) {
        return;
    }

    // rotate toward player
    const yaw = Math.atan2(dx, dz) + rotationOffset;
    mesh.rotation.y = yaw;

    // follow only if farther than min distance
    if (distance > minDistance) {

        const moveDistance = Math.min(
            speed * deltaTime,
            distance - minDistance
        );

        const dirX = dx / distance;
        const dirZ = dz / distance;

        mesh.position.x += dirX * moveDistance;
        mesh.position.z += dirZ * moveDistance;
    }

    // keep feet on terrain
    const groundY = getGroundY(
        scene,
        mesh.position.x,
        mesh.position.z,
        ignoredMeshes
    );

    mesh.position.y = groundY + groundOffset;
}


function getGroundOffsetFromFeet(rootNode, meshes) {

    rootNode.computeWorldMatrix(true);

    meshes.forEach(mesh => {
        mesh.computeWorldMatrix(true);
    });

    const bounds = getMeshesWorldBounds(meshes);

    return rootNode.position.y - bounds.min.y;
}