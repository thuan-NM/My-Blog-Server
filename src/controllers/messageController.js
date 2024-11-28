// server.js hoặc nơi bạn cấu hình Socket.IO
const Message = require('../models/Message');

const socket = (io) => {
    io.on("connection", (socket) => {

        // Lắng nghe sự kiện join vào room
        socket.on("join_room", ({ room }) => {
            socket.join(room);
        });

        // Xử lý tin nhắn từ client
        socket.on("send_message", async (data) => {
            // Lưu tin nhắn vào cơ sở dữ liệu
            try {
                const message = new Message(data);
                await message.save();

                // Phát tin nhắn đến tất cả người trong room, bao gồm cả người gửi
                io.to(data.room).emit("receive_message", message); // Sửa từ 'data' thành 'message'
            } catch (error) {
                console.error("Error saving message:", error);
                // Bạn có thể phát thêm sự kiện lỗi nếu cần
            }
        });

        // Xử lý sự kiện typing_start
        socket.on("typing_start", ({ room }) => {
            socket.to(room).emit("typing", { userId: socket.id });
        });

        // Xử lý sự kiện typing_stop
        socket.on("typing_stop", ({ room }) => {
            socket.to(room).emit("typing_stop", { userId: socket.id });
        });

        // Xử lý khi ngắt kết nối
        socket.on("disconnect", () => {
        });
    });
};

const searchMessages = async (req, res) => {
    const { roomId } = req.params; // Room ID of the conversation
    const { searchTerm } = req.query; // Search term for filtering messages

    try {
        // Find messages in the specified room that contain the search term in the text
        const messages = await Message.find({
            room: roomId,
            text: { $regex: searchTerm, $options: 'i' } // Case-insensitive search
        });

        res.status(200).json({
            success: true,
            data: messages,
            message: "Messages found successfully"
        });
    } catch (error) {
        console.error("Error searching messages:", error);
        res.status(500).json({
            success: false,
            message: "Error searching messages"
        });
    }
};

// Function to get the most recent message in a conversation
const getRecentMessage = async (req, res) => {
    const { roomId } = req.params;
    try {
        // Find the most recent message in the specified room
        const recentMessage = await Message.findOne({ room: roomId }).sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            data: recentMessage,
            message: "Recent message retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching recent message:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching recent message"
        });
    }
};

const getMessage = async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 });
        res.status(200).json({
            success: true,
            data: messages,
            message: "Get messages successfully"
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
};

module.exports = {
    searchMessages,
    getRecentMessage,
    getMessage,
    socket
};