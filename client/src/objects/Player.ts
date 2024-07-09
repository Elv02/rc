import Phaser from 'phaser';
import Raycaster from '../utils/Raycaster';
import FirstPersonRenderer from '../utils/FirstPersonRenderer';
import { Point, Vector } from '../types/Geometry';

/**
 * Represents a player in the game.
 * Handles movement, view rendering, and interaction with the game world.
 */
class Player {
  public sprite: Phaser.GameObjects.Graphics;
  public viewCone: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;
  private position: Point;
  private speed: number;
  private rotationSpeed: number;
  private angle: number;
  private viewDistance: number;
  private viewAngle: number;
  private raycaster: Raycaster;
  private firstPersonRenderer: FirstPersonRenderer;
  private level: number[][];
  private tileSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    level: number[][],
    tileSize: number
  ) {
    this.scene = scene;
    this.position = new Point(x, y);
    this.speed = 200;
    this.rotationSpeed = 5;
    this.angle = 0; // Angle in radians
    this.viewDistance = 1600; // Player view cull distance
    this.viewAngle = 75; // Angle of the view cone in degrees

    this.level = level;
    this.tileSize = tileSize;

    // Initialize raycaster
    this.raycaster = new Raycaster(level, tileSize);

    // Initialize first person renderer
    this.firstPersonRenderer = new FirstPersonRenderer(
      scene,
      this.raycaster,
      this.viewDistance,
      this.viewAngle
    );

    // Create graphics objects for the player and views
    this.sprite = this.scene.add.graphics();
    this.viewCone = this.scene.add.graphics();

    // Draw the initial player and view cone
    this.drawPlayer();
    this.drawViewCone();
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    delta: number,
    topDownView: boolean
  ): void {
    const movementSpeed = this.speed * (delta / 1000);
    const rotationSpeed = this.rotationSpeed * (delta / 1000);
    let newPosition = new Point(this.position.x, this.position.y);

    if (cursors.left.isDown) {
      this.angle -= rotationSpeed; // Rotate left
    } else if (cursors.right.isDown) {
      this.angle += rotationSpeed; // Rotate right
    }

    if (cursors.up.isDown) {
      newPosition.x += Math.cos(this.angle) * movementSpeed;
      newPosition.y += Math.sin(this.angle) * movementSpeed;
    } else if (cursors.down.isDown) {
      newPosition.x -= Math.cos(this.angle) * movementSpeed;
      newPosition.y -= Math.sin(this.angle) * movementSpeed;
    }

    // Check boundaries
    if (this.isInsideBounds(newPosition)) {
      this.position = newPosition;
    }

    this.sprite.setVisible(topDownView);
    this.viewCone.setVisible(topDownView);

    if (topDownView) {
      this.drawPlayer();
      this.drawViewCone(topDownView);
    }
    this.firstPersonRenderer.update(this.position, this.angle);
  }

  private drawPlayer(): void {
    this.sprite.clear();
    this.sprite.fillStyle(0x00ff00, 1);
    this.sprite.fillCircle(this.position.x, this.position.y, 10);
  }

  private drawViewCone(topDownView: boolean = false): void {
    this.viewCone.clear();
    this.viewCone.fillStyle(0xff0000, 0.5);
    this.viewCone.lineStyle(2, 0xff0000, 0.5);
    const angleIncrement = this.viewAngle / 10; // Number of rays in the cone
    for (
      let i = -this.viewAngle / 2;
      i < this.viewAngle / 2;
      i += angleIncrement
    ) {
      const direction = new Vector(
        Math.cos(this.angle + Phaser.Math.DegToRad(i)),
        Math.sin(this.angle + Phaser.Math.DegToRad(i))
      );
      const ray = this.raycaster.castRay(this.position, direction, this.viewDistance);
      if (!ray.hit) continue;

      this.viewCone.lineBetween(this.position.x, this.position.y, ray.hit.point.x, ray.hit.point.y);
    }
  }

  private isInsideBounds(position: Point): boolean {
    const mapWidth = this.level[0].length * this.tileSize;
    const mapHeight = this.level.length * this.tileSize;

    return (
      position.x >= 0 &&
      position.x <= mapWidth &&
      position.y >= 0 &&
      position.y <= mapHeight
    );
  }
}

export default Player;
