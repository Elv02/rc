import Phaser from 'phaser';

export class RaycastHit extends Phaser.Geom.Point {
    tileType: number;

    constructor(x: number, y: number, tileType: number) {
        super(x, y);
        this.tileType = tileType;
    }
}