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
}

/**
 * GameSocketServer handles WebSocket communication and manages game state.
 */
export class GameSocketServer {
  #wss: WebSocketServer;
  clients: Client[] = [];
  chatLog: string[] = [];
  currentLevel: LevelData | null = null;
  levelGenerator: LevelGenerator;

  /**
   * Creates an instance of GameSocketServer.
   * @param param0 - The host and port configuration.
   * @param callback - Optional callback function to be called after server starts.
   */
  constructor({ host, port }, callback = null) {
    this.#wss = new WebSocketServer(
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
    this.#wss.on("connection", (ws: Client) => {
      ws.id = nanoid();
      this.clients.push(ws);

      // Generate a new level if this is the first client
      if (this.clients.length === 1) {
        this.currentLevel = this.levelGenerator.generateLevel();
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
        console.log(`Player ${msgObj.data} has connected.`);
        break;
      case "leave":
        // TODO: Handle player leaving
        break;
      case "move":
        // TODO: Handle player movement
        break;
      case "collect":
        // TODO: Handle pickup collection
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
   * Removes a client from the server and handles cleanup if no clients are connected.
   * @param ws - The client WebSocket to remove.
   */
  removeClient(ws: Client): void {
    this.clients.splice(this.clients.indexOf(ws), 1);
    if (this.clients.length === 0) {
      this.currentLevel = null;
    }
  }

  /**
   * Adds a message to the chat log.
   * @param msg - The message to add to the chat log.
   */
  enqueueMsg(msg: String): void {
    this.chatLog.push(msg);
  }
}