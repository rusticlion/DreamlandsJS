Description:

Replace window.gameState with StateManager, updating all scenes to use it 
via Phaser’s registry.

Tasks:

In game.js:
javascript

Collapse

Wrap

Copy
import StateManager from './StateManager';
const stateManager = new StateManager();
stateManager.loadFromLocalStorage();
const config = { /* ... */ };
const game = new Phaser.Game(config);
game.registry.set("stateManager", stateManager);
Update scenes (e.g., MainScene.js, Room2Scene.js, CombatScene.js):
Replace const gameState = window.gameState with const stateManager = 
this.registry.get('stateManager').
Update references (e.g., gameState.player.health → 
stateManager.playerHealth).
Remove window.gameState after all references are updated.
Acceptance Criteria:

Game runs without errors using stateManager.
Scenes access and modify state via stateManager (e.g., health updates in 
CombatScene).
