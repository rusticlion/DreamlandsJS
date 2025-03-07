# Into the Dreamlands: Room Transition System

## Overview
The goal is to create a system for transitioning between rooms (maps) in 
"Into the Dreamlands" without loading the entire game world into memory. 
We'll extend the existing Phaser scene management to handle multiple room 
scenes, introduce "doors" as transition points, and manage entities 
(enemies, boulders, etc.) per room. The initial implementation will add 
one new room, connect it to the existing environment via doors, and ensure 
entities are loaded/unloaded efficiently.

## General Approach
- **Define Room Scenes**: Each room will be a separate Phaser scene (e.g., 
MainScene for the current room, Room2Scene for the new room).
- **Introduce Doors**: Add door entities as interactive objects that 
trigger scene transitions.
- **Manage Entities**: Use a room-specific entity registry to load/unload 
enemies, boulders, and other objects when entering/exiting rooms.
- **Handle Transitions**: Pause the current scene, load the new scene, 
position the player, and clean up the old scene's data.
- **Memory Optimization**: Destroy unused entities and assets when leaving 
a room, relying on Phaser's scene lifecycle to manage resources.

## Requirements Addressed
- **Memory Efficiency**: Only one room's data (tilemap, entities) is 
active at a time.
- **Seamless Transition**: Players move between rooms via doors with 
smooth positioning.
- **Entity Management**: Enemies and boulders are room-specific and 
reloaded when revisiting.
- **Extensibility**: The system supports adding more rooms later.

## Step-by-Step Implementation Plan

### Step 1: Define the New Room Scene (Room2Scene.js)
**Objective**: Create a new room scene as a duplicate of MainScene with a 
different layout and entities.

**Specific Instructions**:
1. Copy the entire `src/scenes/MainScene.js` file to a new file named 
`src/scenes/Room2Scene.js`.
2. Rename the class from `MainScene` to `Room2Scene` in the new file.
3. Update the manual map data in `createWithManualMap()` to reflect a 
different layout (e.g., fewer walls, different shape).

**Map Data for Room2Scene**:
```javascript
const wallData = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
```

4. Adjust the `setupEnemies()` and `setupBoulders()` methods to place 
different entities:
   - Enemies at `{ x: 7, y: 4, id: 'enemy_r2_1' }` and `{ x: 9, y: 6, id: 
'enemy_r2_2' }`.
   - Boulder at `{ x: 5, y: 5, id: 'boulder_r2_1' }`.

**Code Snippet (partial Room2Scene.js)**:
```javascript
class Room2Scene extends Phaser.Scene {
  // ... (rest of the copied code from MainScene.js) ...

  createWithManualMap() {
    // ... (same as MainScene but with new wallData above) ...
  }

  setupEnemies() {
    const enemyPositions = [
      { x: 7, y: 4, id: 'enemy_r2_1' },
      { x: 9, y: 6, id: 'enemy_r2_2' }
    ];
    enemyPositions.forEach(pos => {
      this.createEntity({
        type: 'enemy',
        gridX: pos.x,
        gridY: pos.y,
        id: pos.id,
        properties: { interactionType: 'combat', pushable: false }
      });
    });
    this.enemies = this.entities.enemies;
  }

  setupBoulders() {
    const boulderPositions = [
      { x: 5, y: 5, id: 'boulder_r2_1' }
    ];
    boulderPositions.forEach(pos => {
      this.createEntity({
        type: 'boulder',
        gridX: pos.x,
        gridY: pos.y,
        id: pos.id,
        properties: { interactionType: 'push', pushable: true }
      });
    });
  }
}

export default Room2Scene;
```

### Step 2: Register the New Scene in game.js
**Objective**: Add Room2Scene to the Phaser game configuration so it can 
be loaded.

**Specific Instructions**:
1. Open `src/game.js`.
2. Import Room2Scene at the top of the file, right after the MainScene 
import:
```javascript
import Room2Scene from './scenes/Room2Scene';
```

3. Update the scene array in the Phaser config to include Room2Scene:
```javascript
const config = {
  type: Phaser.AUTO,
  width: 240,
  height: 160,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  scene: [MainScene, CombatScene, Room2Scene]
};
```

**Code Snippet (updated game.js)**:
```javascript
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import CombatScene from './scenes/CombatScene';
import Room2Scene from './scenes/Room2Scene';

// ... (rest of gameState and error handling) ...

const config = {
  type: Phaser.AUTO,
  width: 240,
  height: 160,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  scene: [MainScene, CombatScene, Room2Scene]
};
const game = new Phaser.Game(config);
```

### Step 3: Create a Door Texture and Entity Type
**Objective**: Add a door entity type with a visual representation for 
transitions.

**Specific Instructions**:
1. Open `src/scenes/MainScene.js`.
2. Add a new method `createDoorTexture()` after `createBoulderTexture()`:
```javascript
createDoorTexture() {
  if (this.textures.exists('door')) return;
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8888ff'; // Blue door
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, 2, 4, 12); // Vertical handle
  this.textures.addCanvas('door', canvas);
}
```

3. Call `this.createDoorTexture()` in the `preload()` method, after other 
texture creations:
```javascript
preload() {
  this.createPlayerTexture();
  this.createEnemyTexture();
  this.createBoulderTexture();
  this.createDoorTexture();
  // ... (rest of preload) ...
}
```

4. Add a new method `setupDoors()` after `setupBoulders()`:
```javascript
setupDoors() {
  const doorPositions = [
    { x: 13, y: 4, id: 'door_to_room2', targetScene: 'Room2Scene', 
targetX: 1, targetY: 4 }
  ];
  doorPositions.forEach(pos => {
    this.createEntity({
      type: 'door',
      gridX: pos.x,
      gridY: pos.y,
      id: pos.id,
      properties: {
        interactionType: 'transition',
        pushable: false,
        targetScene: pos.targetScene,
        targetX: pos.targetX,
        targetY: pos.targetY
      }
    });
  });
}
```

5. Call `this.setupDoors()` in the `create()` method, after 
`setupBoulders()`:
```javascript
this.setupBoulders();
this.setupDoors();
```

### Step 4: Implement Door Transitions in MainScene.js
**Objective**: Add logic to detect door interactions and transition to the 
target scene.

**Specific Instructions**:
1. Open `src/scenes/MainScene.js`.
2. Add a new method `transitionToScene()`:
```javascript
transitionToScene(door) {
  const targetScene = door.getData('targetScene');
  const targetX = door.getData('targetX') * this.tileSize + this.tileSize 
/ 2;
  const targetY = door.getData('targetY') * this.tileSize + this.tileSize 
/ 2;
  
  // Store player position for the new scene
  gameState.nextPlayerX = targetX;
  gameState.nextPlayerY = targetY;
  
  // Fade out current scene
  this.cameras.main.fadeOut(500, 0, 0, 0, () => {
    this.scene.stop();
    this.scene.start(targetScene);
  });
}
```

3. Update the `update()` method to detect door adjacency and trigger 
transitions:
```javascript
// Check for door interactions
const adjacentDoors = this.allEntities.getChildren().filter(entity => 
  entity.getData('type') === 'door' && this.isEntityAdjacent(playerX, 
playerY, entity)
);
if (adjacentDoors.length > 0) {
  const door = adjacentDoors[0];
  if (this.cursors.space && 
Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
    this.transitionToScene(door);
    return;
  }
}
```

### Step 5: Add a Return Door in Room2Scene.js and Handle Player 
Positioning
**Objective**: Add a door back to MainScene and ensure the player spawns 
at the correct position.

**Specific Instructions**:
1. Open `src/scenes/Room2Scene.js`.
2. Copy the `createDoorTexture()` and `transitionToScene()` methods from 
MainScene.js into Room2Scene.js.
3. Call `this.createDoorTexture()` in `preload()`:
```javascript
preload() {
  this.createPlayerTexture();
  this.createEnemyTexture();
  this.createBoulderTexture();
  this.createDoorTexture();
  // ... (rest of preload) ...
}
```

4. Add `setupDoors()` with a door back to MainScene:
```javascript
setupDoors() {
  const doorPositions = [
    { x: 1, y: 4, id: 'door_to_main', targetScene: 'MainScene', targetX: 
13, targetY: 4 }
  ];
  doorPositions.forEach(pos => {
    this.createEntity({
      type: 'door',
      gridX: pos.x,
      gridY: pos.y,
      id: pos.id,
      properties: {
        interactionType: 'transition',
        pushable: false,
        targetScene: pos.targetScene,
        targetX: pos.targetX,
        targetY: pos.targetY
      }
    });
  });
}
```

5. Call `this.setupDoors()` in `create()` after `setupBoulders()`:
```javascript
this.setupBoulders();
this.setupDoors();
```

6. Update `createWithManualMap()` to use `gameState.nextPlayerX` and 
`gameState.nextPlayerY` for player positioning:
```javascript
createWithManualMap() {
  // ... (existing map creation code) ...
  
  const playerX = gameState.nextPlayerX || (1 * tileSize + tileSize / 2);
  const playerY = gameState.nextPlayerY || (1 * tileSize + tileSize / 2);
  
  this.player = this.physics.add.sprite(0, 0, 'player');
  this.player.setOrigin(0.5, 0.5);
  this.playerContainer = this.add.container(playerX, playerY);
  this.playerContainer.add(this.player);
  
  // ... (rest of camera setup) ...
}
```

7. Add the door interaction logic to `update()`, identical to 
MainScene.js:
```javascript
update() {
  // ... (existing code) ...
  
  const playerX = this.playerContainer.x;
  const playerY = this.playerContainer.y;
  
  const adjacentDoors = this.allEntities.getChildren().filter(entity => 
    entity.getData('type') === 'door' && this.isEntityAdjacent(playerX, 
playerY, entity)
  );
  if (adjacentDoors.length > 0) {
    const door = adjacentDoors[0];
    if (this.cursors.space && 
Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.transitionToScene(door);
      return;
    }
  }
  
  // ... (rest of update) ...
}
```

### Step 6: Enhance gameState for Entity Persistence (Optional)
**Objective**: Store entity states in gameState to reload them when 
revisiting rooms (e.g., moved boulders, defeated enemies).

**Specific Instructions**:
1. Open `src/game.js`.
2. Add a rooms object to gameState to track entity states:
```javascript
const gameState = {
  player: {
    health: 100,
    bodyParts: [
      { name: 'Head', status: 'healthy' },
      { name: 'Arm', status: 'healthy' },
      { name: 'Leg', status: 'healthy' }
    ]
  },
  currentEnemy: null,
  combatActive: false,
  nextPlayerX: null,
  nextPlayerY: null,
  rooms: {
    MainScene: { entities: {} },
    Room2Scene: { entities: {} }
  }
};
```

3. Open `src/scenes/MainScene.js`.
4. Update `createEntity()` to store entity data in gameState:
```javascript
createEntity(config) {
  // ... (existing code) ...
  const entity = this.add.sprite(pixelX, pixelY, config.type);
  // ... (existing setup) ...
  
  const sceneName = this.scene.key;
  gameState.rooms[sceneName].entities[config.id] = {
    type: config.type,
    gridX: config.gridX,
    gridY: config.gridY,
    properties: config.properties,
    active: true
  };
  
  return entity;
}
```

5. Update `startCombat()` to mark enemies as defeated:
```javascript
startCombat(enemy) {
  // ... (existing code) ...
  gameState.rooms[this.scene.key].entities[enemy.getData('id')].active = 
false;
}
```

6. Modify `setupEnemies()`, `setupBoulders()`, and `setupDoors()` to check 
gameState:
```javascript
setupEnemies() {
  const sceneName = this.scene.key;
  const enemyPositions = [
    { x: 5, y: 3, id: 'enemy1' },
    { x: 10, y: 7, id: 'enemy2' },
    { x: 3, y: 7, id: 'enemy3' },
    { x: 2, y: 2, id: 'enemy_test' }
  ];
  enemyPositions.forEach(pos => {
    const storedEntity = gameState.rooms[sceneName].entities[pos.id];
    if (!storedEntity || storedEntity.active) {
      this.createEntity({
        type: 'enemy',
        gridX: storedEntity?.gridX || pos.x,
        gridY: storedEntity?.gridY || pos.y,
        id: pos.id,
        properties: { interactionType: 'combat', pushable: false }
      });
    }
  });
  this.enemies = this.entities.enemies;
}
```

## Acceptance Criteria
- A new room (Room2Scene) exists with a unique layout and entities.
- Doors in MainScene and Room2Scene allow transitioning between rooms when 
the player presses Space while adjacent.
- The player spawns at the correct position when entering a room.
- Entities (enemies, boulders) are loaded only for the active room and 
cleaned up when leaving.
- Memory usage remains low by unloading inactive scenes.
