import { ConfigIniParser } from "config-ini-parser";
import { readFile } from "fs";

import { GameSocketServer } from "./src/gameSocketServer";

function myMain() {
  console.log("Launching RC Server under the following configuration:");
  const parser = new ConfigIniParser();
  const fp = readFile("./config.ini", "utf8", (err, data) => {
    if (err) {
      throw new Error(err.message);
    }
    parser.parse(data);
    console.log(parser.stringify());
    const IP = parser.get("Connection", "IP");
    const PORT = parser.get("Connection", "PORT");

    const GSS = new GameSocketServer({ "host" : URL, "port": PORT });
    GSS.start();
  });
}

if (import.meta.url.endsWith(process.argv[1])) {
  try {
    myMain();
  } catch (err) {
    console.error(err);
  }
}
