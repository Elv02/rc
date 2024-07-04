import Phaser from 'phaser';
import Player from '../objects/Player';

class GameScene extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private level: number[][];
    private player!: Player;
    private readonly tileSize: number;
    private topDownView: boolean;

    constructor() {
        super({ key: 'GameScene' });

        // Example 2D array representing a more complex level
        this.level = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

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
        this.input.keyboard?.on('keydown-T', () => {
            this.topDownView = !this.topDownView;
        });
    }

    update(time: number, delta: number): void {
        this.player.update(this.cursors, delta, this.topDownView);
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
