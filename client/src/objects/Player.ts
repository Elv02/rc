import Phaser from "phaser";
import Raycaster from "../utils/Raycaster";
import FirstPersonRenderer from "../utils/FirstPersonRenderer";
import { RaycastHit } from "../types/RaycastStructs";
import { Point, Vector } from "../types/Geometry";

/**
 * Represents a player in the game.
 * Handles movement, view rendering, and interaction with the game world.
 */
class Player {
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
  private collisionOffset: number;
  private score: number = 0;
  public width: number;
  public height: number;

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
    this.position = new Point(x, y);
    this.speed = 250;
    this.rotationSpeed = 5; // Rotation speed
    this.angle = 0; // Angle in radians
    this.viewDistance = 10000; // Player view cull distance
    this.viewAngle = 60; // Angle of the view cone in degrees
    this.collisionOffset = 25; // Offset to keep the player away from walls
    this.width = 86;
    this.height = 112;

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
  }

  /**
   * Updates the player's position and view based on input and delta time.
   * @param cursors - The cursor keys for player input.
   * @param delta - The elapsed time since the last frame update.
   */
  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, delta: number): void {
    const rotationSpeed = this.rotationSpeed * (delta / 1000);
    let movementSpeed = this.speed * (delta / 1000);
    let newPosition = new Point(this.position.x, this.position.y);
    let directionVector = new Vector(0, 0);

    if (cursors.shift.isDown) movementSpeed = movementSpeed * 1.75;

    if (cursors.left.isDown) {
      this.angle -= rotationSpeed; // Rotate left
    } else if (cursors.right.isDown) {
      this.angle += rotationSpeed; // Rotate right
    }

    if (cursors.up.isDown) {
      newPosition.x += Math.cos(this.angle) * movementSpeed;
      newPosition.y += Math.sin(this.angle) * movementSpeed;
      directionVector = new Vector(Math.cos(this.angle), Math.sin(this.angle));
    } else if (cursors.down.isDown) {
      newPosition.x -= Math.cos(this.angle) * movementSpeed;
      newPosition.y -= Math.sin(this.angle) * movementSpeed;
      directionVector = new Vector(
        -Math.cos(this.angle),
        -Math.sin(this.angle)
      );
    }

    // Extend the newPosition by collisionOffset in the direction of movement
    const extendedPosition = new Point(
      newPosition.x + directionVector.x * this.collisionOffset,
      newPosition.y + directionVector.y * this.collisionOffset
    );

    // Check boundaries and collisions
    if (this.isInsideBounds(extendedPosition)) {
      const collision = this.isColliding(extendedPosition);
      if (!collision) {
        this.position = newPosition;
      } else {
        // Slide along the wall
        const slideVector = this.getSlideVector(
          directionVector,
          collision.normal
        );
        const slidePosition = new Point(
          this.position.x + slideVector.x * movementSpeed,
          this.position.y + slideVector.y * movementSpeed
        );
        const extendedSlidePosition = new Point(
          slidePosition.x + slideVector.x * this.collisionOffset,
          slidePosition.y + slideVector.y * this.collisionOffset
        );
        if (
          this.isInsideBounds(extendedSlidePosition) &&
          !this.isColliding(extendedSlidePosition)
        ) {
          this.position = slidePosition;
        }
      }
    }

    this.firstPersonRenderer.update(this.position, this.angle);
  }

  /**
   * Checks if the given position is inside the level boundaries.
   * @param position - The position to check.
   * @returns Whether the position is inside the boundaries.
   */
  private isInsideBounds(position: Point): boolean {
    if (!this.level || !this.level[0]) {
      console.error("Level data is not defined or improperly formatted.");
      return false;
    }

    const mapWidth = this.level[0].length * this.tileSize;
    const mapHeight = this.level.length * this.tileSize;

    return (
      position.x >= 0 &&
      position.x <= mapWidth &&
      position.y >= 0 &&
      position.y <= mapHeight
    );
  }

  /**
   * Checks if the given position is colliding with any walls.
   * @param position - The position to check.
   * @returns The collision information if colliding, otherwise null.
   */
  private isColliding(position: Point): RaycastHit | null {
    const mapX = Math.floor(position.x / this.tileSize);
    const mapY = Math.floor(position.y / this.tileSize);

    if (this.level[mapY][mapX] !== 0) {
      // Perform a raycast to get collision normal
      const ray = this.raycaster.castRay(
        this.position,
        new Vector(position.x - this.position.x, position.y - this.position.y),
        this.tileSize
      );
      return ray.hit ? ray.hit : null;
    }
    return null;
  }

  /**
   * Calculates the slide vector based on the direction and wall normal.
   * @param direction - The direction vector of the player.
   * @param normal - The normal vector of the wall.
   * @returns The slide vector.
   */
  private getSlideVector(direction: Vector, normal: Vector): Vector {
    const dotProduct = direction.x * normal.x + direction.y * normal.y;
    return new Vector(
      direction.x - dotProduct * normal.x,
      direction.y - dotProduct * normal.y
    );
  }

  /**
   * Gets the current position of the player.
   * @returns The current position of the player.
   */
  getPosition(): Point {
    return this.position;
  }

  /**
   * Sets the position of the player.
   * @param x - The new x position.
   * @param y - The new y position.
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }  
  
  public addScore(points: number): void {
    this.score += points;
  }

  public getScore(): number {
    return this.score;
  }

  /**
   * Destroys the player and cleans up resources.
   */
  destroy(): void {
    if (this.firstPersonRenderer) {
      this.firstPersonRenderer.destroy();
    }
  }
}

export default Player;
