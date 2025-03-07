Description: Consolidate MainScene and Room2Scene into a generic RoomScene 
that uses roomId to load room-specific data from gameState.roomsData. This 
eliminates the need for multiple scene classes.

Tasks:

Create RoomScene.js:
Define a new scene class with key 'RoomScene'.
Add an init(data) method to receive roomId.
Load Room Data:
In create(), fetch roomData from gameState.roomsData[this.roomId].
Use createWithManualMap() or createWithTiledMap() based on data.
Handle Player Positioning:
Use gameState.nextPlayerX/Y for transitions, defaulting to a starting 
position.
Create Entities:
Merge initial entity data with gameState.rooms[roomId].entities for 
persistence.
Example:
javascript

Collapse

Wrap

Copy
create() {
  this.roomId = this.roomId || 'room1';
  gameState.currentRoomId = this.roomId;
  const roomData = gameState.roomsData[this.roomId];
  const entityStates = gameState.rooms[this.roomId]?.entities || {};
  // Map creation...
  roomData.entities.forEach(initial => {
    const state = entityStates[initial.id] || initial;
    if (state.active !== false) this.createEntity(state);
  });
}
Update game.js:
Replace MainScene and Room2Scene with RoomScene.
Acceptance Criteria:

RoomScene loads any room’s data based on roomId.
Player spawns at the correct position after transitions.
Entities reflect persisted states (e.g., defeated enemies don’t respawn).
