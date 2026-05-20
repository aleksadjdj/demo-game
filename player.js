export class PlayerController {

    constructor(scene, options = {}) {

        this.scene = scene;
        this.camera = null;

        this.speed = options.speed || 0.30;
        this.turnSpeed = options.turnSpeed || 0.07;

        this.gravity = options.gravity ?? -0.015;
        this.jumpPower = options.jumpPower ?? 0.17;

        this.playerHeight = options.playerHeight ?? 1.8;
        this.playerRadius = options.playerRadius ?? 0.29;
        this.playerHalfHeight = this.playerHeight / 2;
        this.groundY = options.groundY ?? 0;

        this.fallbackGroundY = options.groundY ?? 0;

        this.groundMeshes = options.groundMeshes || [];
        this.groundCheckDistance = options.groundCheckDistance ?? 2.5;
        this.groundSnapDistance = options.groundSnapDistance ?? 0.08;

        this.velocityY = 0;
        this.isGrounded = false;

        this.jumpCount = 0;
        this.lastGroundHit = null;

        this.debugEnabled = true;
        this.debugPanel = null;

        this.inputMap = {};

        this.scene.collisionsEnabled = true;

        this.mesh = this.createPlayerMesh();
        this.facingArrow = this.createFacingArrow();

        this.setupGroundMeshes();
        this.setupInput();
        this.setupDebugPanel();
        this.setupMovement();
    }

    createPlayerMesh() {

        const player = BABYLON.MeshBuilder.CreateCapsule(
            "player",
            {
                height: this.playerHeight,
                radius: this.playerRadius
            },
            this.scene
        );

        player.position.x = 0;
        player.position.y = this.groundY + this.playerHalfHeight;
        player.position.z = 0;

        player.showBoundingBox = true;

        player.ellipsoid = new BABYLON.Vector3(
            this.playerRadius,
            this.playerHalfHeight,
            this.playerRadius
        );

        player.checkCollisions = true;

        return player;
    }

    setupGroundMeshes() {

        this.groundMeshes.forEach((mesh) => {
            mesh.isPickable = true;
            mesh.checkCollisions = true;
        });
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setupInput() {

        window.addEventListener("keydown", (event) => {

            const key = event.key.toLowerCase();

            this.inputMap[key] = true;

            if (event.code === "Space") {
                event.preventDefault();

                if (this.isGrounded) {
                    this.velocityY = this.jumpPower;
                    this.isGrounded = false;
                    this.jumpCount++;
                }
            }

            if (event.code === "F3") {
                event.preventDefault();
                this.debugEnabled = !this.debugEnabled;

                if (this.debugPanel) {
                    this.debugPanel.style.display =
                        this.debugEnabled ? "block" : "none";
                }
            }
        });

        window.addEventListener("keyup", (event) => {

            const key = event.key.toLowerCase();

            this.inputMap[key] = false;
        });
    }

    getGroundHit() {

        const rayOrigin = new BABYLON.Vector3(
            this.mesh.position.x,
            this.mesh.position.y,
            this.mesh.position.z
        );

        const rayDirection = new BABYLON.Vector3(
            0,
            -1,
            0
        );

        const ray = new BABYLON.Ray(
            rayOrigin,
            rayDirection,
            this.groundCheckDistance
        );

        const hit = this.scene.pickWithRay(
            ray,
            (mesh) => {

                if (mesh === this.mesh) {
                    return false;
                }

                if (this.groundMeshes.length > 0) {
                    return this.groundMeshes.includes(mesh);
                }

                return mesh.name === "terrain" || mesh.name === "ground";
            }
        );

        if (
            hit &&
            hit.hit &&
            hit.pickedPoint
        ) {
            return hit;
        }

        return null;
    }

    updateGroundState() {

        const hit = this.getGroundHit();

        this.lastGroundHit = hit;

        if (!hit) {
            this.isGrounded = false;
            return;
        }

        const groundY = hit.pickedPoint.y;
        const playerBottomY = this.mesh.position.y - this.playerHalfHeight;
        const distanceToGround = playerBottomY - groundY;

        if (
            distanceToGround <= this.groundSnapDistance &&
            this.velocityY <= 0
        ) {
            this.mesh.position.y = groundY + this.playerHalfHeight;
            this.velocityY = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }

    setupMovement() {

        this.scene.onBeforeRenderObservable.add(() => {

            if (this.inputMap["a"]) {
                this.mesh.rotation.y -= this.turnSpeed;
            }

            if (this.inputMap["d"]) {
                this.mesh.rotation.y += this.turnSpeed;
            }

            let moveDirection = 0;

            if (this.inputMap["w"]) {
                moveDirection += 1;
            }

            if (this.inputMap["s"]) {
                moveDirection -= 0.5;
            }

            const forward = new BABYLON.Vector3(
                Math.sin(this.mesh.rotation.y),
                0,
                Math.cos(this.mesh.rotation.y)
            );

            this.velocityY += this.gravity;

            const moveVector = new BABYLON.Vector3(
                forward.x * moveDirection * this.speed,
                this.velocityY,
                forward.z * moveDirection * this.speed
            );

            this.mesh.moveWithCollisions(moveVector);

            this.updateGroundState();

            if (this.camera) {
                this.camera.target.copyFrom(this.mesh.position);
            }

            this.updateDebugPanel();
        });
    }

    setupDebugPanel() {

        this.debugPanel = document.createElement("div");

        this.debugPanel.style.position = "fixed";
        this.debugPanel.style.left = "10px";
        this.debugPanel.style.top = "10px";
        this.debugPanel.style.zIndex = "9999";
        this.debugPanel.style.padding = "10px";
        this.debugPanel.style.background = "rgba(0, 0, 0, 0.75)";
        this.debugPanel.style.color = "#00ff66";
        this.debugPanel.style.fontFamily = "monospace";
        this.debugPanel.style.fontSize = "12px";
        this.debugPanel.style.lineHeight = "1.4";
        this.debugPanel.style.minWidth = "260px";
        this.debugPanel.style.pointerEvents = "none";

        document.body.appendChild(this.debugPanel);
    }

    createFacingArrow() {

        const arrowRoot = new BABYLON.TransformNode(
            "player_facing_arrow",
            this.scene
        );

        arrowRoot.parent = this.mesh;

        // place arrow slightly above player center
        arrowRoot.position.y = this.playerHalfHeight + 0.15;

        const arrowMat = new BABYLON.StandardMaterial(
            "playerArrowMat",
            this.scene
        );

        arrowMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        arrowMat.emissiveColor = new BABYLON.Color3(1, 0, 0);

        const shaft = BABYLON.MeshBuilder.CreateCylinder(
            "player_arrow_shaft",
            {
                height: 0.8,
                diameter: 0.06
            },
            this.scene
        );

        shaft.parent = arrowRoot;

        // Babylon cylinder is vertical by default.
        // Rotate it so it points forward on local Z.
        shaft.rotation.x = Math.PI / 2;

        shaft.position.z = this.playerRadius + 0.45;
        shaft.material = arrowMat;
        shaft.isPickable = false;

        const head = BABYLON.MeshBuilder.CreateCylinder(
            "player_arrow_head",
            {
                height: 0.25,
                diameterTop: 0,
                diameterBottom: 0.22
            },
            this.scene
        );

        head.parent = arrowRoot;
        head.rotation.x = Math.PI / 2;
        head.position.z = this.playerRadius + 0.95;
        head.material = arrowMat;
        head.isPickable = false;

        return arrowRoot;
    }

    updateDebugPanel() {

        if (
            !this.debugPanel ||
            !this.debugEnabled
        ) {
            return;
        }

        const pos = this.mesh.position;

        this.mesh.computeWorldMatrix(true);

        const bbox = this.mesh.getBoundingInfo().boundingBox;

        const minY = bbox.minimumWorld.y;
        const maxY = bbox.maximumWorld.y;
        const realHeight = maxY - minY;


        let groundY = "none";
        let distanceToGround = "none";
        let pickedMesh = "none";

        if (
            this.lastGroundHit &&
            this.lastGroundHit.pickedPoint
        ) {
            groundY = this.lastGroundHit.pickedPoint.y.toFixed(3);
            pickedMesh = this.lastGroundHit.pickedMesh.name;

            const playerBottomY = pos.y - this.playerHalfHeight;

            distanceToGround =
                (playerBottomY - this.lastGroundHit.pickedPoint.y).toFixed(3);
        }

        const pressedKeys = Object.keys(this.inputMap)
            .filter((key) => this.inputMap[key])
            .join(", ");

        this.debugPanel.innerHTML = `
            <strong>PLAYER DEBUG</strong><br>
            X: ${pos.x.toFixed(3)}<br>
            Y: ${pos.y.toFixed(3)}<br>
            Z: ${pos.z.toFixed(3)}<br>
            Rotation Y: ${this.mesh.rotation.y.toFixed(3)}<br>
          

            Mesh Min Y: ${minY.toFixed(3)}<br>
            Mesh Max Y: ${maxY.toFixed(3)}<br>
            Real Mesh Height: ${realHeight.toFixed(3)}<br>
            Expected Height: ${this.playerHeight.toFixed(3)}<br>

            Velocity Y: ${this.velocityY.toFixed(3)}<br>
            Is Grounded: ${this.isGrounded}<br>
            Ground Y: ${groundY}<br>
            Distance To Ground: ${distanceToGround}<br>
            Picked Ground: ${pickedMesh}<br>
            Jump Count: ${this.jumpCount}<br>
            Keys: ${pressedKeys || "none"}<br>
            <br>
            W/S = move<br>
            A/D = rotate<br>
            Space = jump<br>
            F3 = toggle debug
        `;
    }

    
    get position() {
        return this.mesh.position;
    }
}