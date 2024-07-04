import Phaser from 'phaser';
import Player from '../objects/Player';

class GameScene extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private level: number[][];
    private player!: Player;
    private readonly tileSize: number;

    constructor() {
        super({ key: 'GameScene' });

        // Example 2D array representing the level
        this.level = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        this.tileSize = 128;
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
    }

    update(time: number, delta: number): void {
        this.player.update(this.cursors, delta);
    }

    private createLevel(): void {
        for (let y = 0; y < this.level.length; y++) {
            for (let x = 0; x < this.level[y].length; x++) {
                const tile = this.level[y][x];
                if (tile === 1) {
                    // Assuming tile index 1 represents a block
                    this.add.sprite(x * this.tileSize, y * this.tileSize, 'tiles', 0).setOrigin(0);
                }
            }
        }
    }
}

export default GameScene;
