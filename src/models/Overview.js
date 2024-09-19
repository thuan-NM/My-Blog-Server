const mongoose = require("mongoose");

const overviewSchema = new mongoose.Schema({
    author: {type: mongoose.Schema.Types.ObjectId},
    data: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Overview', overviewSchema);