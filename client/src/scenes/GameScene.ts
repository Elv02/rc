import Phaser from "phaser";
import Player from "../objects/Player";

class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private level: number[][];
  private player!: Player;
  private readonly tileSize: number;
  private topDownView: boolean;
  private socket: WebSocket | null = null;

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

    this.tileSize = 128;
    this.topDownView = true;
  }

  preload(): void {
    // Preload assets handled in PreloadScene
  }

  init(data: { socket: WebSocket }): void {
    this.socket = data.socket;
    this.setupWebSocketHandlers();
  }

  create(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Create the player
    this.player = new Player(this, 100, 100, this.level, this.tileSize);

    this.input.keyboard?.on("keydown-X", () => {
      console.log("Action!");
      if (this.socket) {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send('Hello from GameScene!');
        } else {
          console.warn('WebSocket is not open. Current state:', this.socket.readyState);
        }
      } else {
        console.warn('Socket is not accessible/non-null!');
      }
    });

    // Go back to the main menu
    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start("MainMenuScene");
    });
  }

  update(time: number, delta: number): void {
    this.player.update(this.cursors, delta);
  }

  setupWebSocketHandlers(): void {
    // TODO: Refactor these into their own declarative functions
    if (this.socket) {
      this.socket.onmessage = (event) => {
        console.log("Message from server:", event.data);
      };

      this.socket.onclose = () => {
        console.log("WebSocket connection closed.");
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }
  }

  shutdown() {
    // Clean up resources when the scene is shut down
    if (this.player) {
      this.player.destroy();
    }

    // Close the WebSocket connection if it exists
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default GameScene;
