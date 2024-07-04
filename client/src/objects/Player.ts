import Phaser from 'phaser';
import Raycaster from '../utils/Raycaster';

class Player {
    public sprite: Phaser.GameObjects.Graphics;
    public viewCone: Phaser.GameObjects.Graphics;
    private scene: Phaser.Scene;
    private position: { x: number; y: number };
    private speed: number;
    private angle: number;
    private viewDistance: number;
    private viewAngle: number;
    private raycaster: Raycaster;

    constructor(scene: Phaser.Scene, x: number, y: number, level: number[][], tileSize: number) {
        this.scene = scene;
        this.position = { x, y };
        this.speed = 200;
        this.angle = 0; // Angle in degrees
        this.viewDistance = 200; // Distance of the view cone
        this.viewAngle = 45; // Angle of the view cone in degrees

        // Initialize raycaster
        this.raycaster = new Raycaster(scene, level, tileSize);

        // Create graphics objects for the player and view cone
        this.sprite = this.scene.add.graphics();
        this.viewCone = this.scene.add.graphics();

        // Draw the initial player and view cone
        this.drawPlayer();
        this.drawViewCone();
    }

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number): void {
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

        this.drawPlayer();
        this.drawViewCone();
    }

    private drawPlayer(): void {
        this.sprite.clear();
        this.sprite.fillStyle(0x00ff00, 1);
        this.sprite.fillCircle(this.position.x, this.position.y, 10);
    }

    private drawViewCone(): void {
        this.viewCone.clear();
        this.viewCone.fillStyle(0xff0000, 0.75);
        this.viewCone.lineStyle(2, 0xFF0000, 0.75);

        const angleIncrement = this.viewAngle / 10; // Number of rays in the cone
        for (let i = -this.viewAngle / 2; i < this.viewAngle / 2; i += angleIncrement) {
            const ray = this.raycaster.castRay(this.position.x, this.position.y, Phaser.Math.DegToRad(this.angle + i), this.viewDistance);
            const intersection = this.raycaster.getIntersections(ray);
            if (intersection) {
                this.viewCone.lineBetween(this.position.x, this.position.y, intersection.x, intersection.y);
            } else {
                this.viewCone.lineBetween(this.position.x, this.position.y, ray.x2, ray.y2);
            }
        }
    }
}

export default Player;
