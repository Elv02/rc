import * as Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload(): void {
        // Load any assets needed for the PreloadScene
    }

    create(): void {
        this.scene.start('PreloadScene');
    }
}

export default BootScene;
