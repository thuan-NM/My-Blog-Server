const { ObjectId } = require("mongodb");
const { db } = require("../utils/connectDb");
const WebSocket = require("ws");

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", async (ws, req) => {
    const data = getUserIdFromRequest(req);
    // console.log("User connected with ID:", data.senderId);
    ws.userId = data.senderId;

    await loadMessagesFromDB(data.senderId, data.receiverId,ws);

    ws.on("message", async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            // if (parsedMessage.type === "load_messages") {
            //     const { senderId, receiverId } = parsedMessage;
            //     const messages = await loadMessagesFromDB(senderId, receiverId);
            //     messages.forEach((message) => {
            //         broadcastMessage(message, ws);
            //     });
            // } else 
            if (data.senderId === parsedMessage.sender) {
                const savedMessage = await saveMessageToDB(parsedMessage);
                broadcastMessage(savedMessage, ws);
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });
    ws.on("close", () => {
        // console.log("WebSocket connection closed for user:", ws.userId);
        // ws.close()
    });
});

function getUserIdFromRequest(req) {
    try {
        const urlParams = new URLSearchParams(req.url.split("?")[1]);
        data = {
            senderId: urlParams.get("senderId"),
            receiverId: urlParams.get("receiverId")
        }
        return data
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
        if (client !== sender && client.readyState === WebSocket.OPEN) {
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


async function loadMessagesFromDB(senderId, receiverId,ws) {
    try {
        // console.log(receiverId)
        const messages = await db.messages.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        }).toArray();
        // console.log(messages)
        messages.forEach((message) => {
            broadcastMessage(message, ws);
        })
        return messages;
    } catch (error) {
        console.error("Error loading messages from DB:", error);
        return [];
    }
}

module.exports = wss;