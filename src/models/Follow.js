const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  followId: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;