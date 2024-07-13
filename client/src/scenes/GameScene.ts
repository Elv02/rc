import * as Phaser from "phaser";
import Player from "../objects/Player";

interface LevelData {
  walls: number[][];
  pickups: { x: number; y: number; type: number }[];
  spawnPoints: { x: number; y: number }[];
  players: { x: number; y: number; name: string }[];
}

/**
 * GameScene represents the main game scene where the player interacts with the game world.
 */
class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private level: number[][] = [];
  private player!: Player;
  private readonly tileSize: number;
  private topDownView: boolean;
  private socket: WebSocket | null = null;
  private playerId!: string;
  private otherPlayers: { [key: string]: Player } = {};
  private collectibles: { x: number; y: number; type: number }[] = [];
  private players: { x: number; y: number; name: string }[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private isLevelDataReady: boolean = false; // Flag to check if level data is ready
  private spawnData: { x: number; y: number } | null = null; // Temporary storage for spawn data

  constructor() {
    super({ key: "GameScene" });
    this.tileSize = 128;
    this.topDownView = true;
  }

  /**
   * Preloads assets for the game scene.
   */
  preload(): void {
    // Assets are preloaded in PreloadScene
  }

  /**
   * Initializes the game scene with the provided data.
   * @param data - The data containing the WebSocket instance.
   */
  init(data: { socket: WebSocket }): void {
    this.socket = data.socket;
    this.setupWebSocketHandlers();
  }

  /**
   * Creates the game scene, setting up input handlers and initial state.
   */
  create(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.input.keyboard?.on("keydown-ESC", () => {
      this.leaveGame();
    });

    this.scoreText = this.add
      .text(16, 16, "Score: 0", {
        fontSize: "32px",
        color: "#fff",
      })
      .setDepth(100);

    this.messageText = this.add
      .text(16, 50, "", {
        fontSize: "24px",
        color: "#fff",
      })
      .setDepth(100);
  }

  /**
   * Updates the game state, called once per frame.
   * @param time - The current time.
   * @param delta - The time elapsed since the last frame.
   */
  update(time: number, delta: number): void {
    if (this.player) {
      this.player.update(this.cursors, delta);
      this.sendPlayerPosition();
      this.checkPickups();
    }
  }

  /**
   * Sets up WebSocket handlers for communication with the server.
   */
  setupWebSocketHandlers(): void {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);

        switch (message.type) {
          case "playerId":
            this.playerId = message.data;
            console.log("Received playerId:", this.playerId);
            break;
          case "level":
            this.handleLevelData(message.data);
            break;
          case "spawn":
            this.handleSpawnData(message.data);
            break;
          case "players":
            this.setPlayers(message.data);
            break;
          case "collectibles":
            this.setCollectibles(message.data);
            break;
          default:
            console.warn("Unknown message type:", message.type);
        }
      };

      this.socket.onclose = () => {
        console.log("WebSocket connection closed.");
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }
  }

  /**
   * Handles the received level data and initializes the player.
   * @param data - The object containing all level data (walls, pickups, and players).
   */
  handleLevelData(data: LevelData): void {
    this.level = data.walls;

    data.players.forEach((playerData) => {
      if (playerData.name !== this.playerId) {
        this.otherPlayers[playerData.name] = new Player(
          this,
          playerData.x,
          playerData.y,
          this.level,
          this.tileSize
        );
      }
    });

    this.setCollectibles(data.pickups);
    this.isLevelDataReady = true;
    console.log("Level data processed. Level:", this.level);

    // Initialize player if spawn data is already received
    if (this.spawnData) {
      this.initializePlayer(this.spawnData);
      this.spawnData = null;
    }
  }

  /**
   * Handles the received spawn data.
   * @param data - The spawn point data.
   */
  handleSpawnData(data: { x: number; y: number }): void {
    if (this.isLevelDataReady) {
      this.initializePlayer(data);
    } else {
      this.spawnData = data;
    }
  }

  /**
   * Initializes the player when spawn point is received.
   * @param data - The spawn point data.
   */
  initializePlayer(data: { x: number; y: number }): void {
    if (!this.player) {
      this.player = new Player(this, data.x, data.y, this.level, this.tileSize);
    }
  }

  /**
   * Sends the player's current position to the server.
   */
  sendPlayerPosition(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "move",
          data: {
            position: {
              x: this.player.getPosition().x,
              y: this.player.getPosition().y,
            },
          },
        })
      );
    }
  }

  /**
   * Updates the current state of collectibles in the level.
   * @param collectibles - Array containing collectible positions and types.
   */
  setCollectibles(
    collectibles: { x: number; y: number; type: number }[]
  ): void {
    this.collectibles = collectibles;
  }

  /**
   * Get the remaining collectibles in the game.
   * @returns An array of collectible positions and their corresponding type.
   */
  getCollectibles(): { x: number; y: number; type: number }[] {
    return this.collectibles;
  }

  /**
   * Sets the initial player data when received.
   * @param players - The array of players with their positions and names.
   */
  setPlayers(players: { x: number; y: number; name: string }[]): void {
    this.players = players;
  }

  /**
   * Get active players in this game.
   * @returns An array of player positions and their names.
   */
  getPlayers(): { x: number; y: number; name: string }[] {
    return this.players;
  }

  /**
   * Checks if the player has picked up any collectibles.
   */
  private checkPickups(): void {
    const playerPos = this.player.getPosition();
    const playerRect = new Phaser.Geom.Rectangle(
      playerPos.x,
      playerPos.y,
      this.player.width,
      this.player.height
    );

    const pickups = this.getCollectibles();
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      const pickupRect = new Phaser.Geom.Rectangle(
        pickup.x,
        pickup.y,
        this.tileSize,
        this.tileSize
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerRect, pickupRect)) {
        // Pickup collected
        this.player.addScore(pickup.type * 100);
        this.updateScoreText();
        this.showPickupMessage(pickup.type * 100);

        // Notify the server of the collected pickup
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({
              type: "collect",
              data: { x: pickup.x, y: pickup.y, type: pickup.type },
            })
          );
        }

        // Remove the pickup from the array
        pickups.splice(i, 1);
      }
    }
  }

  /**
   * Updates the score display.
   */
  private updateScoreText(): void {
    this.scoreText.setText(`Score: ${this.player.getScore()}`);
  }

  /**
   * Displays a message when a pickup is collected.
   * @param points - The points awarded for the pickup.
   */
  private showPickupMessage(points: number): void {
    this.messageText.setText(`You found a ${points} pt gem!`);
    this.time.delayedCall(2000, () => {
      this.messageText.setText("");
    });
  }

  /**
   * Leaves the game properly by disconnecting the player and closing the WebSocket connection.
   */
  leaveGame(): void {
    if (this.player) {
      // Notify server about player leaving
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({ type: "leave", data: this.playerId })
        );
      }
      this.player.destroy();
    }

    // Clear the player list
    this.otherPlayers = {};

    // Close WebSocket connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log("WebSocket connection closed.");
    }

    // Clear level and other game data
    this.level = [];
    this.collectibles = [];
    this.players = [];

    // Transition to main menu
    this.scene.start("MainMenuScene");
  }

  /**
   * Cleans up resources when the scene is shut down.
   */
  shutdown(): void {
    if (this.player) {
      this.player.destroy();
    }

    if (this.socket) {
      this.socket.close();
    }

    console.log("GameScene shutdown.");
  }
}

export default GameScene;
