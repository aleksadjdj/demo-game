export class PlayerController {

    constructor(scene, options = {}) {

        this.scene = scene;
        this.camera = null;

        this.speed = options.speed || 0.30;
        this.turnSpeed = options.turnSpeed || 0.10;
        this.gravity = options.gravity ?? -0.00;

        this.velocityY = 0;
        this.inputMap = {};

        this.mesh = this.createPlayerMesh();

        this.setupInput();
        this.setupMovement();
    }

    createPlayerMesh() {

        const player = BABYLON.MeshBuilder.CreateCapsule(
            "player",
            {
                height: 1.8,
                radius: 0.4
            },
            this.scene
        );

        player.position.y = 0;
        player.position.x = 0;

        player.showBoundingBox = true;

        player.ellipsoid = new BABYLON.Vector3(
            0.5,
            1,
            0.5
        );

        player.checkCollisions = false;

        return player;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setupInput() {

        if (!this.scene.actionManager) {
            this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        }

        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyDownTrigger,
                (evt) => {
                    this.inputMap[evt.sourceEvent.key.toLowerCase()] = true;
                }
            )
        );

        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnKeyUpTrigger,
                (evt) => {
                    this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
                }
            )
        );
    }

    setupMovement() {

        this.scene.onBeforeRenderObservable.add(() => {

            if (!this.camera) {
                return;
            }

            // =====================================
            // ROTATION WITH A / D
            // =====================================

            if (this.inputMap["a"]) {
                this.mesh.rotation.y -= this.turnSpeed;
            }

            if (this.inputMap["d"]) {
                this.mesh.rotation.y += this.turnSpeed;
            }

            // =====================================
            // FORWARD / BACKWARD MOVEMENT WITH W / S
            // =====================================

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
                forward.x * moveDirection,
                this.velocityY,
                forward.z * moveDirection
            );

            if (moveDirection !== 0) {
                moveVector.x *= this.speed;
                moveVector.z *= this.speed;

                this.mesh.moveWithCollisions(moveVector);
            }

            // ground collision
            if (this.mesh.position.y < 1) {
                this.mesh.position.y = 1;
                this.velocityY = 0;
            }

            // camera follow
            this.camera.target.copyFrom(this.mesh.position);
        });
    }

    get position() {
        return this.mesh.position;
    }

    
}
