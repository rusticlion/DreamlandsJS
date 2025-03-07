Description:

Modify entity setup in scenes to apply room state modifications and update 
StateManager when entities change.

Tasks:

Update setupEnemies (e.g., in MainScene.js):
javascript

Collapse

Wrap

Copy
setupEnemies() {
  const stateManager = this.registry.get("stateManager");
  const roomState = stateManager.getRoomState(this.scene.key);
  const defaultEnemies = [
    { x: 5, y: 3, id: "enemy1" },
    { x: 10, y: 7, id: "enemy2" }
  ];
  defaultEnemies.forEach(config => {
    const state = roomState[config.id];
    if (!state || !state.defeated) {
      this.createEntity({
        type: "enemy",
        gridX: state?.x || config.x,
        gridY: state?.y || config.y,
        id: config.id,
        properties: { interactionType: "combat", pushable: false }
      });
    }
  });
  this.enemies = this.entities.enemies;
}
Update startCombat to mark enemies defeated:
javascript

Collapse

Wrap

Copy
startCombat(enemy) {
  const stateManager = this.registry.get("stateManager");
  stateManager.setRoomState(this.scene.key, enemy.getData("id"), { 
defeated: true });
  /* ... existing combat launch ... */
}
Update tryPushEntity for boulders:
javascript

Collapse

Wrap

Copy
tryPushEntity(entity, direction) {
  /* ... existing logic ... */
  if (isPushable) {
    const stateManager = this.registry.get("stateManager");
    stateManager.setRoomState(this.scene.key, entity.getData("id"), {
      x: targetTileX,
      y: targetTileY
    });
    /* ... move entity ... */
  }
}
Acceptance Criteria:

Entities load with modified states (e.g., defeated enemies don’t respawn, 
boulders stay moved).
Changes persist when revisiting rooms.

🐱💤
