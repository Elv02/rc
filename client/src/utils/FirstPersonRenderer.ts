import Phaser from "phaser";
import Raycaster from "../utils/Raycaster";
import GameScene from "../scenes/GameScene";
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
  private phaserTexture: Phaser.Textures.CanvasTexture | null = null;

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

    this.createOrUpdateTexture();
  }

  /**
   * Create or update the Phaser texture from the canvas
   */
  private createOrUpdateTexture() {
    const textureKey = "pixelCanvas";

    if (this.scene.textures.exists(textureKey)) {
      this.phaserTexture = this.scene.textures.get(
        textureKey
      ) as Phaser.Textures.CanvasTexture;
    } else {
      this.phaserTexture = this.scene.textures.createCanvas(
        textureKey,
        this.pixelCanvas.width,
        this.pixelCanvas.height
      );
    }

    if (!this.phaserTexture) {
      this.phaserTexture = this.scene.textures.addCanvas(
        textureKey,
        this.pixelCanvas
      )!;
    }

    this.scene.add.image(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      textureKey
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

    // Render collectibles
    this.renderCollectibles(
      playerPosition,
      playerAngle,
      screenWidth,
      screenHeight
    );

    // Render other players
    this.renderPlayers(playerPosition, playerAngle, screenWidth, screenHeight);

    if (this.phaserTexture) {
      this.phaserTexture.context.drawImage(this.pixelCanvas, 0, 0);
      this.phaserTexture.refresh();
    }
  }

  /**
   * Check if an object (player/item) is within a given view angle.
   * @param objectPosition - The x,y position of the object.
   * @param playerPosition - The position of the player whose view is being checked.
   * @param playerAngle - The players viewing angle.
   * @param screenWidth - The width of the view
   * @param screenHeight - The height of the view
   * @returns Whether the object is in view, and at what x screen coordinate and height it should be drawn at if it does.
   */
  private isInView(
    objectPosition: Point,
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): { inView: boolean; screenX: number; spriteHeight: number } {
    const dx = objectPosition.x - playerPosition.x;
    const dy = objectPosition.y - playerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Perform a raycast to check for walls between player and object
    const direction = new Vector(dx, dy).normalize();
    const ray = this.raycaster.castRay(playerPosition, direction, distance);

    if (ray.hit) {
      // If the ray hits a wall before reaching the object, it's not in view
      return { inView: false, screenX: 0, spriteHeight: 0 };
    }

    const angleToPlayer = Math.atan2(dy, dx);
    let angleDifference = playerAngle - angleToPlayer;

    // Normalize the angle difference to the range [-Math.PI, Math.PI]
    if (angleDifference > Math.PI) {
      angleDifference -= 2 * Math.PI;
    } else if (angleDifference < -Math.PI) {
      angleDifference += 2 * Math.PI;
    }

    const fieldOfView = this.viewAngle * (Math.PI / 180);
    const halfFieldOfView = fieldOfView / 2;

    if (
      Math.abs(angleDifference) < halfFieldOfView &&
      distance < this.viewDistance
    ) {
      const screenX =
        screenWidth / 2 - (angleDifference / fieldOfView) * screenWidth;
      const spriteHeight = Math.floor(screenHeight / (distance / 10)); // Adjust scaling factor as needed

      // Clamp spriteHeight to a minimum value to ensure visibility
      const clampedHeight = Math.max(spriteHeight, 30); // Adjust 30 as needed

      console.log(
        `Item at ${JSON.stringify(
          objectPosition
        )} is in view for player at ${JSON.stringify(
          playerPosition
        )}. screenX: ${screenX}, spriteHeight: ${clampedHeight}`
      );

      return { inView: true, screenX, spriteHeight: clampedHeight };
    }
    return { inView: false, screenX: 0, spriteHeight: 0 };
  }

  /**
   * Function to render collectibles
   */
  private renderCollectibles(
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    const collectibles = (this.scene as GameScene).getCollectibles();
    collectibles.forEach(
      (collectible: { x: number; y: number; type: number }) => {
        const sprite = this.scene.textures.getFrame(
          "collectibles",
          collectible.type
        );
        if (sprite) {
          const { inView, screenX, spriteHeight } = this.isInView(
            new Point(collectible.x, collectible.y),
            playerPosition,
            playerAngle,
            screenWidth,
            screenHeight
          );

          if (inView) {
            this.pixelContext.drawImage(
              sprite.source.image as CanvasImageSource,
              sprite.cutX,
              sprite.cutY,
              sprite.width,
              sprite.height,
              screenX - sprite.width / 2,
              (screenHeight - spriteHeight) / 2,
              sprite.width,
              spriteHeight
            );
          }
        }
      }
    );
  }

  /**
   *  Function to render players
   */
  private renderPlayers(
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    const players = (this.scene as GameScene).getPlayers();
    players.forEach((player: { x: number; y: number; name: string }) => {
      const sprite = this.scene.textures.getFrame("playerSpriteKey", 0); // Assuming a single frame sprite for player
      if (sprite) {
        const { inView, screenX, spriteHeight } = this.isInView(
          new Point(player.x, player.y),
          playerPosition,
          playerAngle,
          screenWidth,
          screenHeight
        );

        if (inView) {
          this.pixelContext.drawImage(
            sprite.source.image as CanvasImageSource,
            sprite.cutX,
            sprite.cutY,
            sprite.width,
            sprite.height,
            screenX - sprite.width / 2,
            (screenHeight - spriteHeight) / 2,
            sprite.width,
            spriteHeight
          );
        }
      }
    });
  }

  /**
   * Cleanup resources which are no longer needed
   */
  destroy() {
    if (this.phaserTexture) {
      this.phaserTexture.destroy();
    }
    this.phaserTexture = null;
  }
}

export default FirstPersonRenderer;
