Description:

Create a StateManager class to centralize game state management, replacing 
the ad-hoc gameState object. Include methods for player data, room states, 
and persistence.

Tasks:

Define StateManager in a new file (src/StateManager.js):
javascript

Collapse

Wrap

Copy
class StateManager {
  constructor() {
    this._player = { health: 100, bodyParts: [{ name: "Head", status: 
"healthy" }, /* ... */ ] };
    this._currentRoom = "MainScene";
    this._roomStates = {};
  }

  // Player data getters/setters
  get playerHealth() { return this._player.health; }
  set playerHealth(value) { this._player.health = value; }
  getPlayerData() { return { ...this._player }; }
  setPlayerData(data) { this._player = { ...this._player, ...data }; }

  // Room state methods
  getRoomState(roomName) { return this._roomStates[roomName]?.entities || 
{}; }
  setRoomState(roomName, entityId, state) {
    if (!this._roomStates[roomName]) this._roomStates[roomName] = { 
entities: {} };
    this._roomStates[roomName].entities[entityId] = {
      ...this._roomStates[roomName].entities[entityId],
      ...state
    };
  }

  // Persistence
  saveToLocalStorage() {
    const saveData = {
      player: this._player,
      currentRoom: this._currentRoom,
      roomStates: this._roomStates
    };
    localStorage.setItem("dreamlands_save", JSON.stringify(saveData));
  }
  loadFromLocalStorage() {
    const saveData = JSON.parse(localStorage.getItem("dreamlands_save"));
    if (saveData) {
      this._player = saveData.player;
      this._currentRoom = saveData.currentRoom;
      this._roomStates = saveData.roomStates;
    }
  }
}
export default StateManager;
Ensure roomStates uses entity IDs as keys for modifications.
Acceptance Criteria:

StateManager class exists with methods for player data and room states.
Getters/setters mimic gameState properties (e.g., playerHealth).
saveToLocalStorage serializes state; loadFromLocalStorage restores it.

🐱💤
