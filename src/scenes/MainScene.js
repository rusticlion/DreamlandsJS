import Phaser from 'phaser';
import { checkHealth, getMessages, getMessagesByLevel, createMessage } from '../api/client';

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
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
  }

  preload() {
    // Load assets
    this.load.image('player', 'assets/player.png');
    this.load.image('tiles', 'assets/tileset.png');
    this.load.tilemapTiledJSON('map', 'assets/map.json');
  }

  create() {
    // Create a simple gray background as fallback
    this.add.rectangle(120, 80, 240, 160, 0x333333);
    
    try {
      // First try with JSON tilemap
      this.createWithTiledMap();
    } catch(error) {
      console.error("Error creating with Tiled map:", error);
      // If that fails, create a manual tilemap
      this.createWithManualMap();
    }
    
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Simple virtual joystick implementation
    this.setupJoystick();
    
    // Check API health and set up message functionality
    this.setupMessagingSystem();
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
    
    // Show message text on hover
    marker.on('pointerover', () => {
      // Create a small popup with the message text
      const popup = this.add.rectangle(message.x, message.y - 20, 100, 30, 0x000000, 0.7);
      const text = this.add.text(message.x - 45, message.y - 30, message.text, { 
        font: '8px Arial', 
        fill: '#ffffff',
        wordWrap: { width: 90 }
      });
      
      // Store references to destroy later
      marker.popup = popup;
      marker.text = text;
    });
    
    // Remove popup when mouse leaves
    marker.on('pointerout', () => {
      if (marker.popup) {
        marker.popup.destroy();
        marker.text.destroy();
        marker.popup = null;
        marker.text = null;
      }
    });
    
    return marker;
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
      const promptText = this.add.text(50, 70, 'Enter your message:', { 
        font: '10px Arial', 
        fill: '#ffffff' 
      });
      promptText.setScrollFactor(0);
      
      // Create an input text box (simulated)
      const inputBox = this.add.rectangle(120, 90, 180, 20, 0x333333);
      inputBox.setScrollFactor(0);
      
      const inputText = this.add.text(40, 85, '', { 
        font: '10px Arial', 
        fill: '#ffffff' 
      });
      inputText.setScrollFactor(0);
      
      // Instructions
      const instructions = this.add.text(40, 110, 'Press ENTER to post or ESC to cancel', { 
        font: '8px Arial', 
        fill: '#ffffff' 
      });
      instructions.setScrollFactor(0);
      
      // Handle keyboard input
      const keyboardInput = this.input.keyboard.on('keydown', event => {
        if (event.keyCode === 27) { // ESC key
          // Cancel and clean up
          overlay.destroy();
          promptText.destroy();
          inputBox.destroy();
          inputText.destroy();
          instructions.destroy();
          this.input.keyboard.removeListener('keydown', keyboardInput);
          this.isMoving = false;
        } else if (event.keyCode === 13) { // ENTER key
          // Post the message
          if (inputText.text.trim() !== '') {
            this.postMessage(inputText.text);
          }
          
          // Clean up
          overlay.destroy();
          promptText.destroy();
          inputBox.destroy();
          inputText.destroy();
          instructions.destroy();
          this.input.keyboard.removeListener('keydown', keyboardInput);
          this.isMoving = false;
        } else if (event.keyCode === 8) { // BACKSPACE key
          inputText.text = inputText.text.slice(0, -1);
        } else if (event.key.length === 1) { // Regular text input
          // Limit message length
          if (inputText.text.length < 40) {
            inputText.text += event.key;
          }
        }
      });
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
      
      // Show a small confirmation
      const confirmation = this.add.text(
        this.playerContainer.x - 40, 
        this.playerContainer.y - 20, 
        'Message posted!', 
        { font: '8px Arial', fill: '#ffffff' }
      );
      
      // Fade out and destroy after 2 seconds
      this.tweens.add({
        targets: confirmation,
        alpha: 0,
        duration: 2000,
        onComplete: () => confirmation.destroy()
      });
      
    } catch (error) {
      console.error('Error posting message:', error);
      
      // Show error notification
      const errorText = this.add.text(
        this.playerContainer.x - 40, 
        this.playerContainer.y - 20, 
        'Error posting message', 
        { font: '8px Arial', fill: '#ff0000' }
      );
      
      // Fade out and destroy after 2 seconds
      this.tweens.add({
        targets: errorText,
        alpha: 0,
        duration: 2000,
        onComplete: () => errorText.destroy()
      });
    }
  }
  
  createWithTiledMap() {
    // Create the tilemap
    const map = this.make.tilemap({ key: 'map' });
    
    // Add the tileset image
    const tileset = map.addTilesetImage('tileset', 'tiles');
    
    if (!tileset) {
      throw new Error('Failed to add tileset');
    }
    
    // Create both layers
    const groundLayer = map.createLayer('Ground', tileset, 0, 0);
    const objectLayer = map.createLayer('Objects', tileset, 0, 0);
    
    // Set collision for all non-zero tiles in the objects layer
    objectLayer.setCollisionByExclusion([0]);
    
    // Calculate player position - start at a specific tile (1,1) for consistency
    const tileSize = map.tileWidth;
    const startTileX = 1;
    const startTileY = 1;
    const playerX = startTileX * tileSize + tileSize/2;
    const playerY = startTileY * tileSize + tileSize/2;
    
    // Create the player sprite
    this.player = this.physics.add.sprite(0, 0, 'player');
    this.player.setOrigin(0.5, 0.5); // Center the player on tiles
    
    // Create a container to hold the player
    this.playerContainer = this.add.container(playerX, playerY);
    this.playerContainer.add(this.player);
    
    // Set up camera to follow player container
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.playerContainer, true, 0.1, 0.1);
    
    // Store the tilemap for collision detection
    this.map = map;
    this.objectLayer = objectLayer;
    this.tilemapMode = 'tiled';
  }
  
  createWithManualMap() {
    console.log("Creating with manual map");
    
    // Define map dimensions
    const mapWidth = 15;
    const mapHeight = 10;
    const tileSize = 16;
    
    // Create a simple wall layout (1 = wall, 0 = empty)
    const wallData = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    
    // Create wall and floor graphics
    const wallColor = 0x663931;
    const floorColor = 0x73a373;
    
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
    
    // Create the player at exact tile position (starts at tile 1,1)
    const startTileX = 1;
    const startTileY = 1;
    const playerX = startTileX * tileSize + tileSize/2;
    const playerY = startTileY * tileSize + tileSize/2;
    
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

  update() {
    if (!this.playerContainer || this.isMoving) return;

    // Handle keyboard input
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
    
    // Handle joystick input
    if (this.joystick.isActive && this.joystick.force > 0.5) {
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
    
    if (direction) {
      this.currentDirection = direction;
      this.movePlayer(direction);
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
      if (targetTileX >= 0 && targetTileX < 15 && targetTileY >= 0 && targetTileY < 10) {
        isWalkable = this.mapData[targetTileY][targetTileX] === 0;
      } else {
        isWalkable = false;
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

export default MainScene;