import Phaser from 'phaser';
import Raycaster from '../utils/Raycaster';

/**
 * Represents a player in the game.
 * Handles movement, view rendering, and interaction with the game world.
 */
class Player {
    public sprite: Phaser.GameObjects.Graphics;
    public viewCone: Phaser.GameObjects.Graphics;
    public firstPersonView: Phaser.GameObjects.Graphics;
    private scene: Phaser.Scene;
    private position: { x: number; y: number };
    private speed: number;
    private angle: number;
    private viewDistance: number;
    private viewAngle: number;
    private raycaster: Raycaster;

    /**
     * Creates an instance of Player.
     * @param scene - The scene this player belongs to.
     * @param x - The initial x position of the player.
     * @param y - The initial y position of the player.
     * @param level - The level data represented as a 2D array.
     * @param tileSize - The 'unit' size of each tile in the level (1 unit = 1 pixel).
     */
    constructor(scene: Phaser.Scene, x: number, y: number, level: number[][], tileSize: number) {
        this.scene = scene;
        this.position = { x, y };
        this.speed = 200;
        this.angle = 0; // Angle in degrees
        this.viewDistance = 800; // Increased distance of the view cone
        this.viewAngle = 60; // Angle of the view cone in degrees

        // Initialize raycaster
        this.raycaster = new Raycaster(scene, level, tileSize);

        // Create graphics objects for the player and views
        this.sprite = this.scene.add.graphics();
        this.viewCone = this.scene.add.graphics();
        this.firstPersonView = this.scene.add.graphics();

        // Draw the initial player and view cone
        this.drawPlayer();
        this.drawViewCone();
    }

    /**
     * Updates the player's position and view based on input and delta time.
     * @param cursors - The cursor keys for player input.
     * @param delta - The elapsed time since the last frame update.
     * @param topDownView - Whether the player view is top-down or first-person.
     */
    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number, topDownView: boolean): void {
        const speed = this.speed * (delta / 1000);

        if (cursors.left.isDown) {
            this.angle -= speed; // Rotate left
        } else if (cursors.right.isDown) {
            this.angle += speed; // Rotate right
        }

        if (cursors.up.isDown) {
            this.position.x += Math.cos(Phaser.Math.DegToRad(this.angle)) * speed;
            this.position.y += Math.sin(Phaser.Math.DegToRad(this.angle)) * speed;
        } else if (cursors.down.isDown) {
            this.position.x -= Math.cos(Phaser.Math.DegToRad(this.angle)) * speed;
            this.position.y -= Math.sin(Phaser.Math.DegToRad(this.angle)) * speed;
        }

        this.scene.cameras.main.scrollX = this.position.x - this.scene.cameras.main.width / 2;
        this.scene.cameras.main.scrollY = this.position.y - this.scene.cameras.main.height / 2;

        this.sprite.setVisible(topDownView);
        this.viewCone.setVisible(topDownView);

        if (topDownView) {
            this.drawPlayer();
            this.drawViewCone(topDownView);
        } else {
            this.drawFirstPersonView();
        }
    }

    /**
     * Draws the player's representation in the game world.
     * Currently only renders a basic circle for the top down view.
     */
    private drawPlayer(): void {
        this.sprite.clear();
        this.sprite.fillStyle(0x00ff00, 1);
        this.sprite.fillCircle(this.position.x, this.position.y, 10);
    }

    /**
     * Draw the view cones (primarily for debug)
     * @param topDownView - Indicate whether we are drawing a basic limited cone (fewer lines) in top-down.
     */
    private drawViewCone(topDownView: boolean = false): void {
        this.viewCone.clear();
        this.viewCone.fillStyle(0xff0000, 0.5);
        this.viewCone.lineStyle(2, 0xff0000, 0.5);
        const angleIncrement = this.viewAngle / 10; // Number of rays in the cone
        for (let i = -this.viewAngle / 2; i < this.viewAngle / 2; i += angleIncrement) {
            const ray = this.raycaster.castRay(this.position.x, this.position.y, Phaser.Math.DegToRad(this.angle + i), this.viewDistance);
            const intersection = this.raycaster.getIntersection(ray);
            if (intersection) {
                this.viewCone.lineBetween(this.position.x, this.position.y, intersection.x, intersection.y);
            } else {
                this.viewCone.lineBetween(this.position.x, this.position.y, ray.x2, ray.y2);
            }
        }
    }

    /**
     * Render the first person view for the player.
     */
    private drawFirstPersonView(): void {
        this.firstPersonView.clear();
        const fov = Phaser.Math.DegToRad(this.viewAngle);
        const numRays = 120;
        const rayAngleStep = fov / numRays;
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        for (let i = 0; i <= numRays; i++) {
            const rayAngle = Phaser.Math.DegToRad(this.angle) - fov / 2 + i * rayAngleStep;
            const ray = this.raycaster.castRay(this.position.x, this.position.y, rayAngle, this.viewDistance);
            const intersection = this.raycaster.getIntersection(ray);
            const distToIntersection = intersection ? this.raycaster.getDistance(ray.getPoint(0), intersection) : Number.MAX_SAFE_INTEGER;

            // Correct fish-eye effect
            const correctedDistance = distToIntersection * Math.cos(rayAngle - Phaser.Math.DegToRad(this.angle));

            let lineHeight = 0;
            if (intersection !== null) {
                lineHeight = (this.viewDistance / correctedDistance) * screenHeight;
            }

            const lineX = (i / numRays) * screenWidth;
            const lineY = (screenHeight - lineHeight) / 2;

            this.firstPersonView.lineStyle(2, 0x0000ff, 1);
            this.firstPersonView.lineBetween(lineX, lineY, lineX, lineY + lineHeight);
        }

        // Make the firstPersonView follow the camera
        this.firstPersonView.setPosition(this.scene.cameras.main.scrollX, this.scene.cameras.main.scrollY);
    }
}

export default Player;
