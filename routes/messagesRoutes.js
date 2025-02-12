const express = require("express");
const knex = require("../db/knex");
const router = express.Router();

// ✅ Fetch All Messages for a User (Grouped by Sender)
router.get("/:username", async (req, res) => {
    try {
        const messages = await knex("messages")
            .where("receiver", req.params.username)
            .orWhere("sender", req.params.username)
            .orderBy("timestamp", "desc");

        res.json(messages);
    } catch (error) {
        console.error("🚨 Error fetching messages:", error.message);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// ✅ Send a Message (User Replies)
router.post("/:receiver/message", async (req, res) => {
    const { receiver } = req.params;
    const { sender, message } = req.body;

    if (!message || !sender) {
        return res.status(400).json({ error: "Message and sender are required!" });
    }

    try {
        await knex("messages").insert({
            sender,
            receiver,
            content: message,
            timestamp: knex.fn.now(),
        });

        console.log(`📨 Message sent from ${sender} to ${receiver}: "${message}"`);
        res.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("🚨 Error sending message:", error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

module.exports = router;
