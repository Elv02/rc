import Phaser from "phaser";
import Player from "../objects/Player";

class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private level: number[][];
  private player!: Player;
  private readonly tileSize: number;
  private sprites: Phaser.GameObjects.Sprite[];
  private topDownView: boolean;

  constructor() {
    super({ key: "GameScene" });

    // Example 2D array representing a more complex level
    this.level = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 0, 0, 0, 0, 4, 5, 6, 0, 0, 0, 1, 2, 3, 4, 5, 0],
      [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0],
      [0, 3, 0, 1, 1, 1, 0, 0, 2, 3, 4, 0, 1, 1, 0, 0, 0, 0, 5, 0],
      [0, 4, 0, 2, 0, 2, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 2, 0, 4, 0],
      [0, 5, 0, 3, 0, 3, 0, 0, 4, 0, 1, 1, 1, 1, 1, 0, 3, 0, 3, 0],
      [0, 6, 0, 4, 0, 4, 0, 0, 5, 0, 2, 0, 0, 0, 0, 0, 4, 0, 2, 0],
      [0, 1, 0, 5, 0, 5, 0, 0, 6, 0, 3, 1, 1, 1, 1, 0, 5, 0, 1, 0],
      [0, 2, 0, 6, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 6, 0, 6, 0],
      [0, 3, 0, 1, 1, 1, 0, 0, 3, 2, 2, 0, 1, 1, 1, 1, 1, 0, 5, 0],
      [0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0],
      [0, 5, 6, 6, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 4, 5, 6, 1, 3, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    this.sprites = [];
    this.tileSize = 128;
    this.topDownView = true;
  }

  preload(): void {
    // Preload assets handled in PreloadScene
  }

  create(): void {
    // Create the level from the 2D array
    this.createLevel();

    this.cursors = this.input.keyboard!.createCursorKeys();

    // Create the player
    this.player = new Player(this, 100, 100, this.level, this.tileSize);

    // Toggle perspective view on 'T' key press
    this.input.keyboard?.on("keydown-T", this.toggleView, this);
  }

  update(time: number, delta: number): void {
    this.player.update(this.cursors, delta);
  }

  private createLevel(): void {
    for (let y = 0; y < this.level.length; y++) {
      for (let x = 0; x < this.level[y].length; x++) {
        const tile = this.level[y][x];
        if (tile != 0) {
          // Assuming tile index >1 represents a block
          const sprite = this.add
            .sprite(x * this.tileSize, y * this.tileSize, "tiles", tile)
            .setOrigin(0);
          this.sprites.push(sprite);
        }
      }
    }
  }

  private toggleView(): void {
    this.topDownView = !this.topDownView;

    this.sprites.forEach((sprite: Phaser.GameObjects.Sprite) => {
      sprite.setVisible(this.topDownView);
    });
  }
}

export default GameScene;
