export function createDebugUI(engine, scene) {

    // =====================================
    // HTML
    // =====================================

    const fps = document.createElement("div");

    fps.id = "fpsCounter";

    fps.style.position = "fixed";
    fps.style.top = "10px";
    fps.style.left = "10px";

    fps.style.background = "rgba(0,0,0,0.7)";
    fps.style.color = "white";

    fps.style.padding = "10px";

    fps.style.fontFamily = "monospace";
    fps.style.fontSize = "14px";

    fps.style.zIndex = "9999";

    document.body.appendChild(fps);

    // =====================================
    // UPDATE
    // =====================================

    scene.onBeforeRenderObservable.add(() => {

        fps.innerHTML =
            `FPS: ${engine.getFps().toFixed(0)}`;

    });

}