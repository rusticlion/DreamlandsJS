import Phaser from 'phaser';

class CombatScene extends Phaser.Scene {
  constructor() {
    super({ 
      key: 'CombatScene',
      active: false,
      visible: true 
    });
  }

  create() {
    // Get reference to the global gameState
    const gameState = window.gameState;
    
    // Store the calling scene key
    this.callingSceneKey = gameState.callingSceneKey || 'RoomScene';
    
    // Reset camera position and setup
    this.cameras.main.setPosition(0, 0);
    this.cameras.main.setSize(240, 160);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setOrigin(0, 0);
    
    // Add a camera fade-in effect
    this.cameras.main.fadeIn(500);
    
    // Create a dark background for the combat scene
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    this.add.rectangle(centerX, centerY, 240, 160, 0x222222).setScrollFactor(0);
    this.add.rectangle(centerX, centerY, 236, 156, 0x000000).setStrokeStyle(2, 0x888888).setScrollFactor(0);
    
    // Create title text
    this.add.text(centerX, 20, 'COMBAT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);
    
    // Player health display
    this.add.text(20, 40, 'HP:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setScrollFactor(0);
    
    const healthText = this.add.text(50, 40, gameState.player.health.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#88ff88'
    }).setScrollFactor(0);
    
    // Create body parts status display
    this.add.text(20, 55, 'STATUS:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setScrollFactor(0);
    
    // Display each body part and its status
    let yPos = 65;
    gameState.player.bodyParts.forEach(part => {
      this.add.text(30, yPos, `${part.name}:`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: '#ffffff'
      }).setScrollFactor(0);
      
      const statusColor = part.status === 'healthy' ? '#88ff88' : '#ff8888';
      this.add.text(70, yPos, part.status, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: statusColor
      }).setScrollFactor(0);
      
      yPos += 10;
    });
    
    // Basic combat buttons (for prototype)
    const winButton = this.add.rectangle(centerX - 60, 120, 80, 20, 0x224422).setScrollFactor(0);
    this.add.text(centerX - 60, 120, 'WIN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);
    
    const loseButton = this.add.rectangle(centerX + 60, 120, 80, 20, 0x442222).setScrollFactor(0);
    this.add.text(centerX + 60, 120, 'LOSE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);
    
    // Make buttons interactive
    winButton.setInteractive();
    loseButton.setInteractive();
    
    // Set up button event handlers
    winButton.on('pointerdown', () => this.endCombat(true));
    loseButton.on('pointerdown', () => this.endCombat(false));
    
    // Set up key event listeners for combat controls
    this.input.keyboard.removeAllListeners('keydown-SPACE');
    this.input.keyboard.removeAllListeners('keydown-ESC');
    
    this.input.keyboard.addKey('SPACE').on('down', () => {
      console.log('SPACE pressed in combat scene');
      this.endCombat(true);
    });
    
    this.input.keyboard.addKey('ESC').on('down', () => {
      console.log('ESC pressed in combat scene');
      this.endCombat(false);
    });
  }
  
  endCombat(victory) {
    const gameState = window.gameState;
    const resultData = victory ? 
      { victory: true, player: gameState.player, enemyId: gameState.currentEnemy?.id } : 
      { victory: false, player: gameState.player };
    
    if (victory) {
      // Handle victory outcome
      gameState.player.health = Math.min(100, gameState.player.health + 20);
    } else {
      // Handle defeat outcome
      gameState.player.health = Math.max(0, gameState.player.health - 20);
      
      // Randomly damage a body part
      const randomPart = gameState.player.bodyParts[Math.floor(Math.random() * gameState.player.bodyParts.length)];
      randomPart.status = 'damaged';
    }
    
    // Clear combat state
    gameState.combatActive = false;
    gameState.currentEnemy = null;
    
    // Fade out and then resume the calling scene
    this.cameras.main.fadeOut(500, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        // When fade is complete, emit the event and resume the scene
        this.scene.get(this.callingSceneKey).events.emit('resumeFromCombat', resultData);
        
        // Get the calling scene and resume it
        const callingScene = this.scene.get(this.callingSceneKey);
        this.scene.resume(this.callingSceneKey);
        
        // Reset camera for calling scene if needed
        if (callingScene.cameras && callingScene.cameras.main) {
          callingScene.cameras.main.setVisible(true);
        }
        
        // Stop this scene
        this.scene.stop();
      }
    });
  }
}

export default CombatScene;