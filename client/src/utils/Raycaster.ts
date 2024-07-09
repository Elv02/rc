import { Point, Vector, distance } from "../types/Geometry";
import { RaycastHit, Raycast } from "../types/RaycastStructs";

/**
 * Utility class for performing raycasting using the DDA algorithm.
 */
class Raycaster {
  public readonly tileSize: number;
  private readonly level: number[][];

  /**
   * Creates an instance of the Raycaster utility.
   * @param level - The level array representing the map.
   * @param tileSize - The size of each tile in the level.
   */
  constructor(level: number[][], tileSize: number) {
    this.level = level;
    this.tileSize = tileSize;
  }

  /**
   * Casts a single ray using the DDA algorithm.
   * @param origin - The origin point of the ray.
   * @param direction - The direction vector of the ray.
   * @param length - The maximum length of the ray.
   * @returns A Raycast object representing the ray and possible hit.
   */
  castRay(origin: Point, direction: Vector, length: number): Raycast {
    const mapX = Math.floor(origin.x / this.tileSize);
    const mapY = Math.floor(origin.y / this.tileSize);
    const dirX = direction.x;
    const dirY = direction.y;

    const deltaDistX = Math.abs(1 / dirX);
    const deltaDistY = Math.abs(1 / dirY);

    let stepX, stepY;
    let sideDistX, sideDistY;

    if (dirX < 0) {
      stepX = -1;
      sideDistX = (origin.x / this.tileSize - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1 - origin.x / this.tileSize) * deltaDistX;
    }
    if (dirY < 0) {
      stepY = -1;
      sideDistY = (origin.y / this.tileSize - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1 - origin.y / this.tileSize) * deltaDistY;
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
        return new Raycast(origin, direction, length);
      }

      if (this.level[currentMapY][currentMapX] > 0) {
        hit = true;
      }
    }

    const perpWallDist =
      side === 0
        ? (currentMapX - origin.x / this.tileSize + (1 - stepX) / 2) / dirX
        : (currentMapY - origin.y / this.tileSize + (1 - stepY) / 2) / dirY;

    const hitPoint = new Point(
      origin.x + perpWallDist * dirX,
      origin.y + perpWallDist * dirY
    );

    const angle = Math.atan2(direction.y, direction.x);

    return new Raycast(
      origin,
      direction,
      perpWallDist,
      angle,
      new RaycastHit(
        hitPoint,
        perpWallDist,
        new Vector(side === 0 ? -stepX : 0, side === 1 ? -stepY : 0),
        angle,
        this.level[currentMapY][currentMapX]
      )
    );
  }

  /**
   * Casts multiple rays in a given direction.
   * @param origin - The origin point of the rays.
   * @param angle - The starting angle of the rays.
   * @param viewDistance - The maximum distance the rays should travel.
   * @param fov - The field of view in radians.
   * @param numRays - The number of rays to cast.
   * @returns An array of Raycast objects representing the intersection points.
   */
  castRays(
    origin: Point,
    angle: number,
    viewDistance: number,
    fov: number,
    numRays: number
  ): Raycast[] {
    const hits: Raycast[] = [];
    const angleStep = fov / numRays;

    for (let i = 0; i < numRays; i++) {
      const rayAngle = angle - fov / 2 + i * angleStep;
      const direction = new Vector(Math.cos(rayAngle), Math.sin(rayAngle));
      const ray = this.castRay(origin, direction, viewDistance);
      hits.push(ray);
    }
    return hits;
  }
}

export default Raycaster;
