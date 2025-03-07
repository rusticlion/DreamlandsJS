import Phaser from 'phaser';
import { checkHealth, getMessages, getMessagesByLevel, createMessage } from '../api/client';

class RoomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RoomScene' });
    this.player = null;
    this.joystick = {
      pointer: null,
      position: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
      isActive: false,
      force: 0,
      angle: 0
    };
    this.cursors = null;
    this.tileSize = 16; // Define tile size as 16 pixels
    this.isMoving = false; // Flag to prevent movement during transitions
    this.joystickBase = null;
    this.joystickThumb = null;
    this.currentDirection = 'down'; // Track player direction
    this.roomId = null; // Current room ID
  }
  
  // Initialize the scene with room ID
  init(data) {
    // Use gameState.nextRoomId if available, otherwise use data.roomId or default to 'room1'
    const gameState = window.gameState;
    this.roomId = gameState.nextRoomId || data.roomId || 'room1';
    
    // Clear the nextRoomId so it doesn't affect future scene starts
    gameState.nextRoomId = null;
    
    console.log(`Initializing RoomScene with roomId: ${this.roomId}`);
  }

  preload() {
    // No assets to preload here - all assets are loaded in PreloadScene
  }

  create() {
    console.log(`Creating room: ${this.roomId}`);
    
    // Update gameState's current room ID
    const gameState = window.gameState;
    gameState.currentRoomId = this.roomId;
    
    // Ensure room state exists in gameState
    if (!gameState.rooms[this.roomId]) {
      gameState.rooms[this.roomId] = { entities: {} };
    }
    
    // Get room data from gameState
    const roomData = gameState.roomsData[this.roomId];
    
    if (!roomData) {
      console.error(`No room data found for roomId: ${this.roomId}`);
      this.add.text(120, 80, `Error: Room "${this.roomId}" not found!`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#ff0000'
      }).setOrigin(0.5);
      return;
    }
    
    // Create a simple gray background as fallback
    this.add.rectangle(120, 80, 240, 160, 0x333333);
    
    // Create the map using manual room data
    this.createWithManualMap(roomData.wallData);
    
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Set up virtual joystick
    this.setupJoystick();
    
    // Check API health and set up message functionality
    this.setupMessagingSystem();
    
    // Initialize entity registry
    this.initializeEntityRegistry();
    
    // Create entities from room data
    this.setupEntitiesFromRoomData(roomData);
    
    // Set up combat-related listeners
    this.setupCombatListeners();
    
    // Add health display
    this.setupPlayerHealthDisplay();
    
    // Add room info display
    this.setupRoomInfoDisplay();
    
    // Apply camera fade in effect
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
  
  initializeEntityRegistry() {
    // Create groups to manage different entity types
    this.entities = {
      enemies: this.add.group(),
      boulders: this.add.group(),
      doors: this.add.group(),
      // Future entity types can be added here
    };
    
    // Master list of all entities
    this.allEntities = this.add.group();
  }
  
  async setupMessagingSystem() {
    // Check API health
    try {
      const healthStatus = await checkHealth();
      console.log('Backend health status:', healthStatus);
      
      // Display a small indicator in the corner to show backend status
      const statusColor = healthStatus.status === 'ok' ? 0x00ff00 : 0xff0000;
      const statusDot = this.add.circle(230, 10, 4, statusColor);
      statusDot.setScrollFactor(0); // Fix position on screen
      
      // Add status text that appears on hover
      const statusText = this.add.text(200, 15, 'API: ' + healthStatus.status, { 
        font: '8px Arial', 
        fill: '#ffffff' 
      });
      statusText.setScrollFactor(0);
      statusText.setVisible(false);
      
      // Show text on hover
      statusDot.setInteractive();
      statusDot.on('pointerover', () => statusText.setVisible(true));
      statusDot.on('pointerout', () => statusText.setVisible(false));
      
      // Fetch existing messages
      this.loadExistingMessages();
    } catch (error) {
      console.error('Failed to connect to backend:', error);
    }
    
    // Set up message creation
    this.setupMessageCreation();
  }
  
  async loadExistingMessages() {
    try {
      // Default to 'default' level if not specified
      const currentLevel = 'default'; 
      const messages = await getMessagesByLevel(currentLevel);
      
      console.log(`Loaded ${messages.length} messages for level ${currentLevel}`);
      
      // Create message markers on the map
      messages.forEach(message => this.createMessageMarker(message));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }
  
  createMessageMarker(message) {
    // Create a message marker at the specified coordinates
    const marker = this.add.circle(message.x, message.y, 5, 0xffff00, 0.7);
    
    // Make it interactive
    marker.setInteractive();
    
    // Store the message data directly on the marker for easy access
    marker.messageData = message;
    
    // Show message text on hover
    marker.on('pointerover', () => {
      this.showMessageBox(message);
    });
    
    // Remove popup when mouse leaves
    marker.on('pointerout', () => {
      this.hideMessageBox();
    });
    
    return marker;
  }
  
  showMessageBox(message) {
    // Hide any existing message box first
    this.hideMessageBox();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Calculate the area for the message box (bottom third of the screen)
    const boxHeight = Math.floor(gameHeight / 3);
    const boxY = gameHeight - boxHeight/2;
    
    // Create a dark background across the bottom of the screen
    const background = this.add.rectangle(
      gameWidth/2, 
      boxY,
      gameWidth, 
      boxHeight,
      0x000000, 
      0.85
    );
    background.setScrollFactor(0);
    
    // Create a border for the message box
    const border = this.add.rectangle(
      gameWidth/2,
      boxY,
      gameWidth - 4,
      boxHeight - 4,
      0x000000,
      0
    );
    border.setStrokeStyle(1, 0x888888);
    border.setScrollFactor(0);
    
    // Format the message text
    let textContent = message.text;
    
    // Calculate maximum height for message text (leave room for metadata at bottom)
    const maxTextHeight = boxHeight - 20; 
    
    // Create message text with retro font
    const messageText = this.add.text(
      20, 
      gameHeight - boxHeight + 10,
      textContent, 
      { 
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#ffffff',
        wordWrap: { width: gameWidth - 40 },
        lineSpacing: 8
      }
    );
    messageText.setScrollFactor(0);
    
    // Calculate bottom position for metadata (add a divider line)
    const metadataY = gameHeight - 15;
    
    // Add a separator line above the metadata
    const separator = this.add.line(
      gameWidth/2, 
      metadataY - 5,
      0, 
      0, 
      gameWidth - 40, 
      0, 
      0x444444
    );
    separator.setScrollFactor(0);
    
    // Add location info - pinned to bottom left
    const locationInfo = this.add.text(
      15,
      metadataY,
      `LOC: ${Math.floor(message.x)},${Math.floor(message.y)}`,
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '5px',
        fill: '#88ff88'
      }
    );
    locationInfo.setScrollFactor(0);
    
    // Add timestamp if available - pinned to bottom right
    if (message.timestamp) {
      const date = new Date(message.timestamp);
      
      // Format date as YYYY-MM-DD HH:MM in more compact form
      const timeString = `${date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })} ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
      
      const timeText = this.add.text(
        gameWidth - 15,
        metadataY,
        timeString,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: '5px',
          fill: '#aaaaaa'
        }
      );
      timeText.setOrigin(1, 0); // Align to right
      timeText.setScrollFactor(0);
      
      // Store reference
      this.messageBoxTimeText = timeText;
    }
    
    // Store references to destroy later
    this.messageBoxBackground = background;
    this.messageBoxBorder = border;
    this.messageBoxText = messageText;
    this.messageBoxLocation = locationInfo;
    this.messageBoxSeparator = separator;
  }
  
  hideMessageBox() {
    // Clean up all message box elements
    if (this.messageBoxBackground) {
      this.messageBoxBackground.destroy();
      this.messageBoxBackground = null;
    }
    
    if (this.messageBoxBorder) {
      this.messageBoxBorder.destroy();
      this.messageBoxBorder = null;
    }
    
    if (this.messageBoxText) {
      this.messageBoxText.destroy();
      this.messageBoxText = null;
    }
    
    if (this.messageBoxLocation) {
      this.messageBoxLocation.destroy();
      this.messageBoxLocation = null;
    }
    
    if (this.messageBoxTimeText) {
      this.messageBoxTimeText.destroy();
      this.messageBoxTimeText = null;
    }
    
    if (this.messageBoxSeparator) {
      this.messageBoxSeparator.destroy();
      this.messageBoxSeparator = null;
    }
  }
  
  setupEntitiesFromRoomData(roomData) {
    if (!roomData || !roomData.entities) {
      console.error('Room data has no entities array');
      return;
    }
    
    const gameState = window.gameState;
    const persistedEntities = gameState.rooms[this.roomId]?.entities || {};
    
    // Process each entity from room data
    roomData.entities.forEach(initialData => {
      // Convert raw room data format to entity config format
      const x = initialData.x;
      const y = initialData.y;
      const id = initialData.id;
      const type = initialData.type;
      const properties = initialData.properties || {};
      
      // Check if entity has persisted state data
      const persistedState = persistedEntities[id];
      
      // Skip creating entity if it's been marked as inactive (e.g., defeated enemy)
      if (persistedState && persistedState.active === false) {
        console.log(`Skipping inactive entity: ${id}`);
        return;
      }
      
      // Create the entity with either persisted or initial data
      this.createEntity({
        type: type,
        gridX: x,
        gridY: y,
        id: id,
        properties: properties
      });
    });
    
    // Set up backward compatibility references
    this.enemies = this.entities.enemies;
  }
  
  // Generic entity creation method
  createEntity(config) {
    // Convert grid coordinates to pixel coordinates
    const pixelX = config.gridX * this.tileSize + this.tileSize/2;
    const pixelY = config.gridY * this.tileSize + this.tileSize/2;
    
    // Create sprite with the appropriate texture
    const entity = this.add.sprite(pixelX, pixelY, config.type);
    entity.setOrigin(0.5, 0.5);
    
    // Store entity data
    entity.setData('id', config.id);
    entity.setData('type', config.type);
    entity.setData('originalX', pixelX);
    entity.setData('originalY', pixelY);
    entity.setData('gridX', config.gridX);
    entity.setData('gridY', config.gridY);
    entity.setData('state', 'idle');
    
    // Store any custom properties
    if (config.properties) {
      Object.entries(config.properties).forEach(([key, value]) => {
        entity.setData(key, value);
      });
      
      // Make sure we're using the correct property for doors
      if (config.type === 'door' && config.properties.targetRoomId) {
        // Make sure targetRoomId is properly set for doors
        entity.setData('targetRoomId', config.properties.targetRoomId);
      }
    }
    
    // Add to appropriate group
    if (this.entities[config.type + 's']) {
      this.entities[config.type + 's'].add(entity);
    }
    
    // Add to master entities list
    this.allEntities.add(entity);
    
    // Store entity data in gameState
    const gameState = window.gameState;
    
    if (gameState.rooms && gameState.rooms[this.roomId]) {
      gameState.rooms[this.roomId].entities[config.id] = {
        type: config.type,
        gridX: config.gridX,
        gridY: config.gridY,
        properties: config.properties,
        active: true
      };
    }
    
    return entity;
  }
  
  setupCombatListeners() {
    // Ensure the player container has a physics body for easier detection in update()
    if (this.playerContainer) {
      // Make sure the player's physics body is set up correctly
      this.physics.world.enable(this.playerContainer);
      
      // Use a larger hitbox for better detection
      const bodySize = this.tileSize * 1.5;
      this.playerContainer.body.setSize(bodySize, bodySize);
      
      // Center the body on the player sprite
      this.playerContainer.body.setOffset(-bodySize/2, -bodySize/2);
      
      // Add collision between player and enemies
      this.physics.add.collider(this.playerContainer, this.enemies);
    }
    
    // Add listeners for the CombatScene events
    this.events.on('resumeFromCombat', (data) => {
      console.log(`RoomScene (${this.roomId}) resumed with data:`, data);
      
      // Update scene based on combat results
      if (data && data.victory) {
        // Use the stored enemy reference directly
        if (this._currentCombatEnemy && this._currentCombatEnemy.active) {
          console.log('Removing enemy with ID:', this._currentCombatEnemy.getData('id'));
          
          // Remove from all entity collections
          this.entities.enemies.remove(this._currentCombatEnemy);
          this.allEntities.remove(this._currentCombatEnemy);
          
          // Update gameState to mark this enemy as inactive
          const enemyId = this._currentCombatEnemy.getData('id');
          const gameState = window.gameState;
          
          if (gameState.rooms && gameState.rooms[this.roomId] && 
              gameState.rooms[this.roomId].entities[enemyId]) {
            gameState.rooms[this.roomId].entities[enemyId].active = false;
          }
          
          // Destroy the enemy sprite
          this._currentCombatEnemy.destroy();
          
          // Clear the reference
          this._currentCombatEnemy = null;
          
          console.log('Enemy removed successfully');
        } else {
          console.error('No active enemy reference found to remove');
        }
        
        // Show victory message
        this.showCombatResult('VICTORY!', '#88ff88');
      } else {
        // Show defeat message
        this.showCombatResult('DEFEAT!', '#ff8888');
        
        // Clear combat enemy reference on defeat
        this._currentCombatEnemy = null;
      }
      
      // Update health display
      this.updateHealthDisplay();
    });
  }
  
  setupPlayerHealthDisplay() {
    // Get reference to global gameState
    const gameState = window.gameState;
    
    // Create a health display container in the top-right corner
    const healthContainer = this.add.container(220, 10);
    healthContainer.setScrollFactor(0); // Fixed on screen
    
    // Create a background for the health display
    const healthBg = this.add.rectangle(0, 0, 40, 16, 0x000000, 0.7);
    healthBg.setStrokeStyle(1, 0x888888);
    
    // Create health icon
    const healthIcon = this.add.text(-15, 0, '♥', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fill: '#ff8888'
    }).setOrigin(0.5);
    
    // Create health text
    this.healthText = this.add.text(5, 0, gameState.player.health.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // Add all elements to the container
    healthContainer.add([healthBg, healthIcon, this.healthText]);
  }
  
  // Set up room info display
  setupRoomInfoDisplay() {
    // Create a room info display in the bottom-left corner
    const roomInfoContainer = this.add.container(20, 150);
    roomInfoContainer.setScrollFactor(0); // Fixed on screen
    
    // Create a background for the room info display
    const roomInfoBg = this.add.rectangle(0, 0, 60, 16, 0x000000, 0.7);
    roomInfoBg.setStrokeStyle(1, 0x888888);
    
    // Create room info text
    this.roomInfoText = this.add.text(5, 0, `ROOM: ${this.roomId}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // Add all elements to the container
    roomInfoContainer.add([roomInfoBg, this.roomInfoText]);
  }

  updateHealthDisplay() {
    // Get reference to global gameState
    const gameState = window.gameState;
    
    // Update health text
    if (this.healthText) {
      this.healthText.setText(gameState.player.health.toString());
      
      // Change color based on health status
      if (gameState.player.health < 30) {
        this.healthText.setFill('#ff8888');
      } else if (gameState.player.health < 60) {
        this.healthText.setFill('#ffff88');
      } else {
        this.healthText.setFill('#88ff88');
      }
    }
    
    // Check damaged body parts and update player appearance if needed
    const damagedParts = gameState.player.bodyParts.filter(part => part.status === 'damaged');
    if (damagedParts.length > 0) {
      // For now, just tint the player red to indicate damage
      if (this.player) {
        this.player.setTint(0xff8888);
      }
    }
  }
  
  showCombatResult(resultText, color) {
    // Create a text displaying the combat result
    const resultDisplay = this.add.text(
      120, 
      80, 
      resultText, 
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '16px',
        fill: color,
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, stroke: true, fill: true }
      }
    ).setOrigin(0.5);
    resultDisplay.setScrollFactor(0);
    
    // Add a simple animation
    this.tweens.add({
      targets: resultDisplay,
      scale: { from: 2, to: 1 },
      alpha: { from: 1, to: 0 },
      y: { from: 70, to: 60 },
      duration: 1500,
      ease: 'Power2',
      onComplete: () => resultDisplay.destroy()
    });
  }
  
  // Helper method for entity adjacency detection
  isEntityAdjacent(playerX, playerY, entity) {
    // Convert pixel positions to tile positions
    const playerTileX = Math.floor(playerX / this.tileSize);
    const playerTileY = Math.floor(playerY / this.tileSize);
    const entityTileX = Math.floor(entity.x / this.tileSize);
    const entityTileY = Math.floor(entity.y / this.tileSize);
    
    // Check if adjacent horizontally or vertically (not diagonally)
    // This means the difference in x OR y is 1, but not both
    const xDiff = Math.abs(playerTileX - entityTileX);
    const yDiff = Math.abs(playerTileY - entityTileY);
    
    // Adjacent means exactly one of these is true:
    // 1. They're in the same row but adjacent columns (xDiff=1, yDiff=0)
    // 2. They're in the same column but adjacent rows (xDiff=0, yDiff=1)
    return (xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1);
  }
  
  // Get the grid direction from source to target
  getDirectionBetweenTiles(srcX, srcY, targetX, targetY) {
    // Determine the direction from source to target
    if (targetX > srcX) return 'right';
    if (targetX < srcX) return 'left';
    if (targetY > srcY) return 'down';
    if (targetY < srcY) return 'up';
    return null; // Same position
  }
  
  // Try to push an entity in the given direction
  tryPushEntity(entity, direction) {
    // Get current grid position of the entity
    const entityTileX = Math.floor(entity.x / this.tileSize);
    const entityTileY = Math.floor(entity.y / this.tileSize);
    
    // Calculate target position based on direction
    let targetTileX = entityTileX;
    let targetTileY = entityTileY;
    
    switch (direction) {
      case 'left':
        targetTileX -= 1;
        break;
      case 'right':
        targetTileX += 1;
        break;
      case 'up':
        targetTileY -= 1;
        break;
      case 'down':
        targetTileY += 1;
        break;
    }
    
    // Convert target position to world position
    const targetX = targetTileX * this.tileSize + this.tileSize / 2;
    const targetY = targetTileY * this.tileSize + this.tileSize / 2;
    
    // Check if target tile is walkable
    let isPushable = true;
    
    // Check for wall collisions
    if (this.tilemapMode === 'tiled' && this.map && this.objectLayer) {
      try {
        const targetTile = this.map.getTileAt(targetTileX, targetTileY, false, 'Objects');
        isPushable = !targetTile || targetTile.index === 0;
      } catch (error) {
        isPushable = false;
      }
    } else if (this.tilemapMode === 'manual' && this.mapData) {
      // Check bounds first
      if (targetTileX >= 0 && targetTileX < 15 && targetTileY >= 0 && targetTileY < 10) {
        isPushable = this.mapData[targetTileY][targetTileX] === 0;
      } else {
        isPushable = false;
      }
    }
    
    // Check for entity collisions at target position
    if (isPushable && this.allEntities) {
      const blockingEntities = this.allEntities.getChildren().filter(other => {
        const otherTileX = Math.floor(other.x / this.tileSize);
        const otherTileY = Math.floor(other.y / this.tileSize);
        return otherTileX === targetTileX && otherTileY === targetTileY;
      });
      
      if (blockingEntities.length > 0) {
        isPushable = false;
      }
    }
    
    // If pushable, move the entity
    if (isPushable) {
      // Update entity's grid position
      entity.setData('gridX', targetTileX);
      entity.setData('gridY', targetTileY);
      
      // Move entity with a smooth tween
      this.tweens.add({
        targets: entity,
        x: targetX,
        y: targetY,
        duration: 200,
        ease: 'Power1',
        onComplete: () => {
          // Update entity's original position for state management
          entity.setData('originalX', targetX);
          entity.setData('originalY', targetY);
        }
      });
      
      return true;
    }
    
    return false;
  }
  
  // Enemy state management methods
  transitionEnemyToAlert(enemy) {
    // Set state to alert
    enemy.setData('state', 'alert');
    
    // Apply visual changes for alert state
    enemy.setTint(0xFF0000);
    
    // Start bobbing animation
    enemy.wobble = this.tweens.add({
      targets: enemy,
      y: enemy.y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }
  
  transitionEnemyToIdle(enemy) {
    // Set state to idle
    enemy.setData('state', 'idle');
    
    // Stop bobbing animation
    if (enemy.wobble) {
      enemy.wobble.stop();
      enemy.wobble = null;
    }
    
    // Reset visual appearance
    enemy.clearTint();
    
    // Reset position to original grid position
    const originalX = enemy.getData('originalX');
    const originalY = enemy.getData('originalY');
    
    // Use a quick tween to move back to original position
    this.tweens.add({
      targets: enemy,
      x: originalX,
      y: originalY,
      duration: 150,
      ease: 'Power1'
    });
  }
  
  createCombatPrompt(enemy) {
    // Create a very visible prompt in the center of the screen
    const promptBg = this.add.rectangle(
      120, // Center X
      20,  // Top of screen
      200, // Wide enough for text
      20,  // Tall enough for text
      0xFF0000, // Bright red
      0.8
    ).setOrigin(0.5);
    promptBg.setScrollFactor(0); // Fixed on screen
    
    // Add bold text
    const promptText = this.add.text(
      120, // Center X
      20,  // Top of screen
      'PRESS SPACE TO FIGHT!',
      {
        fontFamily: 'Arial',
        fontSize: '10px',
        fontStyle: 'bold',
        fill: '#FFFFFF',
      }
    ).setOrigin(0.5);
    promptText.setScrollFactor(0); // Fixed on screen
    
    // Make it pulse for attention
    this.tweens.add({
      targets: [promptBg, promptText],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1
    });
    
    // Store both for cleanup
    this.combatPrompt = { bg: promptBg, text: promptText };
  }
  
  startCombat(enemy) {
    // Get reference to global gameState
    const gameState = window.gameState;
    
    // Clean up any combat prompt
    if (this.combatPrompt) {
      this.combatPrompt.bg.destroy();
      this.combatPrompt.text.destroy();
      this.combatPrompt = null;
    }
    
    // Clean up any enemy animation state 
    if (enemy.wobble) {
      enemy.wobble.stop();
      enemy.wobble = null;
    }
    
    // Debug log the enemy ID we're storing
    const enemyId = enemy.getData('id');
    console.log('Starting combat with enemy ID:', enemyId);
    
    // Store a direct reference to the enemy object for easier retrieval
    this._currentCombatEnemy = enemy;
    
    // Set combat state
    gameState.combatActive = true;
    gameState.currentEnemy = {
      id: enemyId,
      type: 'basic',
      health: 50
    };
    
    // Store the calling scene key
    gameState.callingSceneKey = this.scene.key;
    
    // Show a combat indicator (visual feedback)
    const combatText = this.add.text(
      enemy.x,
      enemy.y - 20,
      'COMBAT!',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        fill: '#ffffff',
        backgroundColor: '#880000',
        padding: { x: 4, y: 2 }
      }
    ).setOrigin(0.5);
    
    // Fade out and destroy after 1 second
    this.tweens.add({
      targets: combatText,
      alpha: 0,
      y: enemy.y - 30,
      duration: 1000,
      onComplete: () => combatText.destroy()
    });
    
    // Pause this scene and start combat scene
    this.scene.pause();
    this.scene.launch('CombatScene');
    this.scene.bringToTop('CombatScene');
  }
  
  // Scene transition method for doors
  transitionToScene(door) {
    // Get target from door properties
    const targetRoomId = door.getData('targetRoomId') || 'room1';
    const targetX = door.getData('targetX') * this.tileSize + this.tileSize / 2;
    const targetY = door.getData('targetY') * this.tileSize + this.tileSize / 2;
    
    console.log(`Transitioning to room: ${targetRoomId} at (${targetX}, ${targetY})`);
    
    // Store room and player position for the new scene
    const gameState = window.gameState;
    gameState.nextRoomId = targetRoomId;
    gameState.nextPlayerX = targetX;
    gameState.nextPlayerY = targetY;
    
    // Fade out current scene
    this.cameras.main.fadeOut(500, 0, 0, 0, () => {
      this.scene.stop();
      this.scene.start('RoomScene'); // No need to pass roomId, it will use gameState.nextRoomId
    });
  }

  update() {
    // Skip all processing if we're moving between tiles
    if (this.isMoving || !this.playerContainer) return;
    
    // PART 1: ENTITY DETECTION AND STATE MANAGEMENT
    
    // Initialize variables for entity tracking
    let closestEnemy = null;
    let minDistance = Infinity;
    
    // Get player position from the container
    const playerX = this.playerContainer.x;
    const playerY = this.playerContainer.y;
    const playerGridX = Math.floor(playerX / this.tileSize);
    const playerGridY = Math.floor(playerY / this.tileSize);
    
    // Process all entities
    if (this.allEntities && this.allEntities.getChildren().length > 0) {
      this.allEntities.getChildren().forEach(entity => {
        // Calculate distance using manual formula
        const dx = playerX - entity.x;
        const dy = playerY - entity.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const entityType = entity.getData('type');
        const currentState = entity.getData('state');
        
        // Track closest enemy for combat
        if (entityType === 'enemy' && distance < minDistance) {
          closestEnemy = entity;
          minDistance = distance;
        }
        
        // Handle entity-specific state changes based on adjacency
        const isAdjacent = this.isEntityAdjacent(playerX, playerY, entity);
        
        if (entityType === 'enemy') {
          if (isAdjacent && currentState === 'idle') {
            // Transition enemy to alert state when adjacent
            this.transitionEnemyToAlert(entity);
          } else if (!isAdjacent && currentState === 'alert') {
            // Transition back to idle state when not adjacent
            this.transitionEnemyToIdle(entity);
          }
        } else if (entityType === 'boulder') {
          // Boulder-specific state changes (highlighting when adjacent)
          if (isAdjacent && currentState === 'idle') {
            // Highlight boulder when adjacent
            entity.setTint(0xAAAAAA);
            entity.setData('state', 'highlighted');
          } else if (!isAdjacent && currentState === 'highlighted') {
            // Remove highlight when not adjacent
            entity.clearTint();
            entity.setData('state', 'idle');
          }
        }
      });
    }
    
    // PART 2: COMBAT PROMPT MANAGEMENT
    
    // Show/hide combat prompt based on adjacency to closest enemy
    const enemyIsAdjacent = closestEnemy && this.isEntityAdjacent(playerX, playerY, closestEnemy);
    
    if (enemyIsAdjacent && !this.combatPrompt) {
      // Show combat prompt if adjacent and not already showing
      this.createCombatPrompt(closestEnemy);
    } else if (!enemyIsAdjacent && this.combatPrompt) {
      // Hide combat prompt if not adjacent but showing
      this.combatPrompt.bg.destroy();
      this.combatPrompt.text.destroy();
      this.combatPrompt = null;
    }
    
    // Check for door interactions
    const adjacentDoors = this.allEntities.getChildren().filter(entity => 
      entity.getData('type') === 'door' && this.isEntityAdjacent(playerX, playerY, entity)
    );
    
    if (adjacentDoors.length > 0) {
      const door = adjacentDoors[0];
      
      // Show door interaction prompt if not already shown
      if (!this.doorPrompt) {
        this.showDoorPrompt(door);
      }
      
      // Handle door transition
      if (this.cursors.space && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.transitionToScene(door);
        return;
      }
    } else if (this.doorPrompt) {
      // Hide door prompt when not adjacent to a door
      this.hideDoorPrompt();
    }
    
    // Check for spacebar press to start combat
    if (this.cursors && this.cursors.space && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      if (enemyIsAdjacent) {
        this.startCombat(closestEnemy);
        return; // Skip rest of update if we're entering combat
      }
    }
    
    // PART 3: PLAYER MOVEMENT
    
    // Handle keyboard movement
    let direction = null;
    
    if (this.cursors.left.isDown) {
      direction = 'left';
    } else if (this.cursors.right.isDown) {
      direction = 'right';
    } else if (this.cursors.up.isDown) {
      direction = 'up';
    } else if (this.cursors.down.isDown) {
      direction = 'down';
    }
    
    // Handle joystick movement
    if (!direction && this.joystick.isActive && this.joystick.force > 0.5) {
      const angle = this.joystick.angle;
      // Convert angle to direction
      if (angle >= -Math.PI/4 && angle < Math.PI/4) {
        direction = 'right';
      } else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
        direction = 'down';
      } else if (angle >= 3*Math.PI/4 || angle < -3*Math.PI/4) {
        direction = 'left';
      } else {
        direction = 'up';
      }
    }
    
    // If we have a direction, update current direction and move
    if (direction) {
      this.currentDirection = direction;
      this.movePlayer(direction);
    }
  }
  
  setupMessageCreation() {
    // Create a key binding for message creation (M key)
    const mKey = this.input.keyboard.addKey('M');
    
    mKey.on('down', () => {
      // Stop player movement
      this.isMoving = true;
      
      // Create a dark overlay
      const overlay = this.add.rectangle(120, 80, 240, 160, 0x000000, 0.7);
      overlay.setScrollFactor(0);
      
      // Add a text prompt
      const promptText = this.add.text(50, 60, 'Enter your message:', { 
        fontFamily: '"Press Start 2P"',
        fontSize: '8px', 
        fill: '#ffffff' 
      });
      promptText.setScrollFactor(0);
      
      // Create an input text box (simulated)
      const inputBox = this.add.rectangle(120, 90, 180, 20, 0x333333);
      inputBox.setScrollFactor(0);
      
      // Add a nice border to the input box
      const inputBorder = this.add.rectangle(120, 90, 184, 24, 0x000000, 0);
      inputBorder.setStrokeStyle(2, 0x888888);
      inputBorder.setScrollFactor(0);
      
      // Initialize empty input text
      let currentInput = '';
      
      const inputText = this.add.text(45, 85, '', { 
        fontFamily: '"Press Start 2P"',
        fontSize: '8px', 
        fill: '#ffffff' 
      });
      inputText.setScrollFactor(0);
      
      // Character counter
      const charCounter = this.add.text(180, 85, '0/40', { 
        fontFamily: '"Press Start 2P"',
        fontSize: '6px', 
        fill: '#aaaaaa' 
      });
      charCounter.setScrollFactor(0);
      
      // Instructions
      const instructions = this.add.text(20, 120, 'ENTER: Post | ESC: Cancel', { 
        fontFamily: '"Press Start 2P"',
        fontSize: '6px', 
        fill: '#ffffff' 
      });
      instructions.setScrollFactor(0);
      
      // Function to update the text display
      const updateTextDisplay = () => {
        // Update the text display
        inputText.setText(currentInput);
        
        // Update character counter
        charCounter.setText(`${currentInput.length}/30`);
        
        // Change counter color when approaching limit
        if (currentInput.length > 20) {
          charCounter.setFill('#ff9900');
        } else if (currentInput.length > 25) {
          charCounter.setFill('#ff0000');
        } else {
          charCounter.setFill('#aaaaaa');
        }
      };
      
      // Create a listener that will be active only while the dialog is open
      const keyboardInput = (event) => {
        if (event.keyCode === 27) { // ESC key
          // Cancel and clean up
          cleanup();
        } else if (event.keyCode === 13) { // ENTER key
          // Post the message
          if (currentInput.trim() !== '') {
            this.postMessage(currentInput.trim());
          }
          
          // Clean up
          cleanup();
        } else if (event.keyCode === 8) { // BACKSPACE key
          // Remove the last character
          currentInput = currentInput.slice(0, -1);
          updateTextDisplay();
        } else if (event.key.length === 1) { // Regular text input
          // Limit message length (reduced to 30 for the retro font)
          if (currentInput.length < 30) {
            currentInput += event.key;
            updateTextDisplay();
          }
        }
      };
      
      // Function to clean up all UI elements
      const cleanup = () => {
        // Disable the listener first to prevent memory leaks
        this.input.keyboard.off('keydown', keyboardInput);
        
        // Clean up UI elements
        overlay.destroy();
        promptText.destroy();
        inputBox.destroy();
        inputBorder.destroy();
        inputText.destroy();
        charCounter.destroy();
        instructions.destroy();
        
        // Allow movement again
        this.isMoving = false;
      };
      
      // Register the keyboard input handler
      this.input.keyboard.on('keydown', keyboardInput);
    });
  }
  
  async postMessage(text) {
    // Create a message at the player's current position
    const message = {
      text: text,
      x: this.playerContainer.x,
      y: this.playerContainer.y,
      level: 'default' // Default level
    };
    
    try {
      const createdMessage = await createMessage(message);
      console.log('Message posted successfully:', createdMessage);
      
      // Create a marker for the new message
      this.createMessageMarker(createdMessage);
      
      // Create a retro-style notification box
      const notificationBg = this.add.rectangle(
        this.playerContainer.x, 
        this.playerContainer.y - 20,
        120, 
        20, 
        0x000000, 
        0.8
      );
      
      const notificationBorder = this.add.rectangle(
        this.playerContainer.x, 
        this.playerContainer.y - 20,
        122, 
        22, 
        0x000000, 
        0
      );
      notificationBorder.setStrokeStyle(1, 0x88ff88);
      
      // Show confirmation text
      const confirmation = this.add.text(
        this.playerContainer.x - 55, 
        this.playerContainer.y - 24, 
        'Message posted!', 
        { 
          fontFamily: '"Press Start 2P"', 
          fontSize: '6px', 
          fill: '#88ff88' 
        }
      );
      
      // Fade out and destroy after 2 seconds
      this.tweens.add({
        targets: [notificationBg, notificationBorder, confirmation],
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          notificationBg.destroy();
          notificationBorder.destroy();
          confirmation.destroy();
        }
      });
      
    } catch (error) {
      console.error('Error posting message:', error);
      
      // Create a retro-style notification box
      const errorBg = this.add.rectangle(
        this.playerContainer.x, 
        this.playerContainer.y - 20,
        140, 
        20, 
        0x000000, 
        0.8
      );
      
      const errorBorder = this.add.rectangle(
        this.playerContainer.x, 
        this.playerContainer.y - 20,
        142, 
        22, 
        0x000000, 
        0
      );
      errorBorder.setStrokeStyle(1, 0xff8888);
      
      // Show error notification
      const errorText = this.add.text(
        this.playerContainer.x - 65, 
        this.playerContainer.y - 24, 
        'Error posting message', 
        { 
          fontFamily: '"Press Start 2P"', 
          fontSize: '6px', 
          fill: '#ff8888' 
        }
      );
      
      // Fade out and destroy after 2 seconds
      this.tweens.add({
        targets: [errorBg, errorBorder, errorText],
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          errorBg.destroy();
          errorBorder.destroy();
          errorText.destroy();
        }
      });
    }
  }
  
  createWithManualMap(wallData) {
    console.log(`Creating manual map for room: ${this.roomId}`);
    
    if (!wallData) {
      console.error('No wall data provided for manual map creation');
      return;
    }
    
    // Define map dimensions (assuming 15x10 from the example)
    const mapWidth = wallData[0].length;
    const mapHeight = wallData.length;
    const tileSize = this.tileSize;
    
    // Create wall and floor graphics
    let wallColor = 0x663931;
    let floorColor = 0x73a373;
    
    // Use different colors for each room for visual distinction
    if (this.roomId === 'room2') {
      wallColor = 0x316639;
      floorColor = 0x737373;
    } else if (this.roomId === 'room3') {
      wallColor = 0x663366;
      floorColor = 0x996699;
    }
    
    // Create the map data
    this.mapData = [];
    
    // Create a container to hold all tile visuals
    this.tileContainer = this.add.container(0, 0);
    
    // Create graphics for visualization
    for (let y = 0; y < mapHeight; y++) {
      this.mapData[y] = [];
      for (let x = 0; x < mapWidth; x++) {
        // Calculate tile center position
        const tileX = x * tileSize + tileSize/2;
        const tileY = y * tileSize + tileSize/2;
        
        // Add floor tile
        const floorTile = this.add.rectangle(tileX, tileY, tileSize, tileSize, floorColor);
        this.tileContainer.add(floorTile);
        
        // If it's a wall, add a wall tile
        const isWall = wallData[y][x] === 1;
        this.mapData[y][x] = isWall ? 1 : 0;
        
        if (isWall) {
          const wallTile = this.add.rectangle(tileX, tileY, tileSize, tileSize, wallColor);
          this.tileContainer.add(wallTile);
          
          // Add a border to make the collision boundaries visible
          const border = this.add.rectangle(tileX, tileY, tileSize, tileSize, 0xffffff, 0);
          border.setStrokeStyle(1, 0x000000, 0.3);
          this.tileContainer.add(border);
        }
      }
    }
    
    // Get player position from gameState or use default
    const gameState = window.gameState;
    const startTileX = 1;
    const startTileY = 1;
    const playerX = gameState.nextPlayerX || (startTileX * tileSize + tileSize/2);
    const playerY = gameState.nextPlayerY || (startTileY * tileSize + tileSize/2);
    
    // Create the player sprite
    this.player = this.physics.add.sprite(0, 0, 'player');
    
    if (!this.textures.exists('player')) {
      // Create a placeholder player if sprite is not available
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(-8, -8, 16, 16);
      graphics.generateTexture('placeholder_player', 16, 16);
      this.player.setTexture('placeholder_player');
    }
    
    // Set player origin to center
    this.player.setOrigin(0.5, 0.5);
    
    // Create a container to hold the player
    this.playerContainer = this.add.container(playerX, playerY);
    this.playerContainer.add(this.player);
    
    // Set up camera to follow player container
    this.cameras.main.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
    this.cameras.main.startFollow(this.playerContainer, true, 0.1, 0.1);
    
    // Store map info
    this.tilemapMode = 'manual';
    
    // Reset the nextPlayerX and nextPlayerY
    gameState.nextPlayerX = null;
    gameState.nextPlayerY = null;
  }

  // Show prompt for door interaction
  showDoorPrompt(door) {
    // Create a prompt to show the player can use the door
    const targetRoomId = door.getData('targetRoomId') || 'unknown room';
    const promptBg = this.add.rectangle(
      120, // Center X
      40,  // Top area of screen
      180, // Wide enough for text
      20,  // Tall enough for text
      0x0088FF, // Blue for doors
      0.8
    ).setOrigin(0.5);
    promptBg.setScrollFactor(0); // Fixed on screen
    
    // Add text showing where door leads
    const promptText = this.add.text(
      120, // Center X
      40,  // Top area of screen
      `PRESS SPACE TO ENTER ${targetRoomId.toUpperCase()}`,
      {
        fontFamily: 'Arial',
        fontSize: '8px',
        fontStyle: 'bold',
        fill: '#FFFFFF',
      }
    ).setOrigin(0.5);
    promptText.setScrollFactor(0); // Fixed on screen
    
    // Make it pulse for attention
    this.tweens.add({
      targets: [promptBg, promptText],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Store both for cleanup
    this.doorPrompt = { bg: promptBg, text: promptText };
  }
  
  // Hide door prompt
  hideDoorPrompt() {
    if (this.doorPrompt) {
      this.doorPrompt.bg.destroy();
      this.doorPrompt.text.destroy();
      this.doorPrompt = null;
    }
  }
  
  setupJoystick() {
    // Check if we're on a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Only create joystick on touch devices
    if (isTouchDevice) {
      // Create the joystick base in the bottom left corner
      this.joystickBase = this.add.circle(60, 120, 20, 0x888888, 0.5);
      this.joystickBase.setScrollFactor(0); // Fixed position on screen
      
      // Create the joystick thumb
      this.joystickThumb = this.add.circle(60, 120, 10, 0xcccccc, 0.8);
      this.joystickThumb.setScrollFactor(0); // Fixed position on screen
      
      // Handle pointer down event for joystick
      this.input.on('pointerdown', (pointer) => {
        // Only activate if clicking near the joystick
        const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickBase.x, this.joystickBase.y);
        if (distance <= 40) {
          this.joystick.pointer = pointer;
          this.joystick.position = { x: pointer.x, y: pointer.y };
          this.joystick.startPosition = { x: this.joystickBase.x, y: this.joystickBase.y };
          this.joystick.isActive = true;
        }
      });
      
      // Handle pointer move event for joystick
      this.input.on('pointermove', (pointer) => {
        if (this.joystick.isActive && this.joystick.pointer && this.joystick.pointer.id === pointer.id) {
          this.joystick.position = { x: pointer.x, y: pointer.y };
          
          // Calculate joystick properties
          const dx = this.joystick.position.x - this.joystick.startPosition.x;
          const dy = this.joystick.position.y - this.joystick.startPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Limit the joystick movement radius
          const maxDistance = 20;
          
          if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            this.joystick.position.x = this.joystick.startPosition.x + maxDistance * Math.cos(angle);
            this.joystick.position.y = this.joystick.startPosition.y + maxDistance * Math.sin(angle);
          }
          
          // Update thumb position
          this.joystickThumb.x = this.joystick.position.x;
          this.joystickThumb.y = this.joystick.position.y;
          
          // Update joystick properties
          this.joystick.force = distance / maxDistance;
          this.joystick.angle = Math.atan2(
            this.joystick.position.y - this.joystick.startPosition.y,
            this.joystick.position.x - this.joystick.startPosition.x
          );
        }
      });
      
      // Handle pointer up event for joystick
      this.input.on('pointerup', (pointer) => {
        if (this.joystick.isActive && this.joystick.pointer && this.joystick.pointer.id === pointer.id) {
          this.joystick.isActive = false;
          this.joystick.force = 0;
          // Reset thumb position
          this.joystickThumb.x = this.joystickBase.x;
          this.joystickThumb.y = this.joystickBase.y;
        }
      });
    } else {
      // If not a touch device, initialize joystick properties but don't render visuals
      this.joystickBase = null;
      this.joystickThumb = null;
    }
  }
  
  movePlayer(direction) {
    if (this.isMoving) return;
    
    // Calculate current grid position based on player container
    const currentTileX = Math.floor(this.playerContainer.x / this.tileSize);
    const currentTileY = Math.floor(this.playerContainer.y / this.tileSize);
    
    // Calculate target grid position
    let targetTileX = currentTileX;
    let targetTileY = currentTileY;
    
    switch (direction) {
      case 'left':
        targetTileX -= 1;
        break;
      case 'right':
        targetTileX += 1;
        break;
      case 'up':
        targetTileY -= 1;
        break;
      case 'down':
        targetTileY += 1;
        break;
    }
    
    // Convert grid position to world position (center of tile)
    const targetX = targetTileX * this.tileSize + this.tileSize / 2;
    const targetY = targetTileY * this.tileSize + this.tileSize / 2;
    
    let isWalkable = true;
    
    // Check if the target tile is walkable based on the mode
    if (this.tilemapMode === 'tiled' && this.map && this.objectLayer) {
      try {
        const targetTile = this.map.getTileAt(targetTileX, targetTileY, false, 'Objects');
        isWalkable = !targetTile || targetTile.index === 0;
      } catch (error) {
        console.error('Error checking collision:', error);
        isWalkable = true;
      }
    } else if (this.tilemapMode === 'manual' && this.mapData) {
      // Check bounds first
      if (targetTileX >= 0 && targetTileX < this.mapData[0].length && targetTileY >= 0 && targetTileY < this.mapData.length) {
        isWalkable = this.mapData[targetTileY][targetTileX] === 0;
      } else {
        isWalkable = false;
      }
    }
    
    // Check for entity collision - handle different entity types
    if (isWalkable && this.allEntities) {
      // Check if any entity occupies the target tile
      const entitiesAtTargetTile = this.allEntities.getChildren().filter(entity => {
        const entityTileX = Math.floor(entity.x / this.tileSize);
        const entityTileY = Math.floor(entity.y / this.tileSize);
        return entityTileX === targetTileX && entityTileY === targetTileY;
      });
      
      if (entitiesAtTargetTile.length > 0) {
        const entity = entitiesAtTargetTile[0]; // Just handle the first entity for simplicity
        
        if (entity.getData('pushable')) {
          // Handle pushable entities (like boulders)
          const pushSuccess = this.tryPushEntity(entity, direction);
          if (!pushSuccess) {
            isWalkable = false;
          }
        } else {
          // Handle non-pushable entities (like enemies)
          isWalkable = false;
        }
      }
    }
    
    if (isWalkable) {
      // Start movement
      this.isMoving = true;
      
      // Use tweens to move the player container smoothly
      this.tweens.add({
        targets: this.playerContainer,
        x: targetX,
        y: targetY,
        duration: 200,
        ease: 'Linear',
        onComplete: () => {
          this.isMoving = false;
          
          // Check if input is still active to continue movement
          const continueMoving = 
            (direction === 'left' && this.cursors.left.isDown) ||
            (direction === 'right' && this.cursors.right.isDown) ||
            (direction === 'up' && this.cursors.up.isDown) ||
            (direction === 'down' && this.cursors.down.isDown) ||
            (this.joystick.isActive && this.joystick.force > 0.5);
          
          if (continueMoving) {
            this.movePlayer(this.currentDirection);
          }
        }
      });
    }
  }
}

export default RoomScene;