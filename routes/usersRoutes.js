const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

// ✅ PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } // ✅ Forces SSL for Render
});

// ✅ Fetch all users (Fixes "Cannot GET /api/users")
router.get("/", async (req, res) => {
    try {
        console.log("🔍 Fetching all users from the database...");
        const users = await pool.query("SELECT id, username, profile_pic, banner, platforms, genres FROM users;");
        console.log("✅ Users Retrieved:", users.rows);
        res.json(users.rows);
    } catch (error) {
        console.error("🚨 Error fetching users:", error.message);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ✅ Update username (and reflect it in posts)
router.post("/update-username", async (req, res) => {
    const { oldUsername, newUsername } = req.body;

    if (!oldUsername || !newUsername) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // ✅ Update username in users table
        const updateUser = await pool.query(
            "UPDATE users SET username = $1 WHERE username = $2 RETURNING *",
            [newUsername, oldUsername]
        );

        if (updateUser.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Update all posts to reflect the new username
        await pool.query("UPDATE posts SET username = $1 WHERE username = $2", [
            newUsername,
            oldUsername,
        ]);

        res.json({
            success: true,
            message: "Username updated successfully.",
            user: updateUser.rows[0],
        });
    } catch (error) {
        console.error("🚨 Error updating username:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Get user profile (including platforms & genres)
router.get("/:username", async (req, res) => {
    console.log("🔍 Received username:", req.params.username);

    try {
        const userResult = await pool.query(
            `SELECT id, username, profile_pic, banner, platforms, genres 
             FROM users 
             WHERE LOWER(username) = LOWER($1)`, 
            [req.params.username]
        );

        if (userResult.rowCount === 0) {
            console.log("❌ User not found in database!");
            return res.status(404).json({ error: "User not found" });
        }

        console.log("✅ User found:", userResult.rows[0]);

        res.json(userResult.rows[0]);
    } catch (error) {
        console.error("🚨 Error fetching user details:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Test route to confirm users API is working
router.get("/test", (req, res) => {
    res.json({ message: "✅ Users API is working!" });
});

// ✅ Update profile picture
router.post("/update-profile-pic", async (req, res) => {
    try {
        const { username, profile_pic } = req.body;

        if (!username || !profile_pic) {
            return res.status(400).json({ error: "Username and profile picture are required." });
        }

        const result = await pool.query(
            "UPDATE users SET profile_pic = $1 WHERE username = $2 RETURNING *",
            [profile_pic, username]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json({ success: true, message: "Profile picture updated successfully." });
    } catch (error) {
        console.error("🚨 Error updating profile picture:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Update user's favorite platforms & genres
router.post("/update-preferences", async (req, res) => {
    try {
        const { username, platforms, genres } = req.body;

        if (!username) {
            return res.status(400).json({ error: "Username is required." });
        }

        // ✅ Ensure arrays are valid JSON strings for PostgreSQL storage
        const formattedPlatforms = platforms ? JSON.stringify(platforms) : null;
        const formattedGenres = genres ? JSON.stringify(genres) : null;

        const result = await pool.query(
            `UPDATE users 
             SET platforms = COALESCE($1, platforms), 
                 genres = COALESCE($2, genres) 
             WHERE username = $3 RETURNING *`,
            [formattedPlatforms, formattedGenres, username]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json({ success: true, message: "Preferences updated successfully." });
    } catch (error) {
        console.error("🚨 Error updating preferences:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
