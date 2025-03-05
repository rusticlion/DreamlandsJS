const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const messageRoutes = require('./routes/messages');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set strictQuery option to suppress deprecation warning
mongoose.set('strictQuery', false);

// Connect to MongoDB
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dreamlands';
mongoose.connect(uri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/messages', messageRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));