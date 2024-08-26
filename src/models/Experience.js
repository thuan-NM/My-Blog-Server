const mongoose = require('mongoose');

const ExperienceSchema = new mongoose.Schema({
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userdata: Object, 
      },
  }, { timestamps: true });
  
  module.exports = mongoose.model('Experience', ExperienceSchema);