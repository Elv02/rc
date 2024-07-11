import Phaser from "phaser";

/**
 * PreloadScene handles the preloading of game assets.
 */
class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  /**
   * Preloads the game assets.
   */
  preload(): void {
    // Log asset loading stages
    this.load.on("complete", this.onLoadComplete, this);
    this.load.on("loaderror", this.onLoadError, this);
    this.load.on("fileprogress", this.onFileProgress);

    // Load the tileset spritesheet
    this.load.spritesheet("tiles", "assets/tilemaps/tiles.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.image("playerTexture", "assets/players/player.png");
  }

  /**
   * Creates the scene and starts the MainMenuScene.
   */
  create(): void {
    this.scene.start("MainMenuScene");
  }

  /**
   * Logs the progress of each file being loaded.
   * @param file - The file being loaded.
   */
  onFileProgress(file: Phaser.Loader.File): void {
    console.log(`Loading file: ${file.key} from ${file.src}`);
  }

  /**
   * Logs a message when asset loading is complete.
   */
  onLoadComplete(): void {
    console.log("Asset loading complete.");
  }

  /**
   * Logs an error message if a file fails to load.
   * @param file - The file that failed to load.
   */
  onLoadError(file: Phaser.Loader.File): void {
    console.error("Failed to load file %s", file.src);
  }
}

export default PreloadScene;
