const Message = require('../models/Message');

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Lắng nghe sự kiện join vào room
    socket.on("join_room", ({ room }) => {
      socket.join(room);
      console.log(`${socket.id} joined room: ${room}`);
    });

    // Xử lý tin nhắn từ client
    socket.on("send_message", async (data) => {
      console.log("Message received:", data);
      
      // Lưu tin nhắn vào cơ sở dữ liệu
      try {
        const message = new Message(data);
        await message.save();
        
        // Phát tin nhắn đến tất cả người trong room
        io.to(data.room).emit("receive_message", data);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Xử lý khi ngắt kết nối
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
