const express = require("express");
const { Pool } = require("pg");
const fetch = require("node-fetch");

const router = express.Router();

const TWITCH_CLIENT_ID = "7prjneawkc0cl5azyplw3vnm8f5vlx";  // Replace with your Twitch Client ID
const TWITCH_CLIENT_SECRET = "scmkwos1kkcyv39sqy4dnopugyg3b2";  // Replace with your Twitch Client Secret

let IGDB_ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN || ""; // ✅ Start with environment variable
let TOKEN_EXPIRATION_TIME = 0; // ✅ Store token expiration timestamp

// ✅ Ensure you use the same DB credentials from `server.js`
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } // ✅ OVERRIDES SSL ISSUES
});

pool.connect((err, client, release) => {
    if (err) {
        console.error("🚨 Database Connection Error:", err.message);
    } else {
        console.log("✅ Successfully connected to PostgreSQL Database!");
        release();
    }
});

// ✅ Fetch new Twitch token for IGDB API
async function getTwitchToken() {
    const currentTime = Math.floor(Date.now() / 1000); // ✅ Get current time in seconds

    if (IGDB_ACCESS_TOKEN && currentTime < TOKEN_EXPIRATION_TIME) {
        console.log("✅ Using cached Twitch token");
        return IGDB_ACCESS_TOKEN;
    }

    console.log("🔑 Fetching new Twitch Access Token...");

    try {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_CLIENT_SECRET,
                grant_type: "client_credentials",
            }),
        });

        const data = await response.json();
        if (data.access_token) {
            IGDB_ACCESS_TOKEN = data.access_token;
            TOKEN_EXPIRATION_TIME = currentTime + data.expires_in; // ✅ Save expiration time

            console.log("✅ New IGDB Access Token Set:", IGDB_ACCESS_TOKEN);
            return IGDB_ACCESS_TOKEN;
        } else {
            throw new Error("⚠️ Failed to retrieve Twitch token");
        }
    } catch (error) {
        console.error("🚨 Twitch Token Fetch Error:", error.message);
        return null;
    }
}
// ✅ Fetch game details from IGDB with correct query format
// ✅ Fetch game details from IGDB API properly
async function fetchGameDetails(gameId) {
    try {
        if (!IGDB_ACCESS_TOKEN) {  // ✅ Ensure a valid token before making the request
            console.log("⚠️ No IGDB Token Found! Fetching a new one...");
            await getTwitchToken();
        }

        console.log(`🔍 Fetching game details for Game ID: ${gameId}`);

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": process.env.TWITCH_CLIENT_ID,
                "Authorization": `Bearer ${IGDB_ACCESS_TOKEN}`,
                "Content-Type": "text/plain",
            },
            body: `fields id, name; where id = ${parseInt(gameId, 10)};`
        });

        if (response.status === 401) {  // ✅ If token expired, refresh it and retry
            console.log("🔄 IGDB Token Expired. Refreshing...");
            await getTwitchToken();
            return await fetchGameDetails(gameId); // ✅ Retry with new token
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            console.log(`⚠️ No results from IGDB for Game ID: ${gameId}`);
            return { id: gameId, name: "Unknown Game" };
        }

        console.log(`✅ Found Game: ${data[0].name}`);
        return { id: data[0].id, name: data[0].name };
    } catch (error) {
        console.error("🚨 Error fetching game from IGDB API:", error.message);
        return { id: gameId, name: "Unknown Game" };
    }
}

// ✅ Fetch all posts with game details and replies
// ✅ Fetch all posts with correct game details
router.get("/", async (req, res) => {
    try {
        console.log("🔍 Fetching posts from the database...");

        const posts = await pool.query(
            `SELECT posts.*, COALESCE(games.name, 'Unknown Game') AS game_name 
             FROM posts 
             LEFT JOIN games ON posts.game_id = games.id`
        );

        for (let post of posts.rows) {
            const replies = await pool.query("SELECT * FROM replies WHERE post_id = $1", [post.id]);
            post.replies = replies.rows;
        }

        console.log("✅ Posts Fetched:", posts.rows);
        res.json(posts.rows);
    } catch (error) {
        console.error("🚨 Database Query Failed:", error.message);
        res.status(500).json({ error: "Failed to fetch posts", details: error.message });
    }
});

// ✅ Create a new post (fetch game details if missing)
// ✅ Create a new post (fetch game details if missing)
router.post("/", async (req, res) => {
    try {
        const { username, content, game_id } = req.body;

        if (!username || !content || !game_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Ensure the user exists
        const userResult = await pool.query("SELECT id, profile_pic FROM users WHERE username = $1", [username]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user_id = userResult.rows[0].id;
        const profile_pic = userResult.rows[0].profile_pic || "https://placehold.co/50";

        let game_name = "Unknown Game";

        // ✅ Check if the game exists in the database
        const gameQuery = await pool.query("SELECT name FROM games WHERE id = $1", [game_id]);

        if (gameQuery.rowCount > 0) {
            game_name = gameQuery.rows[0].name;
        } else {
            console.log(`🔍 Game ID ${game_id} not found in database, fetching from IGDB...`);
            const gameDetails = await fetchGameDetails(game_id);
            game_name = gameDetails.name;

            // ✅ Save the new game in the database
            await pool.query("INSERT INTO games (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [game_id, game_name]);
        }

        // ✅ Insert the post with the correct game name
        const result = await pool.query(
            "INSERT INTO posts (user_id, username, content, game_id, game_name, profile_pic) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [user_id, username, content, game_id, game_name, profile_pic]
        );

        console.log("✅ Post Created:", result.rows[0]); // Debugging log
        res.json(result.rows[0]); // ✅ Ensure game_name is sent back
    } catch (error) {
        console.error("🚨 Error posting:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// ✅ Add a reply to a post
router.post("/:id/reply", async (req, res) => {
    const { id } = req.params;
    const { username, content } = req.body;

    if (!username || !content) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const postCheck = await pool.query("SELECT id FROM posts WHERE id = $1", [id]);
        if (postCheck.rowCount === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        const result = await pool.query("INSERT INTO replies (post_id, username, content) VALUES ($1, $2, $3) RETURNING *", [id, username, content]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("🚨 Error adding reply:", error.message);
        res.status(500).json({ error: "Failed to add reply" });
    }
});

module.exports = router;