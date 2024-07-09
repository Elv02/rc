import { Point, Vector } from "./Geometry";

/**
 * Represents a hit from a raycast.
 */
export class RaycastHit {
  constructor(
    public point: Point,
    public distance: number,
    public normal: Vector,
    public angle: number,
    public collider: any // Replace 'any' with the appropriate type for colliders in your game
  ) {}
}

/**
 * Represents a raycast.
 */
export class Raycast {
  constructor(
    public origin: Point,
    public direction: Vector,
    public distance: number,
    public angle?: number,
    public hit: RaycastHit | null = null
  ) {
    // Calculate angle if not provided
    this.angle =
      angle !== undefined
        ? angle
        : Math.atan2(direction.y - origin.y, direction.x - origin.x);
  }
}
