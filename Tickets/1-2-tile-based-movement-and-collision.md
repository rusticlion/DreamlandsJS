Description

Integrate a tilemap into the game, render it, and implement tile-based 
movement for the player, including basic collision detection to prevent 
moving through walls. The player should move in discrete steps 
corresponding to the tile size, with smooth transitions between tiles. 
This builds on the existing prototype by adding a grid-based structure and 
ensuring movement works seamlessly with both keyboard input and the 
virtual joystick.

Tasks

Prepare the Tilemap

Create a tilemap using Tiled (or a similar tool) with at least two layers:
"Ground" Layer: For the walkable background tiles.
"Objects" Layer: For obstacles like walls.
Use a 16x16 pixel tileset to match the retro aesthetic and intended grid 
size.
Set a custom property collides: true on tiles in the "Objects" layer that 
should block movement (e.g., walls or barriers).
Export the tilemap as a JSON file for use in Phaser.

Load and Render the Tilemap in Phaser

In the scene’s preload method, load the tilemap JSON and the tileset 
image:
javascript

Collapse

Wrap

Copy
this.load.tilemapTiledJSON('map', 'assets/map.json');
this.load.image('tiles', 'assets/tileset.png');
In the create method, create the tilemap and add both layers:
javascript

Collapse

Wrap

Copy
const map = this.make.tilemap({ key: 'map' });
const tileset = map.addTilesetImage('tileset-name-in-tiled', 'tiles');
const groundLayer = map.createLayer('Ground', tileset, 0, 0);
const objectLayer = map.createLayer('Objects', tileset, 0, 0);

Set Up the Camera

Configure the camera to follow the player:
javascript

Collapse

Wrap

Copy
this.cameras.main.startFollow(this.player);
If the map exceeds the screen size (240x160 pixels), set camera bounds to 
the map dimensions:
javascript

Collapse

Wrap

Copy
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

Implement Tile-Based Movement with Collision

Set the player’s origin to (0.5, 0.5) to center it on tiles:
javascript

Collapse

Wrap

Copy
this.player.setOrigin(0.5, 0.5);
Define the tile size as 16 pixels.
Implement movement logic in the update method:
Detect input from keyboard (arrow keys) or virtual joystick.
Calculate the target position (e.g., player.x ± 16 or player.y ± 16 based 
on direction).
Check the "Objects" layer at the target position for collision:
javascript

Collapse

Wrap

Copy
const targetTile = map.getTileAtWorldXY(targetX, targetY, true, 
this.cameras.main, 'Objects');
const isWalkable = !targetTile || !targetTile.properties.collides;
If walkable, use a tween to move the player smoothly:
javascript

Collapse

Wrap

Copy
if (isWalkable && !this.isMoving) {
  this.isMoving = true;
  this.tweens.add({
    targets: this.player,
    x: targetX,
    y: targetY,
    duration: 200,
    onComplete: () => {
      this.isMoving = false;
      // Continue moving if input is still held
      if (inputIsActive(direction)) {
        this.movePlayer(direction);
      }
    }
  });
}
Prevent new movement while isMoving is true.
Support continuous movement by checking input after each tween completes.

Acceptance Criteria

The tilemap is loaded and rendered with visible "Ground" and "Objects" 
layers.
The player moves in discrete 16-pixel steps, snapping to the center of 
each tile.
The player cannot move through tiles in the "Objects" layer with collides: 
true.
Movement functions with both keyboard arrow keys and the virtual joystick.
The camera follows the player smoothly across the map.
Holding an input (key or joystick direction) allows continuous movement, 
one tile at a time, with collision checked for each step.

🐱💤
