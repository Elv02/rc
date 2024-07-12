/**
 * Interface representing the level data.
 */
export interface LevelData {
  walls: number[][];
  pickups: { x: number; y: number; type: number }[];
  spawnPoints: { x: number; y: number }[];
  players: { x: number; y: number; name: string }[];
}

/**
 * LevelGenerator class generates levels with walls, pickups, and spawn points.
 */
export class LevelGenerator {
  width: number;
  height: number;
  numPlayers: number;
  tileSize: number;

  /**
   * Creates an instance of LevelGenerator.
   * @param width - The width of the level in tiles.
   * @param height - The height of the level in tiles.
   * @param numPlayers - The number of players for which to generate spawn points.
   * @param tileSize - The size of each tile in world (pixel) units (default: 128).
   */
  constructor(
    width: number,
    height: number,
    numPlayers: number,
    tileSize: number = 128
  ) {
    this.width = width;
    this.height = height;
    this.numPlayers = numPlayers;
    this.tileSize = tileSize;
  }

  /**
   * Generates a new level with walls, pickups, and spawn points.
   * @returns The generated level data.
   */
  generateLevel(): LevelData {
    // Initialize the level with walls
    const level = Array.from({ length: this.height }, () =>
      Array(this.width).fill(this.randomWallTexture())
    );
    const pickups: { x: number; y: number }[] = [];
    const spawnPoints: { x: number; y: number }[] = [];
    const players: { x: number; y: number; name: string }[] = [];

    /**
     * Carves out a room in the level.
     * @param x - The x position of the room.
     * @param y - The y position of the room.
     * @param w - The width of the room.
     * @param h - The height of the room.
     */
    const carveRoom = (x: number, y: number, w: number, h: number) => {
      for (let i = x; i < x + w; i++) {
        for (let j = y; j < y + h; j++) {
          if (i > 0 && i < this.width - 1 && j > 0 && j < this.height - 1) {
            level[j][i] = 0;
          }
        }
      }
    };

    /**
     * Carves out a corridor in the level.
     * @param x1 - The starting x position of the corridor.
     * @param y1 - The starting y position of the corridor.
     * @param x2 - The ending x position of the corridor.
     * @param y2 - The ending y position of the corridor.
     */
    const carveCorridor = (x1: number, y1: number, x2: number, y2: number) => {
      let x = x1;
      let y = y1;

      while (x !== x2 || y !== y2) {
        if (x !== x2) {
          x += x < x2 ? 1 : -1;
        } else if (y !== y2) {
          y += y < y2 ? 1 : -1;
        }

        if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
          level[y][x] = 0;
        }
      }
    };

    /**
     * Connects rooms with corridors.
     * @param rooms - The list of rooms to connect.
     */
    const connectRooms = (
      rooms: { x: number; y: number; w: number; h: number }[]
    ) => {
      for (let i = 0; i < rooms.length - 1; i++) {
        const roomA = rooms[i];
        const roomB = rooms[i + 1];
        const startX = Math.floor(roomA.x + roomA.w / 2);
        const startY = Math.floor(roomA.y + roomA.h / 2);
        const endX = Math.floor(roomB.x + roomB.w / 2);
        const endY = Math.floor(roomB.y + roomB.h / 2);
        carveCorridor(startX, startY, endX, endY);
      }
    };

    const rooms: { x: number; y: number; w: number; h: number }[] = [];
    const numRooms = Math.floor(Math.min(this.width, this.height) / 2);

    /**
     * Checks if a new room overlaps with any existing rooms.
     * @param x - The x position of the new room.
     * @param y - The y position of the new room.
     * @param w - The width of the new room.
     * @param h - The height of the new room.
     * @returns Whether the new room overlaps with any existing rooms.
     */
    const isOverlapping = (
      x: number,
      y: number,
      w: number,
      h: number
    ): boolean => {
      for (const room of rooms) {
        if (
          x < room.x + room.w &&
          x + w > room.x &&
          y < room.y + room.h &&
          y + h > room.y
        ) {
          return true;
        }
      }
      return false;
    };

    // Generate rooms
    for (let i = 0; i < numRooms; i++) {
      let roomWidth,
        roomHeight,
        x,
        y,
        attempts = 0;

      do {
        roomWidth = Math.floor(Math.random() * (this.width / 6)) + 3; // Room width between 3 and level width/6
        roomHeight = Math.floor(Math.random() * (this.height / 6)) + 3; // Room height between 3 and level height/6
        x = Math.floor(Math.random() * (this.width - roomWidth - 2)) + 1; // Avoid edges
        y = Math.floor(Math.random() * (this.height - roomHeight - 2)) + 1; // Avoid edges
        attempts++;
      } while (isOverlapping(x, y, roomWidth, roomHeight) && attempts < 10);

      // Set a sensible limit when attempting to place rooms - if we exceeded it, skip it
      if (attempts < 10) {
        rooms.push({ x, y, w: roomWidth, h: roomHeight });
        carveRoom(x, y, roomWidth, roomHeight);
      }
    }

    // Connect rooms with corridors
    connectRooms(rooms);

    // Generate spawn points
    for (let i = 0; i < this.numPlayers; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * this.width);
        y = Math.floor(Math.random() * this.height);
      } while (level[y][x] !== 0);
      spawnPoints.push({
        x: x * this.tileSize + this.tileSize / 2,
        y: y * this.tileSize + this.tileSize / 2,
      });
    }

    // Generate item pickups
    const numPickups = this.numPlayers * 2;
    for (let i = 0; i < numPickups; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * this.width);
        y = Math.floor(Math.random() * this.height);
      } while (
        level[y][x] !== 0 ||
        pickups.some(
          (pickup) =>
            pickup.x === x * this.tileSize && pickup.y === y * this.tileSize
        )
      );
      pickups.push({
        x: x * this.tileSize + this.tileSize / 2,
        y: y * this.tileSize + this.tileSize / 2,
        type: Math.floor(Math.random() * 5),
      });
    }

    return { walls: level, pickups, spawnPoints, players };
  }

  /**
   * Returns a random wall texture index.
   * @returns A random wall texture index.
   */
  randomWallTexture(): number {
    const wallTextures = [
      2, 3, 11, 12, 20, 21, 29, 30, 38, 39, 47, 56, 65, 73, 74, 82, 83,
    ];
    return wallTextures[Math.floor(Math.random() * wallTextures.length)];
  }
}
