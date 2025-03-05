# Into the Dreamlands

A retro-inspired RPG that channels the aesthetic of early 2000s handheld games, like those on the Game Boy Advance (GBA).

## Project Structure

- `/src` - Frontend game code
- `/server` - Backend server for player messages
- `/public` - Static assets

## Frontend Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

## Backend Setup

1. Navigate to the server directory:
```
cd server
```

2. Install backend dependencies:
```
npm install
```

3. Create a `.env` file in the server directory with:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/dreamlands
```

4. Start the backend server:
```
npm start
```

Or for development with auto-reload:
```
npm run dev
```

## Controls

- Use arrow keys on desktop to move the character
- On mobile, use the virtual joystick in the bottom-left corner

## Features

- Tile-based movement with collision detection
- Player messaging system inspired by Dark Souls
- RESTful API for storing and retrieving player messages

## Deployment

### Netlify Deployment

The game is deployed on Netlify at: [https://dreamlands-game.netlify.app](https://dreamlands-game.netlify.app)

To deploy your own instance:

1. Fork this repository
2. Sign up for a free account at [netlify.com](https://netlify.com)
3. Connect your GitHub repository:
   - Click "New site from Git" in Netlify
   - Select your forked repo
   - Set the publish directory to `dist`
   - Set the build command to `npm run build`
4. Configure environment variables:
   - Go to "Site settings" > "Build & deploy" > "Environment"
   - Add `API_URL` with your backend server URL (e.g., `https://your-backend.herokuapp.com`)
5. Deploy!

## Mobile Optimization

The game is optimized for mobile devices with:
- Responsive scaling that maintains pixel art quality
- Touch controls via a virtual joystick
- Proper viewport settings to prevent unwanted zooming or scrolling

## Ticket Status

Currently completed tickets:
- 1-1: Setup Phaser Project
- 1-2: Tile-based Movement and Collision
- 1-3: Backend Setup with Player Messages
- 1-4: Deploy Frontend to Netlify