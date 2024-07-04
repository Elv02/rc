import Phaser from "phaser";
import { RaycastHit } from "../types/RaycastStructs";

/**
 * Utility class for working with rays
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
   * Cast a ray
   * @param x - The x origin of the ray
   * @param y - The y origin of the ray
   * @param angle - The casting angle
   * @param length - The magnitude of the ray
   * @returns A line segment representing the casted ray
   */
  castRay(
    x: number,
    y: number,
    angle: number,
    length: number
  ): Phaser.Geom.Line {
    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);
    return new Phaser.Geom.Line(x, y, endX, endY);
  }

  /**
   * Get the length of a given ray
   * @param ray - The line segment representing the ray
   * @returns The magnitude of the ray. Returns MAX_SAFE_INTEGER if the ray is undefined.
   */
  getLineLength(ray: Phaser.Geom.Line | undefined): number {
    if (ray === undefined) return Number.MAX_SAFE_INTEGER;
    return this.getDistance(ray.getPoint(0), ray.getPoint(1));
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

  /**
   * Get the shortest line from a point to an array of points
   * @param origin - The origin point
   * @param points - The array of points
   * @returns The shortest line or undefined if no points are provided
   */
  getShortestLineFromPointToPoints(
    origin: Phaser.Geom.Point,
    points: Phaser.Geom.Point[]
  ): Phaser.Geom.Line | undefined {
    let closestDistance: number = Number.MAX_SAFE_INTEGER;
    let closestIntersection: Phaser.Geom.Point | undefined = undefined;
    if (points.length > 0) {
      for (const p of points) {
        const distance = this.getDistance(origin, p);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIntersection = p;
        }
      }
      return new Phaser.Geom.Line(
        origin.x,
        origin.y,
        closestIntersection?.x,
        closestIntersection?.y
      );
    } else {
      return undefined;
    }
  }

  /**
   * Get the intersection point of a ray with the level's tiles
   * @param ray - The line segment representing the ray
   * @returns The closest intersection point or undefined if no intersection
   */
  getIntersection(ray: Phaser.Geom.Line): RaycastHit | undefined {
    let closestIntersection: RaycastHit | undefined = undefined;
    let closestDistance = this.getLineLength(ray);

    for (let y: number = 0; y < this.level.length; y++) {
      for (let x: number = 0; x < this.level[y].length; x++) {
        const tileType = this.level[y][x];
        if (tileType !== 0) {
          // Assuming 0 represents empty space
          const tileRect = new Phaser.Geom.Rectangle(
            x * this.tileSize,
            y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
          const points = Phaser.Geom.Intersects.GetLineToRectangle(
            ray,
            tileRect
          );
          const shortLine = this.getShortestLineFromPointToPoints(
            ray.getPoint(0),
            points
          );
          const shortLen = this.getLineLength(shortLine);
          if (shortLen < closestDistance) {
            closestDistance = shortLen;
            const intersectionPoint = shortLine?.getPoint(1);
            if (intersectionPoint) {
              closestIntersection = new RaycastHit(
                intersectionPoint.x,
                intersectionPoint.y,
                tileType
              );
            }
          }
        }
      }
    }
    return closestIntersection;
  }
}

export default Raycaster;
