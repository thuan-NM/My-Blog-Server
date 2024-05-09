const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");
const WebSocket = require("ws");

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", async (ws, req) => {
    const userId = getUserIdFromRequest(req);
    console.log("User connected with ID:", userId);
    ws.userId = userId;

    ws.on("message", async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === "load_messages") {
                const { senderId, receiverId } = parsedMessage;
                const messages = await loadMessagesFromDB(senderId, receiverId);
                messages.forEach((message) => {
                    broadcastMessage(message, ws);
                });
            } else {
                if (userId === parsedMessage.sender) {
                    const savedMessage = await saveMessageToDB(parsedMessage);
                    broadcastMessage(savedMessage, ws);
                } else {
                    console.error("Unauthorized message:", parsedMessage);
                }
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });
});

function getUserIdFromRequest(req) {
    try {
        const urlParams = new URLSearchParams(req.url.split("?")[1]);
        return urlParams.get("user-id");
    } catch (error) {
        console.error("Error extracting user ID from request:", error);
        return null;
    }
}

async function saveMessageToDB(message) {
    try {
        const newMessage = {
            _id: new ObjectId(),
            text: message.text,
            sender: message.sender,
            receiver: message.receiver,
            timestamp: new Date(),
        };
        await db.messages.insertOne(newMessage);
        return newMessage;
    } catch (error) {
        console.error("Error saving message to DB:", error);
        throw error;
    }
}

const broadcastMessage = async (message, sender) => {
    for (const client of wss.clients) {
        if (client === sender && client.readyState === WebSocket.OPEN) {
            // Kiểm tra nếu người nhận không phải là người gửi ban đầu
            if (client.userId === message.sender || client.userId === message.receiver) {
                client.send(JSON.stringify({
                    message: message.text,
                    sender: message.sender,
                    receiver: message.receiver,
                    timestamp: new Date(),
                    _id: message._id,
                })); 
                break;
            }
        }
    }
};


async function loadMessagesFromDB(senderId, receiverId) {
    try {
        const messages = await db.messages.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        }).toArray();
        console.log(messages)
        return messages;
    } catch (error) {
        console.error("Error loading messages from DB:", error);
        return [];
    }
}

module.exports = wss;