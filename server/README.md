# Dreamlands Server

Backend server for the "Into the Dreamlands" game, handling asynchronous player messages.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/dreamlands
   ```

3. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
- **GET /health** - Check if the server is running
  - Response: `{ "status": "ok" }`

### Messages
- **GET /messages** - Get all messages
  - Response: Array of message objects
  
- **POST /messages** - Create a new message
  - Request Body: `{ "text": "Message content", "x": 10, "y": 20, "level": "forest" }`
  - Response: Created message object with 201 status code
  
- **GET /messages/level/:level** - Get messages by level
  - Response: Array of message objects filtered by the specified level

## Message Schema

```javascript
{
  text: String,       // Content of the message
  x: Number,          // X coordinate in the game world
  y: Number,          // Y coordinate in the game world
  level: String,      // Game area identifier (defaults to "default")
  timestamp: Date     // When the message was created
}
```

## Game Design

This server supports the asynchronous player messaging feature inspired by Dark Souls, allowing players to leave notes for others to discover in the game world, tied to specific locations.