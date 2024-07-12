import Phaser from "phaser";
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

  constructor() {
    super({ key: "GameScene" });

    this.tileSize = 128;
    this.topDownView = true;
  }

  /**
   * Preloads assets for the game scene.
   */
  preload(): void {
    // Preload assets handled in PreloadScene
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

    this.input.keyboard?.on("keydown-X", () => {
      console.log("Action!");
      this.sendActionMessage();
    });

    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start("MainMenuScene");
    });
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
    }
  }

  /**
   * Sets up WebSocket handlers for communication with the server.
   */
  setupWebSocketHandlers(): void {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "playerId":
            this.playerId = message.data;
            break;
          case "level":
            this.handleLevelData(message.data);
            break;
          case "spawn":
            this.initializePlayer(message.data);
            break;
          case "players":
            this.updatePlayers(message.data);
            break;
          case "collectibles":
            this.setCollectibles(message.data);
            break;
          default:
            console.warn("Unknown message type:", message.type);
        }
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

  /**
   * Handles the received level data and initializes the player.
   * @param data - The object containing all level data (walls, pickups, and players).
   */
  handleLevelData(data: LevelData): void {
    this.level = data.walls;

    let players = data.players || [];

    // Create other players from level data
    players.forEach((playerData) => {
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

    // Set collectibles for the renderer
    this.setCollectibles(data.pickups);
  }

  /**
   * Initializes the player when spawn point is received.
   * @param data - The spawn point data.
   */
  initializePlayer(data: { x: number; y: number }): void {
    if (!this.player) {
      this.player = new Player(this, data.x, data.y, this.level, this.tileSize);
      console.log("Player initialized:", this.player); // Debugging info
    }
  }

  /**
   * Sends an action message to the server.
   */
  sendActionMessage(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({ type: "action", data: "Hello from GameScene!" })
      );
    } else {
      console.warn(
        "WebSocket is not open. Current state:",
        this.socket?.readyState
      );
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
   * Updates the positions of other players in the game.
   * @param players - The object containing player IDs and their positions.
   */
  updatePlayers(players: { [key: string]: { x: number; y: number } }): void {
    Object.keys(players).forEach((id) => {
      if (id !== this.playerId) {
        if (!this.otherPlayers[id]) {
          this.otherPlayers[id] = new Player(
            this,
            players[id].x,
            players[id].y,
            this.level,
            this.tileSize
          );
        } else {
          this.otherPlayers[id].setPosition(players[id].x, players[id].y);
        }
      }
    });
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
   * Cleans up resources when the scene is shut down.
   */
  shutdown(): void {
    if (this.player) {
      this.player.destroy();
    }

    if (this.socket) {
      this.socket.close();
    }
  }
}

export default GameScene;
