const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");
const WebSocket = require("ws");

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", async (ws) => {
    // Load messages from the database when a new connection is established
    const messages = await loadMessagesFromDB();
    messages.forEach((message) => {
        broadcastMessage(message, ws);
    });

    ws.on("message", async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            await saveMessageToDB(parsedMessage);
            broadcastMessage(parsedMessage, ws); // Gửi lại message dưới dạng JSON
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
});

const saveMessageToDB = async (message) => {
    try {
        await db.messages.insertOne({
            text: message.text,
            sender: message.sender,
            receiver: message.receiver,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Error saving message to DB:', error);
    }
};

const broadcastMessage = async (message, sender) => {
    for (const client of wss.clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                message: message.text,
                sender: message.sender,
                receiver: message.receiver,
                timestamp: new Date(),
            }));
        }
    }
};

const loadMessagesFromDB = async () => {
    try {
        const messages = await db.messages.find({}).toArray();
        return messages;
    } catch (error) {
        console.error('Error loading messages from DB:', error);
        return [];
    }
};

module.exports = wss;
