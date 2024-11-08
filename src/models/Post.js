const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    author: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
        userdata: Object, // Adjust the structure based on your user data
    },
    skills: { type: [String] },
    price: { type: Number },
    workType: { type: String },
    location: {
        type: {
            type: String,
            enum: ['Point'], // Must be 'Point'
            required: true,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
        address: { type: String, required: true },
    },
}, {
    timestamps: true
});

// Create a 2dsphere index on the location field
postSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Post', postSchema);
