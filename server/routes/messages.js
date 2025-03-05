const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// POST a new message
router.post('/', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// GET messages by level (optional filter)
router.get('/level/:level', async (req, res) => {
  try {
    const messages = await Message.find({ level: req.params.level });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages by level:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

module.exports = router;