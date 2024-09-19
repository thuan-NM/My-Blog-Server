const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Lấy tất cả tin nhắn trong một room
router.get('/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

module.exports = router;
