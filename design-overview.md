Design Document
1. Project Overview
"Into the Dreamlands" is a retro-inspired RPG that channels the aesthetic 
of early 2000s handheld games, like those on the Game Boy Advance (GBA). 
Players will explore interconnected dream worlds, engage in strategic 
turn-based combat, and unravel a narrative that blurs the boundaries 
between dreams and reality. The game aims to deliver a nostalgic yet 
innovative experience tailored for mobile play.

2. Aesthetic Guidelines
Visual Style: Low-resolution pixel art inspired by GBA games.
Color Palette: Limited to 16-32 colors, with a focus on dark tones and 
neon accents to create a dreamlike vibe.
Resolution: Native 240x160 pixels, scaled appropriately for modern mobile 
screens.
Tile-Based Design: 16x16 pixel tiles, enforcing grid-based movement and 
interactions.
Rendering Layers: Three layers (ground, objects, top) for depth and 
atmospheric effects.
Animations: 2-4 frames per animation, primarily for walking cycles during 
tile transitions.
3. Technical Specifications
Game Engine: Phaser 3, optimized for mobile devices and pixel art 
rendering.
Backend: Node.js with Express, handling game state and potential 
multiplayer features.
Database: MongoDB, storing player progress, messages, and combat data.
Deployment:
Frontend: Hosted on Netlify for fast, global access.
Backend: Deployed on Heroku with automatic scaling.
CI/CD: GitHub Actions for automated testing and deployment.
4. Gameplay Mechanics
Movement: Tile-based, with players snapping to 16x16 grid positions. 
Walking animations (2-4 frames) play during transitions.
Combat: Turn-based system where combatants (players and enemies) consist 
of six "Body Parts" (e.g., HEAD, LIMB), each with unique abilities, 
toughness, and heart points. Combat involves selecting TECHs (actions) 
and assigning dice for attacks or defense.
Dreamlands Structure: Interconnected dream levels linked by "rabbit 
holes" (portals), requiring strategic navigation and item collection to 
progress.
5. Development Milestones
Sprint 1: Core Structure and Combat Groundwork
Set up Phaser project with mobile optimization and retro aesthetics.
Implement tile-based movement with touch controls.
Create placeholder assets (player sprite, tileset) adhering to the color 
palette.
Set up backend with Node.js, Express, and MongoDB.
Deploy frontend to Netlify and backend to Heroku.
Begin prototyping the combat system with a placeholder scene and basic 
data structures.
6. Asset Requirements
Player Sprite: 16x16 pixels, with 2-4 frames for walking animations in 
each direction.
Tileset: 16x16 pixel tiles, including ground, walls, and atmospheric 
elements (e.g., shadows, glows).
Color Palette: Restricted to 16-32 colors, emphasizing dark tones with 
neon highlights.
7. Deployment Strategy
Frontend: Hosted on Netlify for optimized global delivery.
Backend: Deployed on Heroku with automatic scaling to handle player load.
CI/CD: GitHub Actions automates testing and deployment for smooth 
updates.
