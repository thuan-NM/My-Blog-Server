const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");
const WebSocket = require("ws");

const clients = new Set();

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => {
        clients.delete(ws);
    });
});

const broadcastMessage = (message) => {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

const getChatMessages = async (req, res) => {
    try {
        const roomId = req.params.roomId;

        // Get chat messages for the specified room
        const chatMessages = await db.chatMessages.find({
            roomId: new ObjectId(roomId),
        }).toArray();

        res.status(200).json({
            message: "Get chat messages successful",
            data: { chatMessages },
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error getting chat messages:', error);
        res.status(500).json({
            message: 'Failed to get chat messages',
            data: null,
            isSuccess: false,
        });
    }
};

const sendMessage = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const { userId, message } = req.body;

        // Save the new message to the database
        await db.messages.insertOne({
            roomId: new ObjectId(roomId),
            userId: new ObjectId(userId),
            message,
            timestamp: new Date(),
        });

        const newMessage = {
            roomId,
            userId,
            message,
            timestamp: new Date(),
        };

        // Broadcast the new message to all connected WebSocket clients
        broadcastMessage(JSON.stringify(newMessage));

        res.status(200).json({
            message: "Message sent successfully",
            isSuccess: true,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            message: 'Failed to send message',
            isSuccess: false,
        });
    }
};

module.exports = {
    getChatMessages,
    sendMessage,
    wss, // Export WebSocket server instance
    broadcastMessage // Export broadcastMessage function
};
