Description: Modify door entities to use targetRoomId instead of 
targetScene, integrating with the single RoomScene approach.

Tasks:

Update Room JSONs:
Replace targetScene with targetRoomId in door definitions.
Modify createEntity:
Set door data with targetRoomId.
Revise transitionToScene:
Start 'RoomScene' with the target roomId and player position:
javascript

Collapse

Wrap

Copy
transitionToScene(door) {
  gameState.nextRoomId = door.getData('targetRoomId');
  gameState.nextPlayerX = door.getData('targetX') * this.tileSize + 
this.tileSize / 2;
  gameState.nextPlayerY = door.getData('targetY') * this.tileSize + 
this.tileSize / 2;
  this.cameras.main.fadeOut(500, 0, 0, 0, () => {
    this.scene.stop();
    this.scene.start('RoomScene');
  });
}
Handle Initial Room in RoomScene:
Use gameState.nextRoomId or default to 'room1' in init().
Acceptance Criteria:

Doors transition to the correct room using targetRoomId.
Player spawns at the specified targetX/Y in the new room.
Transitions are smooth with no scene overlap.
