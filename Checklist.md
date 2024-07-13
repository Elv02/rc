# Multiplayer Treasure Hunting Game (Title WIP) Feature Checklist

## Overview

Tracks the features which have been delivered on as promised in the [Proposal](Proposal.md). 
The goal of this document is to provide a detailed aid/guide for testing/grading.

### Deployment Instructions for Test



### Features

| **Feature/Story**                                                                                                     | **Status** | **Test Instructions**                                                                                                                                     | **Notes/Caveats**                                                                                                                                                                                                                            |
|-----------------------------------------------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| As a player, I want to be able to<br>connect to a server to play online.                                              | COMPLETED  | After following the deployment steps,<br>you can connect to the server at the IP & Port<br>which you previously specified.                                | There is currently an unidentified bug with the Canvas and/or WebGL.<br>If upon connecting you get a black screen please give it one more try.<br>Also please ensure you are not using screen sharing as this appears<br>to trigger the bug. |
| As a player, I want to be able to<br>enter the IP of the server so I can play<br>with my friends.                     | COMPLETED  | Same as above test, you enter the connection<br>details to specify the server to connect to.                                                              |                                                                                                                                                                                                                                              |
| As a player, I want to be an active player<br>on the server I connect to.                                             | COMPLETED  | The server is actively tracking the connected player.<br>You can confirm this by checking the server console log.                                         |                                                                                                                                                                                                                                              |
| As an active player, I want to explore<br>the level to look for treasures.                                            | COMPLETED  | Once you've connected, use the arrow keys to navigate the<br>level and confirm you can see Treasure sprites.                                              |                                                                                                                                                                                                                                              |
| As an active player, I want my score to<br>be tracked as I pick up treasures so I<br>can boast about it to my rivals. | COMPLETED  | Scoring is actively tracked, and the current player<br>score can be seen in the corner of the viewport.<br>This total updates as treasures are collected. |                                                                                                                                                                                                                                              |
| As an active player, I want to be able<br>to disconnect from the game session and<br>return to the main menu.         | COMPLETED  | While in game, hit ESC to return to the main menu.                                                                                                        |                                                                                                                                                                                                                                              |

## Implementation

### Tech Stack

- **WS:** A Server/Client node package for Web Sockets
- **Phaser:** Client-side library for game development
- **Express:** Server-side library for serving assets

### Scenemap

The Phaser client will be broken into specific 'scenes' (analogous to pages):

- **Boot:**
  - Quick loading of assets for the load screen
- **Preload:**
  - Load game assets
- **MainMenu:**
  - Provides player options (connect, options if applicable)
- **Game:**
  - The main scene of the application, handling game rendering and input once a connection is established

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
