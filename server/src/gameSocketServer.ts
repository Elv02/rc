import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";

interface MessageObject extends Object {
  type: string;
  data: Object;
}

interface Client extends WebSocket {
  id: string;
}

export class GameSocketServer {
  /**
   * Real-time communication server for game functions (entity location sync, map updates, chat)
   */

  #wss: WebSocketServer;
  clients: Client[] = [];
  chatLog: String[];

  constructor({ host, port }, callback = null) {
    this.#wss = new WebSocketServer(
      {
        host: host,
        port: port,
      },
      callback
    );
  }

  start() {
    this.#wss.on("connection", (ws: Client) => {
      // Initialize new client connection
      ws.id = nanoid();
      this.clients.push(ws);

      ws.on("error", console.error);
      ws.on("message", (message: string) => {
        this.handleMessage(ws, message);
      });
      ws.on("close", () => {
        this.removeClient(ws);
      });
    });
  }

  broadcastGameState() {
    /**
     * Send the current state of the game to all connected clients
     */
  }

  handleMessage(ws: Client, message: string) {
    console.debug("Message received: %s", message);

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
        // Keeping this here in case we need to do work before the client is dc'd.
        break;
      case "move":
        break;
      case "collect":
        break;
      default:
        console.error(
          "Unknown message type (%s) found in message (%s).",
          msgObj.type,
          msgObj.data
        );
    }

    // TODO: Broadcast new state back to remaining clients?
  }

  handleJoin(ws: Client, data: Object) {}

  removeClient(ws: Client) {
    this.clients.splice(this.clients.indexOf(ws), 1);
    // TODO: Broadcast new state to remaining clients
  }

  enqueueMsg(msg: String) {
    /**
     * Add a message to the server log to be broadcast
     */
    this.chatLog.push(msg); // TODO: String formatting (Prefix with SERVER and timestamp??)
  }
}
