export function createDebugSceneStats(scene, camera, options = {}) {

    const config = {
        updateEveryMs: options.updateEveryMs || 500,
        axisSize: options.axisSize || 6,
        axisPosition: options.axisPosition || new BABYLON.Vector3(0, 2, 0)
    };

    // =====================================
    // XYZ AXES
    // =====================================

    createWorldAxis(scene, config.axisSize, config.axisPosition);

    // =====================================
    // HTML DEBUG PANEL
    // =====================================

    const panel = document.createElement("div");

    panel.id = "debug-scene-stats";

    panel.style.position = "fixed";
    panel.style.right = "10px";
    panel.style.top = "10px";
    panel.style.zIndex = "9999";
    panel.style.padding = "10px 12px";
    panel.style.background = "rgba(0, 0, 0, 0.75)";
    panel.style.color = "#00ff99";
    panel.style.fontFamily = "monospace";
    panel.style.fontSize = "12px";
    panel.style.lineHeight = "1.5";
    panel.style.borderRadius = "6px";
    panel.style.pointerEvents = "none";
    panel.style.minWidth = "220px";

    document.body.appendChild(panel);

    let lastUpdate = 0;

    scene.onBeforeRenderObservable.add(() => {

        const now = performance.now();

        if (now - lastUpdate < config.updateEveryMs) {
            return;
        }

        lastUpdate = now;

        const stats = getSceneStats(scene, camera);
        const memory = getMemoryStats();

        panel.innerHTML = `
            <strong>DEBUG STATS</strong><br>
            FPS: ${scene.getEngine().getFps().toFixed(0)}<br>
            Active Meshes: ${stats.activeMeshes}<br>
            Visible Meshes: ${stats.visibleMeshes}<br>
            Vertices in Camera: ${stats.vertices.toLocaleString()}<br>
            Triangles in Camera: ${stats.triangles.toLocaleString()}<br>
            Draw Calls: ${scene.getEngine()._drawCalls?.current || "N/A"}<br>
            JS Memory: ${memory}<br>
            Camera MaxZ: ${camera.maxZ}
        `;
    });

    return {
        dispose() {
            panel.remove();
        }
    };
}

function getSceneStats(scene, camera) {

    const frustumPlanes = BABYLON.Frustum.GetPlanes(
        camera.getTransformationMatrix()
    );

    let visibleMeshes = 0;
    let vertices = 0;
    let triangles = 0;

    scene.meshes.forEach((mesh) => {

        if (!mesh.isEnabled() || !mesh.isVisible) {
            return;
        }

        if (mesh.name.includes("debug")) {
            return;
        }

        if (!mesh.isInFrustum(frustumPlanes)) {
            return;
        }

        const distance = BABYLON.Vector3.Distance(
            camera.position,
            mesh.getAbsolutePosition()
        );

        if (camera.maxZ && distance > camera.maxZ) {
            return;
        }

        visibleMeshes++;

        const totalVertices = mesh.getTotalVertices();
        const indices = mesh.getIndices();

        vertices += totalVertices || 0;

        if (indices) {
            triangles += indices.length / 3;
        }
    });

    return {
        activeMeshes: scene.getActiveMeshes().length,
        visibleMeshes,
        vertices,
        triangles: Math.floor(triangles)
    };
}

function getMemoryStats() {

    if (!performance.memory) {
        return "Not available";
    }

    const used = performance.memory.usedJSHeapSize / 1024 / 1024;
    const total = performance.memory.totalJSHeapSize / 1024 / 1024;

    return `${used.toFixed(1)} MB / ${total.toFixed(1)} MB`;
}

function createWorldAxis(scene, size, position) {

    const axisRoot = new BABYLON.TransformNode(
        "debug_xyz_axis_root",
        scene
    );

    axisRoot.position.copyFrom(position);

    createAxisArrow(
        scene,
        axisRoot,
        "X",
        BABYLON.Axis.X,
        size,
        new BABYLON.Color3(1, 0, 0)
    );

    createAxisArrow(
        scene,
        axisRoot,
        "Y",
        BABYLON.Axis.Y,
        size,
        new BABYLON.Color3(0, 1, 0)
    );

    createAxisArrow(
        scene,
        axisRoot,
        "Z",
        BABYLON.Axis.Z,
        size,
        new BABYLON.Color3(0, 0.4, 1)
    );

    return axisRoot;
}

function createAxisArrow(scene, parent, label, direction, size, color) {

    const start = BABYLON.Vector3.Zero();
    const end = direction.scale(size);

    const line = BABYLON.MeshBuilder.CreateLines(
        `debug_axis_${label}_line`,
        {
            points: [
                start,
                end
            ]
        },
        scene
    );

    line.color = color;
    line.parent = parent;
    line.isPickable = false;

    const cone = BABYLON.MeshBuilder.CreateCylinder(
        `debug_axis_${label}_arrow`,
        {
            diameterTop: 0,
            diameterBottom: 0.35,
            height: 0.8,
            tessellation: 16
        },
        scene
    );

    cone.position = end.clone();
    cone.parent = parent;
    cone.isPickable = false;

    if (label === "X") {
        cone.rotation.z = -Math.PI / 2;
    }

    if (label === "Z") {
        cone.rotation.x = Math.PI / 2;
    }

    const mat = new BABYLON.StandardMaterial(
        `debug_axis_${label}_mat`,
        scene
    );

    mat.diffuseColor = color;
    mat.emissiveColor = color;

    cone.material = mat;

    const labelPlane = BABYLON.MeshBuilder.CreatePlane(
        `debug_axis_${label}_label`,
        {
            size: 1
        },
        scene
    );

    labelPlane.position = direction.scale(size + 0.8);
    labelPlane.parent = parent;
    labelPlane.isPickable = false;

    const labelTexture = new BABYLON.DynamicTexture(
        `debug_axis_${label}_texture`,
        {
            width: 128,
            height: 128
        },
        scene,
        true
    );

    labelTexture.hasAlpha = true;

    labelTexture.drawText(
        label,
        42,
        86,
        "bold 70px Arial",
        color.toHexString(),
        "transparent",
        true
    );

    const labelMat = new BABYLON.StandardMaterial(
        `debug_axis_${label}_label_mat`,
        scene
    );

    labelMat.diffuseTexture = labelTexture;
    labelMat.emissiveColor = color;
    labelMat.backFaceCulling = false;

    labelPlane.material = labelMat;

    scene.onBeforeRenderObservable.add(() => {
        labelPlane.lookAt(scene.activeCamera.position);
    });
}