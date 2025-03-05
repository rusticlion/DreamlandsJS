import Phaser from 'phaser';

class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatScene' });
  }

  create() {
    // Get reference to the global gameState
    const gameState = window.gameState;
    
    // Create a dark background for the combat scene
    this.add.rectangle(120, 80, 240, 160, 0x222222);
    this.add.rectangle(120, 80, 236, 156, 0x000000).setStrokeStyle(2, 0x888888);
    
    // Create title text
    this.add.text(120, 20, 'COMBAT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Player health display
    this.add.text(20, 40, 'HP:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    });
    
    const healthText = this.add.text(50, 40, gameState.player.health.toString(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#88ff88'
    });
    
    // Create body parts status display
    this.add.text(20, 55, 'STATUS:', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    });
    
    // Display each body part and its status
    let yPos = 65;
    gameState.player.bodyParts.forEach(part => {
      this.add.text(30, yPos, `${part.name}:`, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: '#ffffff'
      });
      
      const statusColor = part.status === 'healthy' ? '#88ff88' : '#ff8888';
      this.add.text(70, yPos, part.status, {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        fill: statusColor
      });
      
      yPos += 10;
    });
    
    // Basic combat buttons (for prototype)
    const winButton = this.add.rectangle(60, 120, 80, 20, 0x224422);
    this.add.text(60, 120, 'WIN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    const loseButton = this.add.rectangle(180, 120, 80, 20, 0x442222);
    this.add.text(180, 120, 'LOSE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Make buttons interactive
    winButton.setInteractive();
    loseButton.setInteractive();
    
    // Set up button event handlers
    winButton.on('pointerdown', () => this.endCombat(true));
    loseButton.on('pointerdown', () => this.endCombat(false));
    
    // Set up key event listeners for combat controls
    this.input.keyboard.on('keydown-SPACE', () => {
      // For quick testing: spacebar ends combat with victory
      this.endCombat(true);
    });
    
    this.input.keyboard.on('keydown-ESC', () => {
      // ESC key ends combat with defeat
      this.endCombat(false);
    });
  }
  
  endCombat(victory) {
    const gameState = window.gameState;
    
    if (victory) {
      // Handle victory outcome
      gameState.player.health = Math.min(100, gameState.player.health + 20);
      
      // Emit combat end event directly to the main scene
      this.scene.get('MainScene').events.emit('resumeFromCombat', { 
        victory: true, 
        player: gameState.player,
        enemyId: gameState.currentEnemy.id
      });
    } else {
      // Handle defeat outcome
      gameState.player.health = Math.max(0, gameState.player.health - 20);
      
      // Randomly damage a body part
      const randomPart = gameState.player.bodyParts[Math.floor(Math.random() * gameState.player.bodyParts.length)];
      randomPart.status = 'damaged';
      
      // Emit combat end event directly to the main scene
      this.scene.get('MainScene').events.emit('resumeFromCombat', { 
        victory: false, 
        player: gameState.player 
      });
    }
    
    // Clear combat state
    gameState.combatActive = false;
    gameState.currentEnemy = null;
    
    // Stop this scene and resume main scene
    this.scene.stop();
    this.scene.resume('MainScene');
  }
}

export default CombatScene;