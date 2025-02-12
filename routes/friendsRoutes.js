const express = require("express");
const knex = require("../db/knex"); // ✅ Connects to PostgreSQL
const router = express.Router();

// ✅ Get Friend List
router.get("/list", async (req, res) => {
    try {
        const { username } = req.query; // Ensure request includes a username
        if (!username) return res.status(400).json({ error: "Username is required" });

        console.log("🔍 Fetching friends for:", username);

        const friends = await knex("friends")
            .where("user1", username)
            .orWhere("user2", username)
            .select("user1", "user2");

        // Extract the usernames that are friends with the current user
        const friendUsernames = friends.map(f =>
            f.user1 === username ? f.user2 : f.user1
        );

        if (friendUsernames.length === 0) {
            return res.status(404).json({ error: "No friends found" });
        }

        const friendProfiles = await knex("users")
            .whereIn("username", friendUsernames)
            .select("username", "profile_pic");

        res.json(friendProfiles);
    } catch (error) {
        console.error("🚨 Error fetching friends:", error.message);
        res.status(500).json({ error: "Failed to fetch friends" });
    }
});

// ✅ Get Friend Profile
router.get("/:username", async (req, res) => {
    try {
        const friend = await knex("users").where("username", req.params.username).first();
        if (friend) res.json(friend);
        else res.status(404).json({ error: "Friend not found" });
    } catch (error) {
        console.error("🚨 Error fetching friend profile:", error.message);
        res.status(500).json({ error: "Failed to fetch friend profile" });
    }
});

// ✅ Add a Friend (Mutual Friendship)
router.post("/add-friend", async (req, res) => {
    const { currentUser, friendUsername } = req.body;
    if (!currentUser || !friendUsername) {
        return res.status(400).json({ error: "Both usernames are required" });
    }

    try {
        const existingFriendship = await knex("friends")
            .where(function () {
                this.where("user1", currentUser).andWhere("user2", friendUsername);
            })
            .orWhere(function () {
                this.where("user1", friendUsername).andWhere("user2", currentUser);
            })
            .first();

        if (!existingFriendship) {
            await knex("friends").insert([
                { user1: currentUser, user2: friendUsername },
                { user1: friendUsername, user2: currentUser }, // Mutual friendship
            ]);
        }

        res.json({ success: true, message: "Friend added successfully" });
    } catch (error) {
        console.error("🚨 Error adding friend:", error.message);
        res.status(500).json({ error: "Failed to add friend" });
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

module.exports = router;
