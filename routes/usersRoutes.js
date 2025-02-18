const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ✅ PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } // ✅ Forces SSL for Render
});

// ✅ Fetch all users
router.get("/", async (req, res) => {
    try {
        console.log("🔍 Fetching all users from the database...");
        const users = await pool.query(
            "SELECT id, username, profile_pic, banner, platforms, genres FROM users;"
        );
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
            "UPDATE users SET username = $1 WHERE LOWER(username) = LOWER($2) RETURNING *",
            [newUsername, oldUsername]
        );

        if (updateUser.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Update all posts to reflect the new username
        await pool.query(
            "UPDATE posts SET username = $1 WHERE LOWER(username) = LOWER($2)",
            [newUsername, oldUsername]
        );

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

// ✅ Update profile picture (Using File Upload)
// ✅ Update Profile Picture with Proper Error Messages
router.post("/upload-profile-pic", upload.single("profilePic"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const fileBuffer = req.file.buffer.toString("base64");

        const updatePic = await pool.query(
            "UPDATE users SET profile_pic = $1 WHERE LOWER(username) = LOWER($2) RETURNING profile_pic",
            [fileBuffer, username]
        );

        if (updatePic.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Profile picture updated successfully!",
            profilePic: updatePic.rows[0].profile_pic,
        });
    } catch (error) {
        console.error("🚨 Error uploading profile picture:", error.message);
        res.status(500).json({ error: "Failed to upload profile picture", details: error.message });
    }
});

// ✅ Add Banner Upload Route (if missing)
router.post("/upload-banner", upload.single("banner"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const fileBuffer = req.file.buffer.toString("base64");

        const updateBanner = await pool.query(
            "UPDATE users SET banner = $1 WHERE LOWER(username) = LOWER($2) RETURNING banner",
            [fileBuffer, username]
        );

        if (updateBanner.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Banner updated successfully!",
            banner: updateBanner.rows[0].banner,
        });
    } catch (error) {
        console.error("🚨 Error uploading banner:", error.message);
        res.status(500).json({ error: "Failed to upload banner", details: error.message });
    }
});


// ✅ Update user's favorite platforms & genres
router.post("/update-preferences", async (req, res) => {
    try {
        const { username, platforms, genres } = req.body;

        const updatePref = await pool.query(
            "UPDATE users SET platforms = $1, genres = $2 WHERE LOWER(username) = LOWER($3) RETURNING platforms, genres",
            [JSON.stringify(platforms), JSON.stringify(genres), username]
        );

        if (updatePref.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "Preferences updated successfully",
            platforms: updatePref.rows[0].platforms,
            genres: updatePref.rows[0].genres,
        });
    } catch (error) {
        console.error("🚨 Error updating preferences:", error.message);
        res.status(500).json({ error: "Failed to update preferences" });
    }
});

// ✅ Fetch a user's recent posts
router.get("/:username/posts", async (req, res) => {
    try {
        const { username } = req.params;
        const posts = await pool.query(
            "SELECT * FROM posts WHERE LOWER(username) = LOWER($1) ORDER BY created_at DESC",
            [username]
        );

        if (posts.rowCount === 0) {
            return res.status(404).json({ error: "No posts found for this user" });
        }

        res.json(posts.rows);
    } catch (error) {
        console.error("🚨 Error fetching user posts:", error.message);
        res.status(500).json({ error: "Failed to fetch user posts" });
    }
});

// ✅ Test route to confirm users API is working
router.get("/test", (req, res) => {
    res.json({ message: "✅ Users API is working!" });
});

module.exports = router;
