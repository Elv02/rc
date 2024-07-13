import { WebSocketServer } from "ws";
import { LevelGenerator, LevelData } from "./LevelGenerator";
import { nanoid } from "nanoid";

/**
 * Interface representing a message object.
 */
interface MessageObject {
  type: string;
  data: any;
}

/**
 * Interface representing a client WebSocket with an ID.
 */
interface Client extends WebSocket {
  id: string;
  on(event: string, listener: (data: any) => void): this;
  name?: string;
  position?: { x: number; y: number };
}

/**
 * GameSocketServer handles WebSocket communication and manages game state.
 */
export class GameSocketServer {
  private wss: WebSocketServer;
  private clients: Client[] = [];
  private chatLog: string[] = [];
  private currentLevel: LevelData | null = null;
  private levelGenerator: LevelGenerator;
  private spawnPointPool: { x: number; y: number }[] = [];

  /**
   * Creates an instance of GameSocketServer.
   * @param param0 - The host and port configuration.
   * @param callback - Optional callback function to be called after server starts.
   */
  constructor({ host, port }, callback = null) {
    this.wss = new WebSocketServer(
      {
        host: host,
        port: port,
      },
      callback
    );
    this.levelGenerator = new LevelGenerator(50, 50, 8);
  }

  /**
   * Starts the WebSocket server and sets up connection handling.
   */
  start(): void {
    this.wss.on("connection", (ws: Client) => {
      ws.id = nanoid();
      this.clients.push(ws);

      // Generate a new level if this is the first client
      if (this.clients.length === 1) {
        this.currentLevel = this.levelGenerator.generateLevel();
        this.spawnPointPool = [...this.currentLevel.spawnPoints];
      }

      // Send player ID to the client
      ws.send(JSON.stringify({ type: "playerId", data: ws.id }));

      // Send the current level to the client
      ws.send(JSON.stringify({ type: "level", data: this.currentLevel }));

      ws.on("error", console.error);
      ws.on("message", (message: string) => {
        this.handleMessage(ws, message);
      });
      ws.on("close", () => {
        this.removeClient(ws);
      });
    });
  }

  /**
   * Handles incoming messages from clients.
   * @param ws - The client WebSocket.
   * @param message - The message received from the client.
   */
  handleMessage(ws: Client, message: string): void {
    let msgObj: MessageObject;

    try {
      msgObj = JSON.parse(message);
    } catch (err) {
      console.error("Invalid message format detected (%s)", err);
      return;
    }

    switch (msgObj.type) {
      case "join":
        console.log(`Receiving join message: ${JSON.stringify(msgObj)}`);
        ws.name = msgObj.data.name;
        const spawnPoint = this.assignSpawnPoint();
        ws.position = spawnPoint;
        if (this.currentLevel) {
          if (!this.currentLevel.players) {
            this.currentLevel.players = [];
          }
          this.currentLevel.players.push({ ...spawnPoint, name: ws.name });
        }
        ws.send(JSON.stringify({ type: "spawn", data: spawnPoint }));
        console.log(`Player ${ws.name} has connected.`);
        break;
      case "leave":
        // TODO: Handle player leaving
        break;
      case "move":
        // TODO: Handle player movement
        break;
      case "collect":
        this.handleCollect(ws, msgObj.data);
        break;
      default:
        console.error(
          "Unknown message type (%s) found in message (%s).",
          msgObj.type,
          msgObj.data
        );
    }
  }

  /**
   * Handle a player informing us of item collection
   * @param ws - The client session which informed us of the pickup
   * @param data - The collectible which was picked up
   */
  handleCollect(
    ws: Client,
    data: { x: number; y: number; type: number }
  ): void {
    console.log(
      `Player ${ws.id} collected a pickup at (${data.x}, ${data.y}) of type ${data.type}`
    );

    if (this.currentLevel) {
      // Remove the collected pickup from the level data
      this.currentLevel.pickups = this.currentLevel.pickups.filter(
        (pickup) =>
          !(
            pickup.x === data.x &&
            pickup.y === data.y &&
            pickup.type === data.type
          )
      );

      // Notify all clients about the updated collectibles
      this.broadcast({ type: "collectibles", data: this.currentLevel.pickups });
    }
  }

  /**
   * Broadcasts a message to all connected clients.
   * @param message - The message to broadcast.
   */
  broadcast(message: MessageObject): void {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Query the spawn pool for an available point.
   * @returns The next available spawn point.
   */
  assignSpawnPoint(): { x: number; y: number } {
    if (this.spawnPointPool.length > 0) {
      return this.spawnPointPool.pop()!;
    }
    return { x: 0, y: 0 };
  }

  /**
   * Removes a client from the server and handles cleanup if no clients are connected.
   * @param ws - The client WebSocket to remove.
   */
  removeClient(ws: Client): void {
    this.clients.splice(this.clients.indexOf(ws), 1);
    if (this.clients.length === 0) {
      this.currentLevel = null;
      this.spawnPointPool = [];
    } else if (this.currentLevel) {
      this.currentLevel.players = this.currentLevel.players.filter(
        (player) => player.name !== ws.name
      );
    }
  }

  /**
   * Adds a message to the chat log.
   * @param msg - The message to add to the chat log.
   */
  enqueueMsg(msg: string): void {
    this.chatLog.push(msg);
  }
}
