const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
    school: { type: String, required: true },
    degree: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date ,required: true},
    description: { type: String },
    author: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userdata: Object,
    }
}, { timestamps: true });

module.exports = mongoose.model('Education', educationSchema);

