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
        enum: ['Applied', 'Interviewers', 'Hired', 'Denied'],
        required: true,
    },
    candidateInfo: {
        type: Schema.Types.Mixed, // Adjust according to the structure of candidateInfo
        required: false,
    },
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('JobStatus', jobStatusSchema);