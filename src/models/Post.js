const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  author: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    userdata: Object, // Adjust the structure based on your user data
  },
  skills: [String],
  typeOfJob: { type: String },
  price: { type: String },
  experience: { type: String },
  workType: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
