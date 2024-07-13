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

    // Create a canvas to draw the first-person view
    this.pixelCanvas = document.createElement("canvas");
    this.pixelCanvas.width = scene.scale.width;
    this.pixelCanvas.height = scene.scale.height;
    this.pixelContext = this.pixelCanvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    this.createOrUpdateTexture();
  }

  /**
   * Creates or updates the Phaser texture used for rendering.
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
   * Updates the first-person renderer.
   * @param playerPosition - The current position of the player.
   * @param playerAngle - The current angle of the player.
   */
  update(playerPosition: Point, playerAngle: number): void {
    playerAngle = this.clampAngle(playerAngle);

    const screenWidth = this.pixelCanvas.width;
    const screenHeight = this.pixelCanvas.height;
    const fieldOfView = this.viewAngle * (Math.PI / 180);
    const halfFieldOfView = fieldOfView / 2;
    const stepAngle = fieldOfView / screenWidth;
    const epsilon = 0.0001; // Small value to handle precision issues

    let currentAngle = playerAngle - halfFieldOfView;

    // Clear the canvas with a solid color (sky blue for the ceiling and gray for the floor)
    this.pixelContext.fillStyle = "#87CEEB"; // Sky blue
    this.pixelContext.fillRect(0, 0, screenWidth, screenHeight / 2);
    this.pixelContext.fillStyle = "#808080"; // Gray
    this.pixelContext.fillRect(
      0,
      screenHeight / 2,
      screenWidth,
      screenHeight / 2
    );

    // Cast rays and draw walls
    for (let x = 0; x < screenWidth; x++) {
      const rayDirection = new Vector(
        Math.cos(currentAngle),
        Math.sin(currentAngle)
      );
      const ray = this.raycaster.castRay(
        playerPosition,
        rayDirection,
        this.viewDistance / this.raycaster.tileSize
      );

      if (ray.hit) {
        const textureIndex = ray.hit.collider;
        const frame = this.scene.textures.getFrame("tiles", textureIndex);
        if (frame) {
          const perpendicularDistance =
            ray.distance * Math.cos(playerAngle - currentAngle); // Correct fish-eye effect
          const wallHeight = screenHeight / perpendicularDistance; // Calculate wall height

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
          wallX -= Math.floor(wallX + epsilon);
          wallX = Math.abs(wallX);

          // X coordinate on the texture
          let textureX = Math.floor(wallX * frame.width);
          if (ray.hit.normal.x === 1 || ray.hit.normal.y === -1) {
            textureX = frame.width - textureX - 1;
          }

          // Draw the vertical slice of the texture
          this.pixelContext.drawImage(
            frame.source.image as CanvasImageSource,
            frame.cutX + textureX, // Source X
            frame.cutY, // Source Y
            1, // Source Width
            frame.height, // Source Height
            x, // Destination X
            (screenHeight - wallHeight) / 2, // Destination Y
            1, // Destination Width
            wallHeight // Destination Height
          );
        }
      }

      currentAngle += stepAngle;
    }

    // Render collectibles and players
    this.renderCollectibles(
      playerPosition,
      playerAngle,
      screenWidth,
      screenHeight
    );
    this.renderPlayers(playerPosition, playerAngle, screenWidth, screenHeight);

    if (this.phaserTexture) {
      this.phaserTexture.context.drawImage(this.pixelCanvas, 0, 0);
      this.phaserTexture.refresh();
    }
  }

  /**
   * Determines if an object is in view.
   * @param objectPosition - The position of the object.
   * @param playerPosition - The position of the player.
   * @param playerAngle - The angle of the player.
   * @param screenWidth - The width of the screen.
   * @param screenHeight - The height of the screen.
   * @returns An object containing whether the object is in view, its screen X position, and its sprite height.
   */
  private isInView(
    objectPosition: Point,
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): { inView: boolean; screenX: number; spriteHeight: number } {
    playerAngle = this.clampAngle(playerAngle);

    const dx = objectPosition.x - playerPosition.x;
    const dy = objectPosition.y - playerPosition.y;
    const distanceInWorldUnits = Math.sqrt(dx * dx + dy * dy);

    // Normalize the direction vector
    const direction = new Vector(dx, dy).normalize();

    // Perform a raycast to check for walls between player and object
    const ray = this.raycaster.castRay(
      playerPosition,
      direction,
      distanceInWorldUnits / this.raycaster.tileSize
    );

    if (ray.hit) {
      return { inView: false, screenX: 0, spriteHeight: 0 };
    }

    const angleToPlayer = Math.atan2(dy, dx);
    let angleDifference = playerAngle - angleToPlayer;

    if (angleDifference > Math.PI) {
      angleDifference -= 2 * Math.PI;
    } else if (angleDifference < -Math.PI) {
      angleDifference += 2 * Math.PI;
    }

    const fieldOfView = this.viewAngle * (Math.PI / 180);
    const halfFieldOfView = fieldOfView / 2;

    if (
      Math.abs(angleDifference) < halfFieldOfView &&
      distanceInWorldUnits < this.viewDistance
    ) {
      const screenX =
        screenWidth / 2 - (angleDifference / fieldOfView) * screenWidth;
      const maxSpriteHeight = screenHeight / 3; // Max height 1/3 of screen height

      // Correct scaling calculation
      const minDistance = 200; // Minimum distance at which scaling starts
      const spriteHeight =
        distanceInWorldUnits < minDistance
          ? maxSpriteHeight * (1 - distanceInWorldUnits / minDistance)
          : 30; // Minimum size when distance is greater than minDistance

      return {
        inView: true,
        screenX,
        spriteHeight: Math.max(spriteHeight, 30),
      };
    }
    return { inView: false, screenX: 0, spriteHeight: 0 };
  }

  /**
   * Renders the collectibles in the scene.
   * @param playerPosition - The current position of the player.
   * @param playerAngle - The current angle of the player.
   * @param screenWidth - The width of the screen.
   * @param screenHeight - The height of the screen.
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
            const maxScaleHeight = screenHeight / 3; // Max height 1/3 of screen height
            const scaleHeight = Math.min(spriteHeight, maxScaleHeight); // Scale height based on distance
            const aspectRatio = sprite.width / sprite.height;
            const scaleWidth = scaleHeight * aspectRatio;

            // Calculate vertical position based on distance
            const distanceInWorldUnits = Math.sqrt(
              Math.pow(collectible.x - playerPosition.x, 2) +
                Math.pow(collectible.y - playerPosition.y, 2)
            );

            // Adjust the vertical position to simulate the object sitting on the ground
            const groundLevel = screenHeight * 0.9; // Base ground level near the bottom of the screen
            const maxHeightAdjustment = groundLevel - screenHeight / 2;
            const heightAdjustmentFactor =
              distanceInWorldUnits / this.viewDistance;
            const heightAdjustment =
              maxHeightAdjustment * heightAdjustmentFactor;
            const verticalOffset = groundLevel - heightAdjustment;

            // Ensure the vertical offset does not exceed halfway mark
            const clampedVerticalOffset = Math.min(
              verticalOffset,
              screenHeight / 2
            );

            // Draw the scaled image
            this.pixelContext.save(); // Save the context state
            this.pixelContext.translate(screenX, clampedVerticalOffset); // Move to the position
            this.pixelContext.scale(
              scaleWidth / sprite.width,
              scaleHeight / sprite.height
            ); // Scale the context

            this.pixelContext.drawImage(
              sprite.source.image as CanvasImageSource,
              sprite.cutX,
              sprite.cutY,
              sprite.width,
              sprite.height,
              -sprite.width / 2, // Center the sprite
              0,
              sprite.width,
              sprite.height
            );

            this.pixelContext.restore(); // Restore the context state
          }
        }
      }
    );
  }

  /**
   * Renders the players in the scene.
   * @param playerPosition - The current position of the player.
   * @param playerAngle - The current angle of the player.
   * @param screenWidth - The width of the screen.
   * @param screenHeight - The height of the screen.
   */
  private renderPlayers(
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    const players = (this.scene as GameScene).getPlayers();
    players.forEach((player: { x: number; y: number; name: string }) => {
      const sprite = this.scene.textures.getFrame("playerSprite", 0);
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
   * Cleans up resources used by the renderer.
   */
  destroy() {
    if (this.phaserTexture) {
      this.phaserTexture.destroy();
    }
    this.phaserTexture = null;
  }

  /**
   * Clamps the angle to the range -π to π.
   * @param angle - The angle to be clamped.
   * @returns The clamped angle.
   */
  clampAngle(angle: number): number {
    angle = angle % (2 * Math.PI);
    if (angle > Math.PI) {
      angle -= 2 * Math.PI;
    } else if (angle < -Math.PI) {
      angle += 2 * Math.PI;
    }
    return angle;
  }
}

export default FirstPersonRenderer;
