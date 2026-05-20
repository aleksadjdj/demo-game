export class KeyHoldTimerDebug {

    constructor(scene, options = {}) {

        this.scene = scene;

        this.key = options.key || "w";
        this.title = options.title || "W HOLD TIMER DEBUG";

        this.isHolding = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.lastFinalTime = 0;
        this.pressCount = 0;

        this.panel = null;

        this.createPanel();
        this.setupInput();
        this.setupUpdate();
    }

    createPanel() {

        this.panel = document.createElement("div");

        this.panel.style.position = "fixed";
        this.panel.style.right = "10px";
        this.panel.style.top = "200px";
        this.panel.style.zIndex = "9999";
        this.panel.style.padding = "10px";
        this.panel.style.background = "rgba(0, 0, 0, 0.75)";
        this.panel.style.color = "#00ff66";
        this.panel.style.fontFamily = "monospace";
        this.panel.style.fontSize = "12px";
        this.panel.style.lineHeight = "1.4";
        this.panel.style.minWidth = "220px";
        this.panel.style.pointerEvents = "none";

        document.body.appendChild(this.panel);
    }

    setupInput() {

        window.addEventListener("keydown", (event) => {

            const pressedKey = event.key.toLowerCase();

            if (pressedKey !== this.key) {
                return;
            }

            // Prevent key repeat from resetting timer while holding W
            if (event.repeat) {
                return;
            }

            // Reset and start timer every new W press
            this.isHolding = true;
            this.startTime = performance.now();
            this.elapsedTime = 0;
            this.pressCount++;
        });

        window.addEventListener("keyup", (event) => {

            const releasedKey = event.key.toLowerCase();

            if (releasedKey !== this.key) {
                return;
            }

            if (!this.isHolding) {
                return;
            }

            this.elapsedTime =
                (performance.now() - this.startTime) / 1000;

            this.lastFinalTime = this.elapsedTime;
            this.isHolding = false;
        });
    }

    setupUpdate() {

        this.scene.onBeforeRenderObservable.add(() => {

            if (this.isHolding) {
                this.elapsedTime =
                    (performance.now() - this.startTime) / 1000;
            }

            this.updatePanel();
        });
    }

    updatePanel() {

        if (!this.panel) {
            return;
        }

        this.panel.innerHTML = `
            <strong>${this.title}</strong><br>
            Key: ${this.key.toUpperCase()}<br>
            Holding: ${this.isHolding}<br>
            Current Time: ${this.elapsedTime.toFixed(3)}s<br>
            Last Final Time: ${this.lastFinalTime.toFixed(3)}s<br>
            Press Count: ${this.pressCount}<br>
        `;
    }

    getCurrentSeconds() {
        return this.elapsedTime;
    }

    getLastFinalSeconds() {
        return this.lastFinalTime;
    }
}