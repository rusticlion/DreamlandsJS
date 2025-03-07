import Phaser from 'phaser';

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Load common assets
    this.load.image('player', 'assets/player.png');
    this.load.image('tiles', 'assets/tileset.png');
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    
    // Load JSON files for all rooms
    this.load.json('room1', 'assets/rooms/room1.json');
    this.load.json('room2', 'assets/rooms/room2.json');
    this.load.json('room3', 'assets/rooms/room3.json');
    
    // Create loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 20, 'Loading...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Progress bar background
    this.add.rectangle(width / 2, height / 2, 100, 6, 0x666666);
    
    // Progress bar
    const progressBar = this.add.rectangle(width / 2 - 50, height / 2, 0, 6, 0x88ff88);
    progressBar.setOrigin(0, 0.5);
    
    // Update progress bar as assets load
    this.load.on('progress', (value) => {
      progressBar.width = 100 * value;
    });
    
    // Create game textures
    this.load.on('complete', () => {
      // Create textures for game entities
      this.createEnemyTexture();
      this.createBoulderTexture();
      this.createDoorTexture();
    });
  }
  
  // Create door texture
  createDoorTexture() {
    if (this.textures.exists('door')) return;
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8888ff'; // Blue door
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 2, 4, 12); // Vertical handle
    this.textures.addCanvas('door', canvas);
  }
  
  // Create enemy texture
  createEnemyTexture() {
    // Check if texture already exists
    if (this.textures.exists('enemy')) return;
    
    // Create canvas element for drawing
    const size = 16; // Single tile size
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    // Get context and draw enemy
    const ctx = canvas.getContext('2d');
    
    // Fill with brown color
    ctx.fillStyle = '#aa5500';
    ctx.fillRect(0, 0, size, size);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
    
    // Add simple face details 
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 2, 2); // Left eye
    ctx.fillRect(10, 4, 2, 2); // Right eye
    ctx.fillRect(5, 10, 6, 2); // Mouth
    
    // Create texture from canvas
    this.textures.addCanvas('enemy', canvas);
  }
  
  // Create boulder texture
  createBoulderTexture() {
    // Check if texture already exists
    if (this.textures.exists('boulder')) return;
    
    // Create canvas element for drawing
    const size = 16; // Single tile size
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    // Get context and draw boulder
    const ctx = canvas.getContext('2d');
    
    // Fill with gray color
    ctx.fillStyle = '#777777';
    ctx.fillRect(0, 0, size, size);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
    
    // Add rocky texture details
    ctx.fillStyle = '#555555';
    ctx.fillRect(3, 3, 4, 4);
    ctx.fillRect(10, 6, 3, 3);
    ctx.fillRect(5, 10, 4, 3);
    
    // Highlight
    ctx.fillStyle = '#999999';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(12, 3, 2, 2);
    
    // Create texture from canvas
    this.textures.addCanvas('boulder', canvas);
  }

  create() {
    // Initialize gameState if it doesn't exist
    if (!window.gameState) {
      window.gameState = {
        player: {
          health: 100,
          bodyParts: [
            { name: 'Head', status: 'healthy' },
            { name: 'Arm', status: 'healthy' },
            { name: 'Leg', status: 'healthy' }
          ]
        },
        currentEnemy: null,
        combatActive: false,
        nextPlayerX: null,
        nextPlayerY: null,
        nextRoomId: null, // Added for door transitions
        callingSceneKey: 'RoomScene',
        rooms: {
          room1: { entities: {} },
          room2: { entities: {} },
          room3: { entities: {} }
        },
        roomsData: {} // Central repository for room data
      };
    }
    
    // Store room data in gameState
    window.gameState.roomsData = {
      'room1': this.cache.json.get('room1'),
      'room2': this.cache.json.get('room2'),
      'room3': this.cache.json.get('room3')
    };
    
    console.log('Room data loaded:', window.gameState.roomsData);
    
    // Start with RoomScene, passing the initial roomId
    this.scene.start('RoomScene', { roomId: 'room1' });
  }
}

export default PreloadScene;