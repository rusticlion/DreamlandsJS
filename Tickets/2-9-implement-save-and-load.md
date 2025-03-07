Description:

Ensure game state persists across sessions by saving on room transitions 
and loading at startup.

Tasks:

In transitionToScene (e.g., MainScene.js):
javascript

Collapse

Wrap

Copy
transitionToScene(door) {
  const stateManager = this.registry.get("stateManager");
  stateManager.setPlayerData({ nextX: door.getData("targetX"), nextY: 
door.getData("targetY") });
  stateManager.saveToLocalStorage();
  this.cameras.main.fadeOut(500, 0, 0, 0, () => {
    this.scene.stop();
    this.scene.start(door.getData("targetScene"));
  });
}
In game.js, ensure load on startup (already in Ticket 2).
Update createWithManualMap to use nextX/nextY:
javascript

Collapse

Wrap

Copy
const playerX = stateManager.getPlayerData().nextX * tileSize + tileSize / 
2 || /* default */;
Acceptance Criteria:

State saves on room transitions.
Game loads saved state on restart, preserving player actions.

🐱💤
