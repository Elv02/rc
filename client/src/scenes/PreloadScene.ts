import Phaser from 'phaser';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        this.load.image('player', 'assets/images/player.png');
        this.load.image('tiles', 'assets/tilemaps/tiles.png');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
    }

    create(): void {
        this.scene.start('MainMenuScene');
    }
}

export default PreloadScene;
