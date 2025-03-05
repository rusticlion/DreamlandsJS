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

## Deployment

### Heroku Deployment

To deploy this server to Heroku:

1. Create a Heroku account and install the Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create dreamlands-server
   ```

3. Set MongoDB Atlas connection string:
   ```bash
   heroku config:set MONGO_URI=<your-mongodb-atlas-uri>
   ```

4. Deploy the application:
   ```bash
   git subtree push --prefix server heroku main
   ```
   
   Alternatively, if you're only deploying the server subdirectory:
   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-heroku-app-name
   git push heroku main
   ```

5. Monitor logs:
   ```bash
   heroku logs --tail
   ```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (the free tier is sufficient for development)
3. Create a database user with read/write permissions
4. Whitelist necessary IP addresses (or allow all with 0.0.0.0/0 for simplicity)
5. Get the connection string and use it as your MONGO_URI environment variable in Heroku

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