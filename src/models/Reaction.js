const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Reaction = mongoose.model('Reaction', reactionSchema);

module.exports = Reaction;
