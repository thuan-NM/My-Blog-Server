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
    companyid: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    status: {
        type: String,
        enum: ['Applied', 'Interview', 'Interview Scheduled', 'Interview Confirmed', 'Reschedule Requested', 'Hired', 'Denied'], // Thêm các giá trị hợp lệ vào đây
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
    interviewDate: {
        type: Date,
        required: false,
    },
    confirmationToken: {
        type: String,
        required: false,
        default: "",
    },
    emailReminderSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true, // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('JobStatus', jobStatusSchema);