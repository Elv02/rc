import Phaser from "phaser";
import { RaycastHit } from "../types/RaycastStructs";

/**
 * Utility class for working with rays using DDA
 */
class Raycaster {
  private readonly scene: Phaser.Scene;
  private readonly tileSize: number;
  private readonly level: number[][];

  /**
   * Create a new instance of the raycast utility
   * @param scene - The scene the raycaster lives in
   * @param level - The level array the raycaster will use to check collisions against
   * @param tileSize - The size of the tiles per level
   */
  constructor(scene: Phaser.Scene, level: number[][], tileSize: number) {
    this.scene = scene;
    this.level = level;
    this.tileSize = tileSize;
  }

  /**
   * Cast a ray using DDA
   * @param x - The x origin of the ray
   * @param y - The y origin of the ray
   * @param angle - The casting angle
   * @param length - The magnitude of the ray
   * @returns A RaycastHit representing the intersection point or undefined if no intersection
   */
  castRay(
    x: number,
    y: number,
    angle: number,
    length: number
  ): RaycastHit | undefined {
    const mapX = Math.floor(x / this.tileSize);
    const mapY = Math.floor(y / this.tileSize);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    const deltaDistX = Math.abs(1 / dirX);
    const deltaDistY = Math.abs(1 / dirY);

    let stepX, stepY;
    let sideDistX, sideDistY;

    if (dirX < 0) {
      stepX = -1;
      sideDistX = (x / this.tileSize - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1 - x / this.tileSize) * deltaDistX;
    }
    if (dirY < 0) {
      stepY = -1;
      sideDistY = (y / this.tileSize - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1 - y / this.tileSize) * deltaDistY;
    }

    let hit = false;
    let side = 0;

    let currentMapX = mapX;
    let currentMapY = mapY;

    while (!hit) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        currentMapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        currentMapY += stepY;
        side = 1;
      }

      if (
        currentMapX < 0 ||
        currentMapX >= this.level[0].length ||
        currentMapY < 0 ||
        currentMapY >= this.level.length
      ) {
        return undefined;
      }

      if (this.level[currentMapY][currentMapX] > 0) {
        hit = true;
      }
    }

    const perpWallDist =
      side === 0
        ? (currentMapX - x / this.tileSize + (1 - stepX) / 2) / dirX
        : (currentMapY - y / this.tileSize + (1 - stepY) / 2) / dirY;

    return new RaycastHit(
      x + perpWallDist * dirX,
      y + perpWallDist * dirY,
      this.level[currentMapY][currentMapX]
    );
  }

  /**
   * Get the distance between two points
   * @param p1 - The first point
   * @param p2 - The second point
   * @returns The distance between the two points. Returns MAX_SAFE_INTEGER if any point is undefined.
   */
  getDistance(p1: Phaser.Geom.Point, p2: Phaser.Geom.Point): number {
    if (p1 === undefined || p2 === undefined) return Number.MAX_SAFE_INTEGER;
    return Phaser.Math.Distance.BetweenPoints(p1, p2);
  }
}

export default Raycaster;
