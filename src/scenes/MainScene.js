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
    
    // Create a simple enemy sprite as a rectangle (for prototype)
    const enemyGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Use a lighter brown color to make the burgundy tint more noticeable
    enemyGraphics.fillStyle(0x8B7355); // Lighter brown color
    
    // Make it a single tile size for perfect alignment
    enemyGraphics.fillRect(0, 0, this.tileSize, this.tileSize);
    
    // Add a black outline for visibility
    enemyGraphics.lineStyle(1, 0x000000);
    enemyGraphics.strokeRect(0, 0, this.tileSize, this.tileSize);
    
    enemyGraphics.generateTexture('enemy', this.tileSize, this.tileSize);
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
    
    // Add enemies to the scene
    this.setupEnemies();
    
    // Set up combat-related listeners
    this.setupCombatListeners();
    
    // Add health display
    this.setupPlayerHealthDisplay();
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
  
  setupEnemies() {
    // Get reference to global gameState
    const gameState = window.gameState;
    
    // Create an enemies group with physics
    this.enemies = this.physics.add.group();
    
    // Create a few enemies positioned around the map
    // Align enemies to exact tile positions, accounting for any offset
    // This time let's use integer multiples of the tile size without any additional offset
    const enemyPositions = [
      { x: 5 * this.tileSize, y: 3 * this.tileSize, id: 'enemy1' },
      { x: 10 * this.tileSize, y: 7 * this.tileSize, id: 'enemy2' },
      { x: 4 * this.tileSize, y: 7 * this.tileSize, id: 'enemy3' }
    ];
    
    enemyPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'enemy');
      
      // Set the origin to 0.5 to ensure it's centered properly
      enemy.setOrigin(0.5, 0.5);
      
      // Make sure it doesn't move with physics
      enemy.setImmovable(true);
      
      // Store data on the enemy sprite
      enemy.setData('id', pos.id);
      enemy.setData('isEnemy', true);
      enemy.setData('originalTint', enemy.tint);
      
      // Add collision - set a physics body to match tile size
      enemy.body.setSize(this.tileSize, this.tileSize);
      
      // Debug outline to see the actual collision body
      if (this.physics.config.debug) {
        enemy.body.debugShowBody = true;
      }
    });
    
    // Add overlap detection between player and enemies
    // If using the player container for overlap doesn't work well,
    // we can use a physics body for detection instead
    
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
  }
  
  setupCombatListeners() {
    // Add listeners for the CombatScene events
    this.events.on('resumeFromCombat', (data) => {
      console.log('MainScene resumed with data:', data);
      
      // Update scene based on combat results
      if (data && data.victory && data.enemyId) {
        // Find and remove the defeated enemy
        const defeatedEnemy = this.enemies.getChildren().find(
          enemy => enemy.getData('id') === data.enemyId
        );
        
        if (defeatedEnemy) {
          defeatedEnemy.destroy();
        }
        
        // Show victory message
        this.showCombatResult('VICTORY!', '#88ff88');
      } else {
        // Show defeat message
        this.showCombatResult('DEFEAT!', '#ff8888');
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
      // In a full implementation, you could change sprites or animations
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
  
  // Helper method to create the combat prompt
  createCombatPrompt(enemy) {
    // Create a background for the prompt
    const promptBg = this.add.rectangle(
      enemy.x,
      enemy.y - 20,
      140,
      16,
      0x000000,
      0.8
    ).setOrigin(0.5);
    promptBg.setStrokeStyle(2, 0xFF0000);
    
    // Add text on top
    const promptText = this.add.text(
      enemy.x,
      enemy.y - 20,
      'PRESS SPACE TO FIGHT!',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: '#FFFFFF',
      }
    ).setOrigin(0.5);
    
    // Make the prompt bob up and down for attention
    this.tweens.add({
      targets: [promptBg, promptText],
      y: '+=4',
      duration: 500,
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
    
    // Also stop any pulse effect on the enemy
    if (enemy.pulseEffect) {
      enemy.pulseEffect.stop();
      enemy.pulseEffect = null;
      enemy.setAlpha(1);
    }
    
    // Set combat state
    gameState.combatActive = true;
    gameState.currentEnemy = {
      id: enemy.getData('id'),
      type: 'basic',
      health: 50
    };
    
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
  }
  
  update() {
    if (!this.playerContainer || this.isMoving) return;
    
    // Top priority: Check for combat initiation with spacebar globally
    if (this.cursors && this.cursors.space && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      // Find the closest enemy
      let closestEnemy = null;
      let minDistance = 40; // Detection radius threshold
      
      if (this.enemies) {
        this.enemies.getChildren().forEach(enemy => {
          const distance = Phaser.Math.Distance.Between(
            this.playerContainer.x, this.playerContainer.y,
            enemy.x, enemy.y
          );
          
          if (distance < minDistance) {
            closestEnemy = enemy;
            minDistance = distance;
          }
        });
        
        // If we found an enemy in range, start combat
        if (closestEnemy) {
          this.startCombat(closestEnemy);
          return; // Skip rest of update if we're entering combat
        }
      }
    }
    
    // Check for enemy proximity using physics system
    if (this.enemies && this.playerContainer) {
      let enemyNearby = false;
      
      // Always create a visual indicator for debugging
      if (!this.debugText) {
        this.debugText = this.add.text(10, 10, '', {
          fontFamily: 'monospace',
          fontSize: '8px',
          fill: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 2, y: 2 }
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);
      }
      
      // Check and display player's current grid position for debugging
      const playerTileX = Math.floor(this.playerContainer.x / this.tileSize);
      const playerTileY = Math.floor(this.playerContainer.y / this.tileSize);
      
      // Build debug info
      let debugInfo = `Player: (${Math.floor(this.playerContainer.x)}, ${Math.floor(this.playerContainer.y)})`;
      
      // Process each enemy
      let closestEnemy = null;
      let closestDistance = Infinity;
      
      this.enemies.getChildren().forEach(enemy => {
        // Check distance to enemy
        const distance = Phaser.Math.Distance.Between(
          this.playerContainer.x,
          this.playerContainer.y,
          enemy.x,
          enemy.y
        );
        
        // Track closest enemy for focused debugging
        if (distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
        
        // Add visible detection radius - helps see where detection should happen
        if (!enemy.detectionCircle) {
          enemy.detectionCircle = this.add.circle(enemy.x, enemy.y, 40, 0xff0000, 0.2);
        }
        
        // Create a visual line from player to enemy for distance visualization
        if (!enemy.distanceLine) {
          enemy.distanceLine = this.add.line(0, 0, 
            this.playerContainer.x, this.playerContainer.y, 
            enemy.x, enemy.y, 
            0xffff00, 0.3);
        } else {
          // Update line position
          enemy.distanceLine.setTo(
            this.playerContainer.x, this.playerContainer.y, 
            enemy.x, enemy.y
          );
        }
        
        // Update line alpha based on distance - makes it easy to see when close
        const lineAlpha = distance < 40 ? 0.8 : 0.3;
        enemy.distanceLine.setAlpha(lineAlpha);
        
        // If player is close to an enemy - use a larger detection radius for more reliable detection
        if (distance < 40) {  // 40 pixel detection radius
          // Use a very noticeable dark red tint
          enemy.setTint(0xFF0000); 
          
          // Add a pulsing effect for better visibility
          if (!enemy.pulseEffect) {
            enemy.pulseEffect = this.tweens.add({
              targets: enemy,
              alpha: { from: 1, to: 0.6 },
              duration: 500,
              yoyo: true,
              repeat: -1
            });
          }
          
          enemyNearby = true;
          
          // Show combat prompt if not already showing
          if (!this.combatPrompt) {
            this.createCombatPrompt(enemy);
          }
          
          // We now handle combat initiation at the beginning of update with global detection
        } else {
          // If not close, reset tint and stop pulsing
          enemy.clearTint();
          
          // Stop pulsing effect if it exists
          if (enemy.pulseEffect) {
            enemy.pulseEffect.stop();
            enemy.pulseEffect = null;
            enemy.setAlpha(1);
          }
        }
      });
      
      // If no enemies nearby, remove the combat prompt
      if (!enemyNearby && this.combatPrompt) {
        // Clean up all prompt elements
        this.combatPrompt.bg.destroy();
        this.combatPrompt.text.destroy();
        this.combatPrompt = null;
      }
      
      // Update debug text with the most relevant info
      if (this.debugText) {
        if (closestEnemy) {
          const enemyId = closestEnemy.getData('id');
          debugInfo += `\nClosest: ${enemyId} (${Math.floor(closestDistance)}px)`;
          if (closestDistance < 40) {
            debugInfo += '\nIn range! Press SPACE';
          }
        }
        this.debugText.setText(debugInfo);
      }
    }
    
    // Handle keyboard movement
    if (this.cursors.left.isDown) {
      this.movePlayer('left');
    } else if (this.cursors.right.isDown) {
      this.movePlayer('right');
    } else if (this.cursors.up.isDown) {
      this.movePlayer('up');
    } else if (this.cursors.down.isDown) {
      this.movePlayer('down');
    }
    
    // Handle joystick movement
    if (this.joystick.isActive && this.joystick.force > 0.5) {
      const angle = this.joystick.angle;
      // Convert angle to direction
      if (angle >= -Math.PI/4 && angle < Math.PI/4) {
        this.movePlayer('right');
      } else if (angle >= Math.PI/4 && angle < 3*Math.PI/4) {
        this.movePlayer('down');
      } else if (angle >= 3*Math.PI/4 || angle < -3*Math.PI/4) {
        this.movePlayer('left');
      } else {
        this.movePlayer('up');
      }
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