import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import PreloadScene from "./scenes/PreloadScene";
import MainMenuScene from "./scenes/MainMenuScene";
import GameScene from "./scenes/GameScene";

import "./styles.css";

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById(
    "start-game"
  ) as HTMLButtonElement;
  const menu = document.getElementById("menu") as HTMLDivElement;

  // Event listener for start button
  if (startButton && menu) {
    startButton.addEventListener("click", () => {
      // Hide the menu
      menu.classList.add("hidden");
      // Initialize your game
      startGame();
    });
  }
});

function startGame() {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: "game-container",
    scene: [BootScene, PreloadScene, MainMenuScene, GameScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
      },
    },
    fps: {
      target: 60,
      forceSetTimeOut: true,
    },
  };

  const game = new Phaser.Game(config);
}

export default startGame;
