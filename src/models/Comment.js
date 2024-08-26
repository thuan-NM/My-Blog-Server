const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: Object, // Adjust the structure based on your user data
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
