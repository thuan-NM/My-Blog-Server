const express = require('express');
const router = express.Router();
const { searchMessages, getRecentMessage, getMessage } = require('../controllers/messageController');

// Lấy tất cả tin nhắn trong một room
router.get('/:room', getMessage);

router.get('/:roomId/search', searchMessages);

// Route to get the most recent message in a conversation
router.get('/:roomId/recent', getRecentMessage);

module.exports = router;
