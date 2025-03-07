Description: Implement a PreloadScene to load all room JSON files at game 
start, storing them in gameState.roomsData for quick access. This balances 
initial load time with fast transitions, leveraging the small size of 
retro-style room data.

Tasks:

Create PreloadScene.js:
Define a new scene class extending Phaser.Scene.
Set the scene key to 'PreloadScene'.
Load Room JSONs:
In preload(), load JSON files for all rooms (e.g., room1.json, 
room2.json).
Example JSON structure:
json

Collapse

Wrap

Copy
{
  "id": "room1",
  "wallData": [[1,1,1,...], ...],
  "entities": [
    {"type": "enemy", "x": 5, "y": 3, "id": "enemy1"},
    {"type": "door", "x": 13, "y": 4, "id": "door_to_room2", 
"targetRoomId": "room2", "targetX": 1, "targetY": 4}
  ]
}
Store Data in gameState:
In create(), populate gameState.roomsData with loaded JSON.
Start the initial RoomScene with a default roomId (e.g., 'room1').
Update game.js:
Import and add PreloadScene to the scene array, setting it as the first 
scene.
Code Snippet:

javascript

Collapse

Wrap

Copy
// src/scenes/PreloadScene.js
class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.json('room1', 'assets/rooms/room1.json');
    this.load.json('room2', 'assets/rooms/room2.json');
    // Add more rooms as needed
  }

  create() {
    gameState.roomsData = {
      'room1': this.cache.json.get('room1'),
      'room2': this.cache.json.get('room2'),
      // Add more rooms
    };
    this.scene.start('RoomScene', { roomId: 'room1' });
  }
}
export default PreloadScene;

// src/game.js
import PreloadScene from './scenes/PreloadScene';
const config = {
  scene: [PreloadScene, RoomScene, CombatScene]
};
Acceptance Criteria:

PreloadScene loads all room JSONs without errors.
gameState.roomsData contains all room data, accessible by roomId.
The game starts with RoomScene for the initial room.
