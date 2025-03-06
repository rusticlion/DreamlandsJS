# Into the Dreamlands: Combat System Prototype

## Description

Implement a prototype combat system for "Into the Dreamlands" that 
establishes the foundational structure for initiating combat, 
transitioning between scenes, and managing data flow. This ticket focuses 
on setting up the framework—combat triggers in the exploration scene, 
transitions to a dedicated combat scene, and basic state updates—using 
placeholder mechanics rather than deep gameplay details. The system will 
leverage Phaser's scene management and physics capabilities.

## Status: ✅ Completed

## Stretch Goal Completed: Entity Management System

As a stretch goal, we implemented a flexible entity management system that:
1. Provides a unified way to create and manage different types of game entities
2. Supports various entity states and behaviors
3. Introduced Sokoban-style pushable boulders
4. Serves as a foundation for future entity types (NPCs, items, etc.)

## Visual Context

- **Background**: A teal-green rectangular area fills the main workspace, 
representing the exploration environment.
- **Border**: A uniform, two-tile-thick brown border surrounds the 
teal-green area, creating a framed effect (inspired by the pixel-art tile 
grid).
- **Player Character**: A minimalistic sprite with a beige square head 
(featuring two black dot eyes) and a brown L-shaped body (two vertical 
blocks for torso, one horizontal for an arm).
- **Enemy/Object**: A simple brown rectangular shape (two horizontal 
blocks), representing an enemy or interactive element.
- **Combat Indicator**: A gray circular object with a darker outline 
(e.g., a coin or button), symbolizing the combat trigger or outcome.

## Tasks

### Create Global Game State

- Define a `gameState` object in `game.js` to store shared data between 
scenes.
- Include player attributes (health, body parts) and the current enemy.

**Code Example**:
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
  currentEnemy: null
};
```

### Set Up Exploration Scene

- In `MainScene.js`, create player and enemy sprites using Phaser's 
physics system.
- Detect player-enemy overlap to initiate combat, pausing the exploration 
scene and launching the combat scene.

**Code Example**:
```javascript
this.physics.add.overlap(this.player, this.enemy, this.startCombat, null, 
this);
```

```javascript
startCombat(player, enemy) {
  gameState.currentEnemy = enemy;
  this.scene.pause();
  this.scene.launch('combatScene');
}
```

### Create Combat Scene

- Develop `CombatScene.js` with basic UI (e.g., text for health, buttons 
for win/lose).
- Load player and enemy data from `gameState`.
- Implement placeholder victory/defeat logic, updating `gameState` and 
resuming the exploration scene.

**Code Example**:
```javascript
endCombat(victory) {
  if (victory) {
    gameState.player.health = Math.min(100, gameState.player.health + 
20);
    gameState.currentEnemy.destroy();
  } else {
    gameState.player.health = Math.max(0, gameState.player.health - 20);
    const part = gameState.player.bodyParts[Math.floor(Math.random() * 
gameState.player.bodyParts.length)];
    part.status = 'damaged';
  }
  gameState.currentEnemy = null;
  this.scene.stop();
  this.scene.resume('mainScene');
}
```

### Integrate Scenes in Main Game

- Configure Phaser in `game.js` to manage both `MainScene` and 
`CombatScene`.

**Code Example**:
```javascript
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [MainScene, CombatScene]
};
const game = new Phaser.Game(config);
```

### Add Basic Event Handling (Optional)

- Set up an event emitter in `CombatScene.js` to signal outcomes to 
`MainScene.js`.

**Code Example**:
```javascript
this.events.emit('combatEnd', { victory: true, player: gameState.player 
});
```

### Implement Victory and Defeat Logic

- **Victory**: Heal player health by 20 (max 100), remove the enemy 
sprite.
- **Defeat**: Reduce player health by 20 (min 0), randomly damage a body 
part.

### Add Visual Feedback

- Highlight the enemy sprite (e.g., change tint to burgundy) when the 
player is near.
- Post-combat: Reflect damaged body parts visually (e.g., update player 
sprite, future task).

## Testing

- Verify combat triggers on player-enemy overlap.
- Ensure player data loads correctly in the combat scene.
- Confirm outcomes update `gameState` and reflect in the exploration 
scene.

## Acceptance Criteria

1. **Combat Trigger**: Combat initiates when the player sprite overlaps 
an enemy sprite.
2. **Scene Transition**: Exploration scene pauses, and the combat scene 
launches seamlessly.
3. **Data Flow**: Player health and body part data are accessible in the 
combat scene.
4. **Outcome Handling**: Victory/defeat updates `gameState` (e.g., health 
changes, enemy removal), visible upon returning to exploration.
5. **Scene Resumption**: Exploration scene resumes correctly after combat 
concludes.

🐱💤
