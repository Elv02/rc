import Phaser from "phaser";
import Raycaster from "../utils/Raycaster";
import { RaycastHit } from "../types/RaycastStructs";

/**
 * FirstPersonRenderer handles the rendering of a first-person view using raycasting.
 */
class FirstPersonRenderer {
  private scene: Phaser.Scene;
  private raycaster: Raycaster;
  private viewDistance: number;
  private viewAngle: number;
  private playerPosition: { x: number; y: number };
  private playerAngle: number;
  private graphics: Phaser.GameObjects.Graphics;

  /**
   * Constructor for the FirstPersonRenderer class.
   *
   * @param scene - The Phaser scene where the rendering will occur.
   * @param raycaster - An instance of the Raycaster utility for casting rays.
   * @param viewDistance - The maximum distance that the player can see.
   * @param viewAngle - The field of view, measured in degrees.
   */
  constructor(
    scene: Phaser.Scene,
    raycaster: Raycaster,
    viewDistance: number,
    viewAngle: number
  ) {
    this.scene = scene;
    this.raycaster = raycaster;
    this.viewDistance = viewDistance;
    this.viewAngle = viewAngle;
    this.graphics = this.scene.add.graphics();
    this.playerPosition = { x: 0, y: 0 };
    this.playerAngle = 0;
  }

  /**
   * Updates the player's position and angle, and triggers rendering.
   *
   * @param playerPosition - The current position of the player.
   * @param playerAngle - The current angle of the player.
   */
  update(playerPosition: { x: number; y: number }, playerAngle: number): void {
    this.playerPosition = playerPosition;
    this.playerAngle = playerAngle;
    this.render();
  }

  /**
   * Renders the scene based on the player's position and angle using raycasting.
   */
  private render(): void {
    this.graphics.clear();
    const fov = Phaser.Math.DegToRad(this.viewAngle);
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const numRays = screenWidth;
    const rayAngleStep = fov / numRays;

    for (let i = 0; i <= numRays; i++) {
      const rayAngle =
        Phaser.Math.DegToRad(this.playerAngle) - fov / 2 + i * rayAngleStep;
      const ray = this.raycaster.castRay(
        this.playerPosition.x,
        this.playerPosition.y,
        rayAngle,
        this.viewDistance
      );
      const intersection = this.raycaster.getIntersection(ray);
      const distToIntersection = intersection
        ? this.raycaster.getDistance(ray.getPoint(0), intersection)
        : Number.MAX_SAFE_INTEGER;

      // Correct fish-eye effect
      const correctedDistance =
        distToIntersection *
        Math.cos(rayAngle - Phaser.Math.DegToRad(this.playerAngle));

      if (correctedDistance > this.viewDistance) {
        continue;
      }

      let lineHeight = 0;
      if (intersection !== null) {
        lineHeight =
          (this.viewDistance / correctedDistance / 10) * screenHeight;
      }

      const lineX = (i / numRays) * screenWidth;
      const lineY = (screenHeight - lineHeight) / 2;

      this.graphics.lineStyle(2, this.getWallColor(intersection?.tileType), 1);
      this.graphics.lineBetween(lineX, lineY, lineX, lineY + lineHeight);
    }

    // Make the graphics follow the camera
    this.graphics.setPosition(
      this.scene.cameras.main.scrollX,
      this.scene.cameras.main.scrollY
    );
  }

  /**
   * Returns the color for a wall based on its type.
   *
   * @param tileType - The type of the tile hit by the ray.
   * @returns The color associated with the tile type.
   */
  private getWallColor(tileType: number | undefined): number {
    switch (tileType) {
      case 1:
        return 0xff0000; // red
      case 2:
        return 0x00ff00; // green
      case 3:
        return 0x0000ff; // blue
      case 4:
        return 0xffff00; // yellow
      case 5:
        return 0xff00ff; // purple
      case 6:
        return 0xffa500; // orange
      default:
        return 0x000000; // black
    }
  }
}

export default FirstPersonRenderer;
