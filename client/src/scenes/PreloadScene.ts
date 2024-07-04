import Phaser from 'phaser';

class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        // Log asset loading stages
        this.load.on('complete', this.onLoadComplete, this);
        this.load.on('loaderror', this.onLoadError, this);
        this.load.on('fileprogress', this.onFileProgress);

        // Load the tileset spritesheet
        this.load.spritesheet('tiles', 'assets/tilemaps/tiles.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    create(): void {
        this.scene.start('MainMenuScene');
    }

    onFileProgress(file: Phaser.Loader.File): void {
        console.log(`Loading file: ${file.key} from ${file.src}`);
    }

    onLoadComplete(): void {
        console.log("Asset loading complete.");
    }

    onLoadError(file: Phaser.Loader.File): void {
        console.error("Failed to load file %s", file.src);
    }
}

export default PreloadScene;
