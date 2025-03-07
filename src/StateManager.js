class StateManager {
  constructor() {
    this._player = { health: 100, bodyParts: [{ name: "Head", status: "healthy" }, { name: "Arm", status: "healthy" }, { name: "Leg", status: "healthy" }] };
    this._currentRoom = "RoomScene";
    this._roomStates = {};
    this._currentEnemy = null;
    this._combatActive = false;
    this._nextPlayerX = null;
    this._nextPlayerY = null;
    this._nextRoomId = null;
    this._callingSceneKey = 'RoomScene';
    this._rooms = {
      room1: { entities: {} },
      room2: { entities: {} },
      room3: { entities: {} }
    };
    this._roomsData = {}; // Central repository for room data
  }

  // Player data getters/setters
  get playerHealth() { return this._player.health; }
  set playerHealth(value) { this._player.health = value; }
  getPlayerData() { return { ...this._player }; }
  setPlayerData(data) { this._player = { ...this._player, ...data }; }

  // Room management
  get currentRoom() { return this._currentRoom; }
  set currentRoom(roomName) { this._currentRoom = roomName; }
  
  get currentRoomId() { return this._nextRoomId; }
  set currentRoomId(id) { this._nextRoomId = id; }
  
  get nextRoomId() { return this._nextRoomId; }
  set nextRoomId(id) { this._nextRoomId = id; }
  
  get nextPlayerX() { return this._nextPlayerX; }
  set nextPlayerX(x) { this._nextPlayerX = x; }
  
  get nextPlayerY() { return this._nextPlayerY; }
  set nextPlayerY(y) { this._nextPlayerY = y; }
  
  get callingSceneKey() { return this._callingSceneKey; }
  set callingSceneKey(key) { this._callingSceneKey = key; }
  
  // Combat state
  get combatActive() { return this._combatActive; }
  set combatActive(active) { this._combatActive = active; }
  
  get currentEnemy() { return this._currentEnemy; }
  set currentEnemy(enemy) { this._currentEnemy = enemy; }

  // Room data
  get roomsData() { return this._roomsData; }
  set roomsData(data) { this._roomsData = data; }
  
  get rooms() { return this._rooms; }
  
  // Room state methods
  getRoomState(roomName) { return this._roomStates[roomName]?.entities || {}; }
  
  setRoomState(roomName, entityId, state) {
    if (!this._roomStates[roomName]) this._roomStates[roomName] = { entities: {} };
    this._roomStates[roomName].entities[entityId] = {
      ...this._roomStates[roomName].entities[entityId],
      ...state
    };
  }
  
  setRoomEntities(roomName, entities) {
    if (!this._rooms[roomName]) this._rooms[roomName] = { entities: {} };
    this._rooms[roomName].entities = entities;
  }
  
  getRoomEntities(roomName) {
    return this._rooms[roomName]?.entities || {};
  }
  
  updateRoomEntity(roomName, entityId, data) {
    if (!this._rooms[roomName]) this._rooms[roomName] = { entities: {} };
    this._rooms[roomName].entities[entityId] = {
      ...this._rooms[roomName].entities[entityId],
      ...data
    };
  }

  // Persistence
  saveToLocalStorage() {
    const saveData = {
      player: this._player,
      currentRoom: this._currentRoom,
      roomStates: this._roomStates,
      rooms: this._rooms,
      currentEnemy: this._currentEnemy,
      combatActive: this._combatActive,
      nextPlayerX: this._nextPlayerX,
      nextPlayerY: this._nextPlayerY,
      nextRoomId: this._nextRoomId,
      callingSceneKey: this._callingSceneKey,
      roomsData: this._roomsData
    };
    localStorage.setItem("dreamlands_save", JSON.stringify(saveData));
    console.log("Game state saved to localStorage");
    return saveData;
  }
  
  loadFromLocalStorage() {
    const saveData = JSON.parse(localStorage.getItem("dreamlands_save"));
    if (saveData) {
      this._player = saveData.player || this._player;
      this._currentRoom = saveData.currentRoom || this._currentRoom;
      this._roomStates = saveData.roomStates || this._roomStates;
      this._rooms = saveData.rooms || this._rooms;
      this._currentEnemy = saveData.currentEnemy || this._currentEnemy;
      this._combatActive = saveData.combatActive || this._combatActive;
      this._nextPlayerX = saveData.nextPlayerX || this._nextPlayerX;
      this._nextPlayerY = saveData.nextPlayerY || this._nextPlayerY;
      this._nextRoomId = saveData.nextRoomId || this._nextRoomId;
      this._callingSceneKey = saveData.callingSceneKey || this._callingSceneKey;
      this._roomsData = saveData.roomsData || this._roomsData;
      console.log("Game state loaded from localStorage");
      return true;
    }
    console.log("No saved game found in localStorage");
    return false;
  }
  
  // Helper to check if a save exists
  hasSavedGame() {
    return localStorage.getItem("dreamlands_save") !== null;
  }
  
  // Helper to delete a save
  deleteSavedGame() {
    localStorage.removeItem("dreamlands_save");
    console.log("Saved game deleted from localStorage");
  }
}

export default StateManager;