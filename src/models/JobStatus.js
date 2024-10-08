const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobStatusSchema = new Schema({
    postid: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userid: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['Applied', 'Pending Interview', 'Interview', 'Hired', 'Denied'],
        required: true,
    },
    coverLetter: {
        type: String,
        required: true,
    },
    cvUrl: {
        type: String,
        required: true,
    },
    confirmationToken: {
        type: String,
        required: false,
        default: "",
    },
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('JobStatus', jobStatusSchema);