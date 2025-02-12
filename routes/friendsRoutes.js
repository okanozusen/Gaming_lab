const express = require("express");
const knex = require("../db/knex"); // ✅ Connects to PostgreSQL
const router = express.Router();

// ✅ Get Friend List
router.get("/list", async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: "Username is required" });

        console.log("🔍 Fetching friends for:", username);

        // Fetch the user's ID
        const user = await knex("users").where("username", username).select("id").first();
        if (!user) return res.status(404).json({ error: "User not found" });

        // Fetch friends based on user_id OR friend_id
        const friendsList = await knex("friends")
            .where("user_id", user.id)
            .orWhere("friend_id", user.id)
            .select("user_id", "friend_id");

        if (friendsList.length === 0) {
            return res.json([]); // No friends found
        }

        // Extract friend IDs (excluding the logged-in user)
        const friendIDs = friendsList.map(f => 
            f.user_id === user.id ? f.friend_id : f.user_id
        );

        // Fetch usernames and profile pics of friends
        const friendProfiles = await knex("users")
            .whereIn("id", friendIDs)
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
        // Get user IDs based on usernames
        const user = await knex("users").where("username", currentUser).first();
        const friend = await knex("users").where("username", friendUsername).first();

        if (!user || !friend) {
            return res.status(404).json({ error: "One or both users not found" });
        }

        // Check if friendship already exists
        const existingFriendship = await knex("friends")
            .where({ user_id: user.id, friend_id: friend.id })
            .orWhere({ user_id: friend.id, friend_id: user.id })
            .first();

        if (existingFriendship) {
            return res.status(400).json({ error: "Friendship already exists" });
        }

        // Insert mutual friendship
        await knex("friends").insert({ user_id: user.id, friend_id: friend.id });

        res.json({ success: true, message: "Friend added successfully" });
    } catch (error) {
        console.error("🚨 Error adding friend:", error.message);
        res.status(500).json({ error: "Failed to add friend" });
    }
});

// ✅ Send a Message to a Friend
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


// ✅ Get Messages with a Friend
// ✅ Add Message Route in friendsRoutes.js
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
        res.json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        console.error("🚨 Error sending message:", error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

module.exports = router;
