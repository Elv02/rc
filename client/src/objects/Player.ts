import Phaser from "phaser";
import Raycaster from "../utils/Raycaster";
import FirstPersonRenderer from "../utils/FirstPersonRenderer";

/**
 * Represents a player in the game.
 * Handles movement, view rendering, and interaction with the game world.
 */
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
  private firstPersonRenderer: FirstPersonRenderer;

  /**
   * Creates an instance of Player.
   * @param scene - The scene this player belongs to.
   * @param x - The initial x position of the player.
   * @param y - The initial y position of the player.
   * @param level - The level data represented as a 2D array.
   * @param tileSize - The 'unit' size of each tile in the level (1 unit = 1 pixel).
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    level: number[][],
    tileSize: number
  ) {
    this.scene = scene;
    this.position = { x, y };
    this.speed = 200;
    this.angle = 0; // Angle in degrees
    this.viewDistance = 1600; // Player view cull distance
    this.viewAngle = 75; // Angle of the view cone in degrees

    // Initialize raycaster
    this.raycaster = new Raycaster(scene, level, tileSize);

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

  /**
   * Updates the player's position and view based on input and delta time.
   * @param cursors - The cursor keys for player input.
   * @param delta - The elapsed time since the last frame update.
   * @param topDownView - Whether the player view is top-down or first-person.
   */
  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    delta: number,
    topDownView: boolean
  ): void {
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

    // Keep player centered in the camera
    this.scene.cameras.main.scrollX =
      this.position.x - this.scene.cameras.main.width / 2;
    this.scene.cameras.main.scrollY =
      this.position.y - this.scene.cameras.main.height / 2;

    this.sprite.setVisible(topDownView);
    this.viewCone.setVisible(topDownView);

    if (topDownView) {
      this.drawPlayer();
      this.drawViewCone(topDownView);
    }
    this.firstPersonRenderer.update(this.position, this.angle);
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
    for (
      let i = -this.viewAngle / 2;
      i < this.viewAngle / 2;
      i += angleIncrement
    ) {
      const ray = this.raycaster.castRay(
        this.position.x,
        this.position.y,
        Phaser.Math.DegToRad(this.angle + i),
        this.viewDistance
      );
      const intersection = this.raycaster.getIntersection(ray);
      if (intersection) {
        this.viewCone.lineBetween(
          this.position.x,
          this.position.y,
          intersection.x,
          intersection.y
        );
      } else {
        this.viewCone.lineBetween(
          this.position.x,
          this.position.y,
          ray.x2,
          ray.y2
        );
      }
    }
  }
}

export default Player;
