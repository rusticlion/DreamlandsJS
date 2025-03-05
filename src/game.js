import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import CombatScene from './scenes/CombatScene';

// Global game state to share data between scenes
const gameState = {
  player: {
    health: 100,
    bodyParts: [
      { name: 'Head', status: 'healthy' },
      { name: 'Arm', status: 'healthy' },
      { name: 'Leg', status: 'healthy' }
    ]
  },
  currentEnemy: null,
  combatActive: false
};

// Error handling function
function handleError(error) {
  console.error('Game initialization error:', error);
  
  // Create a simple error message in the DOM
  const container = document.getElementById('game-container');
  if (container) {
    container.innerHTML = `
      <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
        <h2>Game initialization error</h2>
        <p>Please check the console for details.</p>
      </div>
    `;
  }
}

try {
  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: 240,
    height: 160,
    parent: 'game-container',
    pixelArt: true, // Enable pixel art mode to prevent anti-aliasing
    backgroundColor: '#000000',
    scene: [MainScene, CombatScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: true  // Turn on debug temporarily to see physics bodies
      }
    },
    input: {
      touch: true, // Enable touch input for mobile
      activePointers: 3
    }
  };

  // Initialize the game
  const game = new Phaser.Game(config);

  // Add game and gameState to window for debugging
  window.game = game;
  window.gameState = gameState;
} catch (error) {
  handleError(error);
}