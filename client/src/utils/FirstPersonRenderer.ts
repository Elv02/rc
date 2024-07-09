import Phaser from "phaser";
import Raycaster from "../utils/Raycaster";
import { Point, Vector } from "../types/Geometry";

/**
 * A class responsible for rendering the first-person view in the game.
 * Utilizes raycasting to determine visible walls and draws them on a canvas.
 */
class FirstPersonRenderer {
  private scene: Phaser.Scene;
  private raycaster: Raycaster;
  private viewDistance: number;
  private viewAngle: number;
  private pixelCanvas: HTMLCanvasElement;
  private pixelContext: CanvasRenderingContext2D;
  private phaserTexture: Phaser.Textures.CanvasTexture;

  /**
   * Constructs a FirstPersonRenderer instance.
   * @param scene - The Phaser scene to which this renderer belongs.
   * @param raycaster - The Raycaster instance used for raycasting.
   * @param viewDistance - The maximum distance the player can see.
   * @param viewAngle - The field of view angle in degrees.
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

    // Create an off-screen canvas for pixel manipulation
    this.pixelCanvas = document.createElement("canvas");
    this.pixelCanvas.width = scene.scale.width;
    this.pixelCanvas.height = scene.scale.height;
    this.pixelContext = this.pixelCanvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    // Create a Phaser texture from the canvas
    this.phaserTexture = scene.textures.createCanvas(
      "pixelCanvas",
      this.pixelCanvas.width,
      this.pixelCanvas.height
    )!;
    scene.add.image(
      scene.scale.width / 2,
      scene.scale.height / 2,
      "pixelCanvas"
    );
  }

  /**
   * Updates the first-person view rendering based on the player's position and angle.
   * @param playerPosition - The current position of the player.
   * @param playerAngle - The current viewing angle of the player in radians.
   */
  update(playerPosition: Point, playerAngle: number): void {
    const screenWidth = this.pixelCanvas.width;
    const screenHeight = this.pixelCanvas.height;
    const fieldOfView = this.viewAngle * (Math.PI / 180);
    const halfFieldOfView = fieldOfView / 2;
    const stepAngle = fieldOfView / screenWidth;

    let currentAngle = playerAngle - halfFieldOfView;

    // Clear the canvas with a solid color (e.g., sky blue for the ceiling and gray for the floor)
    this.pixelContext.fillStyle = "#87CEEB"; // Sky blue
    this.pixelContext.fillRect(0, 0, screenWidth, screenHeight / 2);
    this.pixelContext.fillStyle = "#808080"; // Gray
    this.pixelContext.fillRect(
      0,
      screenHeight / 2,
      screenWidth,
      screenHeight / 2
    );

    for (let x = 0; x < screenWidth; x++) {
      const rayDirection = new Vector(
        Math.cos(currentAngle),
        Math.sin(currentAngle)
      );
      const ray = this.raycaster.castRay(
        playerPosition,
        rayDirection,
        this.viewDistance
      );

      if (ray.hit) {
        const textureIndex = ray.hit.collider;
        const frame = this.scene.textures.getFrame("tiles", textureIndex);
        if (frame) {
          const perpendicularDistance =
            ray.distance * Math.cos(playerAngle - currentAngle); // Correct fish-eye effect
          const wallHeight = Math.floor(screenHeight / perpendicularDistance); // Calculate wall height

          // Calculate the exact X coordinate of the texture
          let wallX;
          if (ray.hit.normal.x !== 0) {
            wallX =
              playerPosition.y / this.raycaster.tileSize +
              perpendicularDistance * rayDirection.y;
          } else {
            wallX =
              playerPosition.x / this.raycaster.tileSize +
              perpendicularDistance * rayDirection.x;
          }
          wallX -= Math.floor(wallX);

          // X coordinate on the texture
          let textureX = Math.floor(wallX * frame.width);
          if (ray.hit.normal.x === 1 || ray.hit.normal.y === -1) {
            textureX = frame.width - textureX - 1;
          }

          this.pixelContext.drawImage(
            frame.source.image as CanvasImageSource,
            frame.cutX + textureX,
            frame.cutY,
            1,
            frame.height,
            x,
            (screenHeight - wallHeight) / 2,
            1,
            wallHeight
          );
        }
      }

      currentAngle += stepAngle;
    }

    this.phaserTexture.context.drawImage(this.pixelCanvas, 0, 0);
    this.phaserTexture.refresh();
  }
}

export default FirstPersonRenderer;
