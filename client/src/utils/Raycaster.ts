import Phaser from "phaser";

class Raycaster {
  private readonly scene: Phaser.Scene;
  private readonly tileSize: number;
  private readonly level: number[][];

  constructor(scene: Phaser.Scene, level: number[][], tileSize: number) {
    this.scene = scene;
    this.level = level;
    this.tileSize = tileSize;
  }

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

  getIntersections(ray: Phaser.Geom.Line): Phaser.Geom.Point | null {
    let closestIntersection: Phaser.Geom.Point | null = null;
    let closestDistance = Phaser.Math.Distance.Between(
      ray.x1,
      ray.y1,
      ray.x2,
      ray.y2
    );

    for (let y = 0; y < this.level.length; y++) {
      for (let x = 0; x < this.level[y].length; x++) {
        if (this.level[y][x] === 1) {
          // Assuming 1 represents a block
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
          if (points.length > 0) {
            for (const p of points) {
              const distance = Phaser.Math.Distance.Between(
                ray.x1,
                ray.y1,
                p.x,
                p.y
              );
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIntersection = p;
              }
            }
          }
        }
      }
    }
    return closestIntersection;
  }
}

export default Raycaster;
