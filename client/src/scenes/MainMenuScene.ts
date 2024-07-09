import Phaser from "phaser";
import GameScene from "./GameScene";

class MainMenuScene extends Phaser.Scene {
  private ipAddressInput: HTMLInputElement | undefined;
  private displayNameInput: HTMLInputElement | undefined;
  private portInput: HTMLInputElement | undefined;
  private connectButton: HTMLButtonElement | undefined;
  private menuContainer: HTMLDivElement | undefined;
  private socket: WebSocket | undefined;

  constructor() {
    super({ key: "MainMenuScene" });
  }

  preload(): void {
    // Preload any assets if needed
  }

  create(): void {
    // Create menu text in Phaser
    this.add.text(
      this.scale.width / 2 - 86,
      this.scale.height / 2 - 128,
      "Main Menu",
      { fontSize: "32px", color: "#fff" }
    );

    // Create UI elements dynamically
    this.createUIElements();

    // Handle connect button click
    this.connectButton!.addEventListener("click", () => {
      const ipAddress = this.ipAddressInput!.value;
      const port = this.portInput!.value;
      const displayName = this.displayNameInput!.value;

      if (!ipAddress && !port) {
        alert("Please enter a valid IP address and port.");
      }

      if (!displayName){
        alert("Please enter a display name");
      }

      console.log(`Connecting to server at ${ipAddress}:${port}`);
      this.createWebSocketSession(ipAddress, port, displayName);
      this.menuContainer!.style.display = "none";

      // Start game scene
      this.scene.start("GameScene", {socket: this.socket});
    });
  }

  createUIElements(): void {
    // Dynamically create and style the input fields and buttons
    this.menuContainer = document.createElement("div");
    this.menuContainer.id = "menu-container";

    document.body.appendChild(this.menuContainer);

    // Create IP address input
    this.ipAddressInput = document.createElement("input");
    this.ipAddressInput.type = "text";
    this.ipAddressInput.placeholder = "Enter IP address";
    this.menuContainer.appendChild(this.ipAddressInput);

    // Create port input
    this.portInput = document.createElement("input");
    this.portInput.type = "text";
    this.portInput.placeholder = "Enter Port";
    this.menuContainer.appendChild(this.portInput);

    // Create display name input
    this.displayNameInput = document.createElement("input");
    this.displayNameInput.type = "text";
    this.displayNameInput.placeholder = "Enter Display Name";
    this.menuContainer.appendChild(this.displayNameInput);

    // Create connect button
    this.connectButton = document.createElement("button");
    this.connectButton.innerText = "Connect";
    this.menuContainer.appendChild(this.connectButton);

    // Style the elements
    this.menuContainer.style.position = "absolute";
    this.menuContainer.style.top = "50%";
    this.menuContainer.style.left = "50%";
    this.menuContainer.style.transform = "translate(-50%, -50%)";
    this.menuContainer.style.display = "flex";
    this.menuContainer.style.flexDirection = "column";
    this.menuContainer.style.justifyContent = "center";
    this.menuContainer.style.alignItems = "center";
    this.menuContainer.style.background = "rgba(0, 0, 0, 0.7)";
    this.menuContainer.style.padding = "20px";
    this.menuContainer.style.borderRadius = "10px";

    this.ipAddressInput.style.marginBottom = "10px";
    this.portInput.style.marginBottom = "10px";
    this.displayNameInput.style.marginBottom = "10px";
    this.connectButton.style.marginBottom = "10px";
  }

  createWebSocketSession(ipAddress: string, port: string, displayName: string): void {
    const url = `ws://${ipAddress}:${port}/game-ws`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connection established.");
      this.socket!.send(
        JSON.stringify({ type: "join", data: displayName })
      );
      this.menuContainer!.style.display = "none"; // Hide the menu after connecting
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      alert(
        "Failed to connect to the server. Please check the IP address and port."
      );
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    this.socket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
    };
  }

  shutdown(): void {
    // Clean up dynamically created elements
    const menuContainer = document.getElementById("menu-container");
    if (menuContainer) {
      menuContainer.remove();
    }
  }
}

export default MainMenuScene;
