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

    this.pixelCanvas = document.createElement("canvas");
    this.pixelCanvas.width = scene.scale.width;
    this.pixelCanvas.height = scene.scale.height;
    this.pixelContext = this.pixelCanvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;

    this.createOrUpdateTexture();
  }

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
        this.viewDistance / this.raycaster.tileSize
      );

      if (ray.hit) {
        const textureIndex = ray.hit.collider;
        const frame = this.scene.textures.getFrame("tiles", textureIndex);
        if (frame) {
          const perpendicularDistance =
            ray.distance * Math.cos(playerAngle - currentAngle); // Correct fish-eye effect
          const wallHeight = screenHeight / perpendicularDistance; // Calculate wall height

          const clampedWallHeight = Math.min(wallHeight, screenHeight);

          // Calculate the exact X coordinate of the texture
          let wallX;
          if (ray.hit.normal.x !== 0) {
            wallX = playerPosition.y / this.raycaster.tileSize + perpendicularDistance * rayDirection.y;
          } else {
            wallX = playerPosition.x / this.raycaster.tileSize + perpendicularDistance * rayDirection.x;
          }
          wallX -= Math.floor(wallX);
          wallX = Math.abs(wallX);

          // X coordinate on the texture
          let textureX = wallX * frame.width;
          if (ray.hit.normal.x === 1 || ray.hit.normal.y === -1) {
            textureX = frame.width - textureX - 1;
          }

          // Draw the vertical slice of the texture
          this.pixelContext.drawImage(
            frame.source.image as CanvasImageSource,
            frame.cutX + textureX, // Source X
            frame.cutY,            // Source Y
            1,                     // Source Width
            frame.height,          // Source Height
            x,                     // Destination X
            (screenHeight - clampedWallHeight) / 2, // Destination Y
            1,                     // Destination Width
            clampedWallHeight      // Destination Height
          );
        }
      }

      currentAngle += stepAngle;
    }

    this.renderCollectibles(playerPosition, playerAngle, screenWidth, screenHeight);
    this.renderPlayers(playerPosition, playerAngle, screenWidth, screenHeight);

    if (this.phaserTexture) {
      this.phaserTexture.context.drawImage(this.pixelCanvas, 0, 0);
      this.phaserTexture.refresh();
    }
  }

  private isInView(
    objectPosition: Point,
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): { inView: boolean; screenX: number; spriteHeight: number } {
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

    if (Math.abs(angleDifference) < halfFieldOfView && distanceInWorldUnits < this.viewDistance) {
      const screenX = screenWidth / 2 - (angleDifference / fieldOfView) * screenWidth;
      const spriteHeight = screenHeight / (distanceInWorldUnits / 10);

      const clampedHeight = Math.max(spriteHeight, 30);

      return { inView: true, screenX, spriteHeight: clampedHeight };
    }
    return { inView: false, screenX: 0, spriteHeight: 0 };
  }

  private renderCollectibles(
    playerPosition: Point,
    playerAngle: number,
    screenWidth: number,
    screenHeight: number
  ): void {
    const collectibles = (this.scene as GameScene).getCollectibles();
    collectibles.forEach((collectible: { x: number; y: number; type: number }) => {
      const sprite = this.scene.textures.getFrame("collectibles", collectible.type);
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
    });
  }

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

  destroy() {
    if (this.phaserTexture) {
      this.phaserTexture.destroy();
    }
    this.phaserTexture = null;
  }
}

export default FirstPersonRenderer;
