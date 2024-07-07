import Phaser from 'phaser';

/**
 * Special type of 2D Point containing info on the target location
 */
export class RaycastHit {
    x: number;
    y: number;
    tileType: number;
  
    constructor(x: number, y: number, tileType: number) {
      this.x = x;
      this.y = y;
      this.tileType = tileType;
    }
  
    setTo(x: number, y: number, tileType: number): this {
      this.x = x;
      this.y = y;
      this.tileType = tileType;
      return this;
    }
  }
  