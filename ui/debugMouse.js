export function createDebugMouseLaser(scene, camera) {

    const laserLines = [];
    const maxDistance = 1000;

    scene.onPointerObservable.add((pointerInfo) => {

        if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
            return;
        }

        // left mouse only
        if (pointerInfo.event.button !== 0) {
            return;
        }

        const ray = scene.createPickingRay(
            scene.pointerX,
            scene.pointerY,
            BABYLON.Matrix.Identity(),
            camera
        );

        const hit = scene.pickWithRay(ray, (mesh) => {
            return mesh.isPickable !== false;
        });

        const start = ray.origin.clone();

        let end;

        if (hit && hit.hit && hit.pickedPoint) {
            end = hit.pickedPoint.clone();
        } else {
            end = ray.origin.add(ray.direction.scale(maxDistance));
        }

        const laser = BABYLON.MeshBuilder.CreateLines(
            `debug-laser-${laserLines.length}`,
            {
                points: [
                    start,
                    end
                ]
            },
            scene
        );

        laser.color = new BABYLON.Color3(1, 0, 0);
        laser.isPickable = false;

        laserLines.push(laser);

    });

    return {
        clear() {
            laserLines.forEach((line) => line.dispose());
            laserLines.length = 0;
        }
    };
}


export function createDebugHoverGlow(scene) {

    const highlightLayer = new BABYLON.HighlightLayer(
        "debug-hover-highlight",
        scene
    );

    highlightLayer.outerGlow = true;
    highlightLayer.innerGlow = false;

    let currentMesh = null;

    scene.onPointerObservable.add((pointerInfo) => {

        if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERMOVE) {
            return;
        }

        const pickInfo = scene.pick(
            scene.pointerX,
            scene.pointerY,
            (mesh) => {
                return mesh.name.startsWith("cube_");
            }
        );

        const hoveredMesh =
            pickInfo && pickInfo.hit
                ? pickInfo.pickedMesh
                : null;

        if (hoveredMesh === currentMesh) {
            return;
        }

        if (currentMesh) {
            highlightLayer.removeMesh(currentMesh);
        }

        currentMesh = hoveredMesh;

        if (currentMesh) {
            highlightLayer.addMesh(
                currentMesh,
                new BABYLON.Color3(0, 1, 1)
            );
        }

    });

    return {
        clear() {
            if (currentMesh) {
                highlightLayer.removeMesh(currentMesh);
                currentMesh = null;
            }
        },
        dispose() {
            highlightLayer.dispose();
        }
    };
}


export function createDebugHoverBrightness(scene) {

    let currentMesh = null;

    function resetCurrentMesh() {

        if (!currentMesh) {
            return;
        }

        if (currentMesh.metadata?.debugOriginalMaterial) {

            const hoverMaterial = currentMesh.material;

            currentMesh.material =
                currentMesh.metadata.debugOriginalMaterial;

            if (hoverMaterial) {
                hoverMaterial.dispose();
            }

            delete currentMesh.metadata.debugOriginalMaterial;
        }

        currentMesh = null;
    }

    scene.onPointerObservable.add((pointerInfo) => {

        if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERMOVE) {
            return;
        }

        const pickInfo = scene.pick(
            scene.pointerX,
            scene.pointerY,
            (mesh) => {
                return mesh.name.startsWith("cube_");
            }
        );

        const hoveredMesh =
            pickInfo && pickInfo.hit
                ? pickInfo.pickedMesh
                : null;

        if (hoveredMesh === currentMesh) {
            return;
        }

        resetCurrentMesh();

        if (!hoveredMesh || !hoveredMesh.material) {
            return;
        }

        currentMesh = hoveredMesh;

        currentMesh.metadata = currentMesh.metadata || {};

        currentMesh.metadata.debugOriginalMaterial =
            currentMesh.material;

        const originalMaterial = currentMesh.material;

        const hoverMaterial =
            originalMaterial.clone(
                `${currentMesh.name}_hover_mat`
            );

        // =====================================
        // 40% BRIGHTNESS BOOST
        // =====================================

        const brightnessAmount = 0.4;

        if (originalMaterial.diffuseTexture) {

            hoverMaterial.diffuseTexture =
                originalMaterial.diffuseTexture;

            hoverMaterial.emissiveTexture =
                originalMaterial.diffuseTexture;

            hoverMaterial.emissiveColor =
                new BABYLON.Color3(
                    brightnessAmount,
                    brightnessAmount,
                    brightnessAmount
                );

        } else {

            const originalDiffuse =
                originalMaterial.diffuseColor ||
                new BABYLON.Color3(1, 1, 1);

            hoverMaterial.diffuseColor =
                brightenColor(
                    originalDiffuse,
                    brightnessAmount
                );

            hoverMaterial.emissiveColor =
                originalDiffuse.scale(brightnessAmount);
        }

        hoverMaterial.specularColor =
            new BABYLON.Color3(0, 0, 0);

        currentMesh.material = hoverMaterial;
    });

    return {
        clear() {
            resetCurrentMesh();
        }
    };
}

function brightenColor(color, amount = 0.4) {

    return new BABYLON.Color3(
        color.r + (1 - color.r) * amount,
        color.g + (1 - color.g) * amount,
        color.b + (1 - color.b) * amount
    );
}