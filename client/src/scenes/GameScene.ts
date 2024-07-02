import Phaser from 'phaser';
import Player from '../objects/Player';

class GameScene extends Phaser.Scene {
    private player!: Player;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private map!: Phaser.Tilemaps.Tilemap;
    private layer!: Phaser.Tilemaps.TilemapLayer;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        // Preload assets handled in PreloadScene
    }

    create(): void {
        this.map = this.make.tilemap({ key: 'map' });
        const tileset = this.map.addTilesetImage('tiles');
        if (!tileset) {
            throw new Error('Failed to load tileset image');
        }
        const layer = this.map.createLayer(0, tileset, 0, 0);
        if (!layer) {
            throw new Error('Failed to create tilemap layer');
        }
        this.layer = layer;
        this.layer.setCollisionByExclusion([-1]);

        this.player = new Player(this, 100, 450, 'player');
        this.physics.add.collider(this.player, this.layer);

        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update(): void {
        this.player.update(this.cursors, this.layer);
    }
}

export default GameScene;
