import Phaser from 'phaser';

class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create(): void {
        this.add.text(100, 100, 'Main Menu', { fontSize: '32px', color: '#fff' }); // Updated to use 'color'
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

export default MainMenuScene;
