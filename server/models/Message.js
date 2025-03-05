const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  level: { type: String, default: 'default' }, // For different game areas
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;