# Multiplayer Treasure Hunting Game (Title WIP)

## Overview

Play online with your friends and compete to collect the most treasure in the time provided! Dive into a retro '90s shooter' inspired environment with modern multiplayer capabilities.

### Problem

We all love games, especially those we can enjoy with our friends. I've always been a fan of the nostalgic '90s shooter' vibe and wanted to create something utilizing raycasting, and to add on top the challenge of multiplayer to cap it off.

### User Profile

- Gamers who:
  - Enjoy playing online games
  - Have friends, acquaintances, or rivals to compete with

### Features

- **Connectivity:**
  - As a player, I want to be able to connect to a server to play online.
  - As a player, I want to be able to enter the IP of the server so I can play with my friends.
  - As a player, I want to be an active player on the server I connect to.

- **Gameplay:**
  - As an active player, I want to explore the level to look for treasures.
  - As an active player, I want to be able to pick up/interact with treasure.
  - As an active player, I want my score to be tracked as I pick up treasures so I can lord it over my rivals.
  - As an active player, I want to be able to disconnect from the game session and return to the main menu.

## Implementation

### Tech Stack

- **WS:** A Server/Client node package for Web Sockets
- **Phaser:** Client-side library for game development
- **Express:** Server-side library for serving assets
- **MySQL (Nice-to-have):** For backend high score tracking

### APIs

- No external APIs are used for this project.

### Scenemap

The Phaser client is broken into seperate 'scenes' (analogous to pages):

- **Boot:**
  - Quick loading of assets for the load screen
- **Preload:**
  - Load game assets
- **MainMenu:**
  - Provides player options (connect, options if applicable)
- **Game:**
  - The main scene of the application, handling game rendering and input once a connection is established

### Mockups

The following illustrates some examples of raycasting (examples from this project will be added as they are completed).
Non-project sources are from Lodev (https://lodev.org/cgtutor)

![A simple untextured raycast scene](https://lodev.org/cgtutor/images/raycasteruntextured.gif)

A simple untextured raycast scene.  Notice that the environment is made of distinct blocks which all have sharp 90 degree corners.

![An example of basic texture mapping applied alongside the raycast technique](https://lodev.org/cgtutor/images/raycasttexture2.gif)

Textures can be applied to surfaces to help make them destinct and to identify landmarks, features, and interactive elements

![An example of sprite rendering in a raycasted scene](https://lodev.org/cgtutor/images/raycastsprites2.jpg)

Textures/sprites can also be drawn as 'world objects' to add detail, and to represent key gameplay elements (interactive items, enemies, etc.)

### Data (Nice-to-Have)

For high score tracking in a backend database:

| Player ID | Player Name | Score | Time          |
|-----------|-------------|-------|---------------|
| 1         | Bob         | 115   | 1720115049    |
| 2         | John        | 90    | 1720115049    |
| 3         | Alice       | 145   | 1720115049    |

### Endpoints

#### Websocket
Websocket messages will all land on the root of the server (e.g., ws://192.168.0.1). The deciding factor will be the attached message type field.

- **Type: JOIN**
  - Request to join a game server
  - Must be the _first_ message sent by the client on a new connection
  - Server will respond affirmatively to indicate if the client can continue

- **Type: MOVE**
  - Inform the server of movement by the player

- **Type: LEAVE**
  - Inform the server when a player wishes to disconnect
  - Ensures a clean disconnect instead of allowing the connection to timeout

- **Type: UPDATE**
  - Issued by the server to the clients, includes an update of the new game state (items, player scores, and player positions)

### Auth

- Not applicable for this project.

## Roadmap

- Setup project repository
- Create boilerplate for Phaser client 
- Create boilerplate for Express server
- Feature: Implement basic WebSocket server-client communication
- Feature: Add asset loading to Preload scene
- Feature: Add connect option to the MainMenu scene
- Feature: Basic level layout
- Feature: Player movement
- Feature: Render player view ("first person")
- Feature: Implement treasure pickup and player scoring
- Feature: Track and display individual player scores in game
- Feature: Add a disconnect button for players to return to the main menu
- Conduct playtesting
- Fix bugs
- Prepare for demo presentation

## Nice-to-haves

- High score tracking in a MySQL database
- Additional levels or environments
- Power-ups and special items
