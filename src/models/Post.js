const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    userdata: Object, // Adjust the structure based on your user data
  },
  skills: {type: [String]},
  price: { type: Number },
  workType: { type: String }, 
  location: {type: String},
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
