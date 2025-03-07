import Phaser from 'phaser';
import CombatScene from './scenes/CombatScene';
import PreloadScene from './scenes/PreloadScene';
import RoomScene from './scenes/RoomScene';
import StateManager from './StateManager';

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
  // Initialize StateManager
  const stateManager = new StateManager();
  
  // Try to load existing save data
  stateManager.loadFromLocalStorage();
  
  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: 240,
    height: 160,
    parent: 'game-container',
    pixelArt: true, // Enable pixel art mode to prevent anti-aliasing
    backgroundColor: '#000000',
    scene: [PreloadScene, RoomScene, CombatScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    input: {
      touch: true, // Enable touch input for mobile
      activePointers: 3
    }
  };

  // Initialize the game
  const game = new Phaser.Game(config);
  
  // Store stateManager in the game registry for global access
  game.registry.set('stateManager', stateManager);

  // Add game to window for debugging
  window.game = game;
  
  // Auto-save every minute
  setInterval(() => {
    stateManager.saveToLocalStorage();
    console.log('Auto-saving game state...');
  }, 60000);
  
  // Save game state when the window is closed or refreshed
  window.addEventListener('beforeunload', () => {
    stateManager.saveToLocalStorage();
    console.log('Saving game state before unload...');
  });
  
  // Save game state when the user switches tabs
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stateManager.saveToLocalStorage();
      console.log('Saving game state when switching away...');
    }
  });
  
} catch (error) {
  handleError(error);
}