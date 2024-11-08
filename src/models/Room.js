const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true // Đảm bảo mỗi tên phòng là duy nhất
    },
    participants: {
        type: [String], // Lưu tên hoặc ID của người tham gia
        default: []
    },
    userkey: {
        type: String,
        required: false,
        unique: true // Đảm bảo mỗi phòng có một user key duy nhất
    },
    companykey: {
        type: String,
        required: false,
        unique: true // Đảm bảo mỗi phòng có một company key duy nhất
    }
});

module.exports = mongoose.model('Room', RoomSchema);