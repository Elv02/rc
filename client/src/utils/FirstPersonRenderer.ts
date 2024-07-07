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
  private fov: number;
  private rayAngleStep: number;
  private numRays: number;

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
    this.fov = Phaser.Math.DegToRad(this.viewAngle);
    this.numRays = Math.floor(this.scene.scale.width / 4); // Further reduce number of rays
    this.rayAngleStep = this.fov / this.numRays;
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
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    for (let i = 0; i <= this.numRays; i++) {
      const rayAngle =
        Phaser.Math.DegToRad(this.playerAngle) -
        this.fov / 2 +
        i * this.rayAngleStep;
      const intersection = this.raycaster.castRay(
        this.playerPosition.x,
        this.playerPosition.y,
        rayAngle,
        this.viewDistance
      );

      if (!intersection) continue;

      const distToIntersection = Phaser.Math.Distance.Between(
        this.playerPosition.x,
        this.playerPosition.y,
        intersection.x,
        intersection.y
      );

      // Correct fish-eye effect by adjusting the distance
      const correctedDistance =
        distToIntersection *
        Math.cos(rayAngle - Phaser.Math.DegToRad(this.playerAngle));

      // Skip rendering if the corrected distance exceeds the view distance
      if (correctedDistance > this.viewDistance) {
        continue;
      }

      // Calculate the line height based on the corrected distance
      let lineHeight =
        (this.viewDistance / correctedDistance) *
        (screenHeight / this.viewDistance);

      // Center the line height
      const lineX = (i / this.numRays) * screenWidth;
      const lineY = (screenHeight - lineHeight) / 2;

      // Set color based on the tile type at the intersection
      this.graphics.lineStyle(2, this.getWallColor(intersection.tileType), 1);
      this.graphics.beginPath();
      this.graphics.moveTo(lineX, lineY);
      this.graphics.lineTo(lineX, lineY + lineHeight);
      this.graphics.strokePath();

      // Log for debugging
      console.log(
        `Ray ${i}: Angle=${rayAngle}, Distance=${correctedDistance}, LineHeight=${lineHeight}, TileType=${intersection.tileType}`
      );
    }

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
