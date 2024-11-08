const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    country: { type: String },
    address: { type: String },
    dob: { type: Date },
    profilePictureUrl: { type: String },
    coverPictureUrl: { type: String },
    isVerified: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);