import { ConfigIniParser } from "config-ini-parser";
import express from "express";
import { readFile, existsSync } from "fs";
import * as http from "http";
import * as path from "path";
import { GameSocketServer } from "./src/GameSocketServer";

const __filename = path.resolve();
const __dirname = path.dirname(__filename);

/**
 * Main function to start the server and initialize configurations.
 */
function myMain() {
  console.log("Launching RC Server under the following configuration:");

  // Parse the configuration file
  const parser = new ConfigIniParser();
  readFile("./config.ini", "utf8", (err, data) => {
    if (err) {
      throw new Error(err.message);
    }
    parser.parse(data);
    console.log(parser.stringify());
    const IP = parser.get("Connections", "IP");
    const PORT = parser.get("Connections", "PORT");
    const ASSETS_IP = parser.get("Connections", "ASSETS_IP");
    const ASSETS_PORT = parser.get("Connections", "ASSETS_PORT");

    // Determine if we are in the project root or server directory
    const serverRootDir = path.join(__dirname, "server");
    let assetDir = __dirname;
    // Adjust __dirname if we are in the project root
    if (existsSync(serverRootDir)) {
      assetDir = serverRootDir;
    }

    // Create an Express app
    const app = express();
    app.use(express.static(path.join(assetDir, "asset_server")));

    // Create an HTTP server
    const httpServer = http.createServer(app);
    httpServer.listen(ASSETS_PORT, ASSETS_IP, () => {
      console.log(`HTTP server running at http://${ASSETS_IP}:${ASSETS_PORT}`);
    });

    // Create and start the GameSocketServer
    const GSS = new GameSocketServer({ host: IP, port: PORT });
    GSS.start();
  });
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    myMain();
  } catch (err) {
    console.error(err);
  }
}

export { server }; // Exporting server for TypeDoc to recognize the module
