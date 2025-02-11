const express = require("express");
const knex = require("../db/knex"); // ✅ Connects to PostgreSQL

const router = express.Router();

// ✅ Get Friend List
router.get("/", async (req, res) => {
    try {
        const friends = await knex("friends").select("*");
        res.json(friends);
    } catch (error) {
        console.error("🚨 Error fetching friends:", error.message);
        res.status(500).json({ error: "Failed to fetch friends" });
    }
});

// ✅ Get Friend Profile
router.get("/:username", async (req, res) => {
    try {
        const friend = await knex("friends").where("username", req.params.username).first();
        if (friend) res.json(friend);
        else res.status(404).json({ error: "Friend not found" });
    } catch (error) {
        console.error("🚨 Error fetching friend profile:", error.message);
        res.status(500).json({ error: "Failed to fetch friend profile" });
    }
});

// ✅ Send a Message to a Friend
router.post("/:username/message", async (req, res) => {
    const { username } = req.params;
    const { sender, message } = req.body;

    if (!message || !sender) {
        return res.status(400).json({ error: "Message and sender are required!" });
    }

    try {
        await knex("messages").insert({
            sender,
            receiver: username,
            content: message,
            timestamp: knex.fn.now(),
        });

        console.log(`📨 Message sent from ${sender} to ${username}: "${message}"`);
        res.json({ success: true });
    } catch (error) {
        console.error("🚨 Error sending message:", error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// ✅ Get Messages with a Friend
router.get("/:username/messages", async (req, res) => {
    const { username } = req.params;

    try {
        const messages = await knex("messages")
            .where("receiver", username)
            .orWhere("sender", username)
            .orderBy("timestamp", "desc");

        res.json(messages);
    } catch (error) {
        console.error("🚨 Error fetching messages:", error.message);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// ✅ Add a Friend
router.post("/", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });

    try {
        const existingFriend = await knex("friends").where("username", username).first();
        if (!existingFriend) {
            await knex("friends").insert({ username });
        }

        const friends = await knex("friends").select("*");
        res.json(friends);
    } catch (error) {
        console.error("🚨 Error adding friend:", error.message);
        res.status(500).json({ error: "Failed to add friend" });
    }
});

module.exports = router;
