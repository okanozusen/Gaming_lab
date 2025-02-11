const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// ✅ Connect to PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "gaming_lab",
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// ✅ Get Messages for a User
router.get("/", async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const messages = await pool.query(
            "SELECT * FROM messages WHERE recipient = $1 ORDER BY created_at DESC",
            [username]
        );

        res.json(messages.rows);
    } catch (error) {
        console.error("🚨 Error fetching messages:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
