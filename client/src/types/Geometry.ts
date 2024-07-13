/**
 * Class representing a point in 2D space.
 */
export class Point {
  constructor(public x: number, public y: number) {}

  /**
   * Calculates the distance to another point.
   * @param other - The other point.
   * @returns The distance between the points.
   */
  distanceTo(other: Point): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
}

/**
 * Class representing a vector in 2D space.
 */
export class Vector {
  constructor(public x: number, public y: number) {}

  /**
   * Adds another vector to this vector.
   * @param other - The vector to add.
   * @returns The resulting vector.
   */
  add(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtracts another vector from this vector.
   * @param other - The vector to subtract.
   * @returns The resulting vector.
   */
  subtract(other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }

  /**
   * Multiplies this vector by a scalar.
   * @param scalar - The scalar to multiply by.
   * @returns The resulting vector.
   */
  multiply(scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  /**
   * Divides this vector by a scalar.
   * @param scalar - The scalar to divide by.
   * @returns The resulting vector.
   */
  divide(scalar: number): Vector {
    return new Vector(this.x / scalar, this.y / scalar);
  }

  /**
   * Calculates the dot product of this vector and another vector.
   * @param other - The other vector.
   * @returns The dot product.
   */
  dot(other: Vector): number {
    return this.x * other.x + this.y * other.y;
  }

  /**
   * Calculates the magnitude (length) of this vector.
   * @returns The magnitude of the vector.
   */
  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  /**
   * Normalizes this vector (makes it have a magnitude of 1).
   * @returns The normalized vector.
   */
  normalize(): Vector {
    const magnitude = this.magnitude();
    return new Vector(this.x / magnitude, this.y / magnitude);
  }
}

/**
 * Helper function to calculate the distance between two points.
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns The distance between the points.
 */
export function distance(p1: Point, p2: Point): number {
  return p1.distanceTo(p2);
}

/**
 * Helper function to create a vector from two points.
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns The resulting vector.
 */
export function vectorFromPoints(p1: Point, p2: Point): Vector {
  return new Vector(p2.x - p1.x, p2.y - p1.y);
}
