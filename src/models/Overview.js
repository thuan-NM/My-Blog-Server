const mongoose = require("mongoose");

const overviewSchema = new mongoose.Schema({
    data: { type: String, required: true },
    author: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userdata: Object,
    }
}, { timestamps: true });

module.exports = mongoose.model('Overview', overviewSchema);