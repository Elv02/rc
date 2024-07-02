import Phaser from 'phaser';
import Raycaster from '../utils/Raycaster';

class Player extends Phaser.Physics.Arcade.Sprite {
    private raycaster: Raycaster;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.raycaster = new Raycaster(scene);

        this.setCollideWorldBounds(true);
    }

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, layer: Phaser.Tilemaps.TilemapLayer): void {
        if (cursors.left?.isDown) {
            this.setVelocityX(-160);
        } else if (cursors.right?.isDown) {
            this.setVelocityX(160);
        } else {
            this.setVelocityX(0);
        }

        if (cursors.up?.isDown && this.body?.touching.down) { // Null check added
            this.setVelocityY(-330);
        }

        this.castVisionRays(layer);
    }

    private castVisionRays(layer: Phaser.Tilemaps.TilemapLayer): void {
        const rayLength = 300;
        const numberOfRays = 8;
        const angleStep = (2 * Math.PI) / numberOfRays;

        for (let i = 0; i < numberOfRays; i++) {
            const angle = i * angleStep;
            const ray = this.raycaster.castRay(this.x, this.y, angle, rayLength);
            const intersections = this.raycaster.getIntersections(ray, layer);

            if (intersections.length > 0) {
                this.drawRay(ray, intersections[0]);
            } else {
                this.drawRay(ray, new Phaser.Geom.Point(ray.x2, ray.y2));
            }
        }
    }

    private drawRay(ray: Phaser.Geom.Line, endpoint: Phaser.Geom.Point): void {
        const graphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } });
        graphics.strokeLineShape(new Phaser.Geom.Line(ray.x1, ray.y1, endpoint.x, endpoint.y));
        graphics.destroy();
    }
}

export default Player;
