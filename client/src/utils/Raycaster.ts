import Phaser from 'phaser';

class Raycaster {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    castRay(x: number, y: number, angle: number, length: number): Phaser.Geom.Line {
        const endX = x + length * Math.cos(angle);
        const endY = y + length * Math.sin(angle);
        return new Phaser.Geom.Line(x, y, endX, endY);
    }

    getIntersections(ray: Phaser.Geom.Line, layer: Phaser.Tilemaps.TilemapLayer): Phaser.Geom.Point[] {
        const intersections: Phaser.Geom.Point[] = [];
        const tiles = layer.getTilesWithinShape(ray);
        tiles.forEach((tile: Phaser.Tilemaps.Tile) => {
            const tileRect = new Phaser.Geom.Rectangle(tile.pixelX, tile.pixelY, tile.width, tile.height);
            const points = Phaser.Geom.Intersects.GetLineToRectangle(ray, tileRect);
            if (points.length > 0) {
                intersections.push(points[0]);
            }
        });
        return intersections;
    }
}

export default Raycaster;
