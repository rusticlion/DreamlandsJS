Description

Initialize a Node.js/Express backend server and establish a connection to 
MongoDB to support the core asynchronous feature of "Into the 
Dreamlands": player messages. This ticket will set up the server, connect 
it to MongoDB, define a basic schema for storing messages, and implement 
initial API endpoints to create and retrieve messages. These messages 
will emulate the Dark Souls-style mechanic where players leave notes for 
others to discover in the game world, tied to specific locations.

The frontend is already complete, and this ticket focuses on providing 
the backend infrastructure to support the game’s design goals. Future 
tickets can expand on this foundation (e.g., adding location-based 
filtering or authentication).

Tasks

Set Up Node.js/Express Server

Objective: Create a functional Express server as the foundation for 
backend logic.
Steps:
Initialize a new Node.js project: npm init -y.
Install Express: npm install express.
Create a server.js file with a basic server setup and a health check 
endpoint:
javascript



const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
Validation: Run the server locally (node server.js) and use a tool like 
Postman or a browser to verify that GET /health returns { "status": "ok" 
}.

Connect to MongoDB

Objective: Establish a connection to MongoDB for persistent data storage.
Steps:
Install Mongoose for MongoDB interaction: npm install mongoose.
Update server.js to include the MongoDB connection:
javascript



const mongoose = require('mongoose');
const uri = process.env.MONGO_URI || 
'mongodb://localhost:27017/dreamlands';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
Validation: Connect to a local MongoDB instance (e.g., running on 
localhost:27017) or a cloud instance (e.g., MongoDB Atlas) and confirm 
the "MongoDB connected" log appears in the console.

Define Message Schema

Objective: Create a basic MongoDB schema to store player messages with 
location data.
Steps:
In server.js (or a separate models file), define a Mongoose schema for 
messages:
javascript



const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  level: { type: String, default: 'default' }, // Optional: for different 
game areas
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);
This schema supports the game’s asynchronous messaging feature by storing 
message content, its position (x, y coordinates), an optional level 
identifier, and a creation timestamp.
Notes: The level field is included for flexibility (e.g., to 
differentiate messages across maps or areas) but can default to a single 
value for now.

Create API Endpoints

Objective: Implement endpoints to create and retrieve player messages.
Steps:
Add middleware to parse JSON request bodies: app.use(express.json());.
Implement a POST endpoint to create a new message:
javascript



app.post('/messages', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create message' });
  }
});
Implement a GET endpoint to retrieve all messages:
javascript



app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});
Notes: The GET endpoint currently returns all messages for simplicity. 
Future enhancements could filter messages by location (e.g., within a 
radius of the player’s position) or level.

Test the Server Locally

Objective: Ensure the server and endpoints work as expected.
Steps:
Start the server: node server.js.
Test the health check endpoint (GET /health) to confirm the server is 
running.
Use Postman or curl to:
Send a POST request to /messages with a sample body (e.g., { "text": 
"Beware the shadows", "x": 10, "y": 20, "level": "forest" }) and verify a 
201 response with the saved message.
Send a GET request to /messages and verify it returns the created 
message(s).

Acceptance Criteria

Server Setup: The Express server starts without errors and responds to 
GET /health with { "status": "ok" }.

MongoDB Connection: The server successfully connects to MongoDB, logging 
"MongoDB connected" without errors.

Message Schema: The Message model is defined with fields for text, x, y, 
level, and timestamp.

API Functionality:
A POST request to /messages creates a new message in MongoDB and returns 
it with a 201 status.
A GET request to /messages retrieves all stored messages in JSON format.

Game Design Alignment: The message system supports asynchronous 
interactions (e.g., players leaving messages at specific coordinates), 
consistent with the non-real-time focus of "Into the Dreamlands."

🐱💤
