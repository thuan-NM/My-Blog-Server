const mongoose = require("mongoose");

const keyskillSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    data: { type: [String] },
}, { timestamps: true });

module.exports = mongoose.model('KeySkill', keyskillSchema);
