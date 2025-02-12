const express = require("express");
const { Pool } = require("pg");
const fetch = require("node-fetch");

const router = express.Router();

const TWITCH_CLIENT_ID = "7prjneawkc0cl5azyplw3vnm8f5vlx";  
const TWITCH_CLIENT_SECRET = "scmkwos1kkcyv39sqy4dnopugyg3b2";  

let IGDB_ACCESS_TOKEN = "";

// ✅ Ensure you use the same DB credentials from `server.js`
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false } 
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
            console.log("✅ New IGDB Access Token:", IGDB_ACCESS_TOKEN);
        } else {
            throw new Error("Failed to get Twitch token");
        }
    } catch (error) {
        console.error("🚨 Failed to get Twitch token", error.message);
    }
}

// ✅ Fetch game details from IGDB
async function fetchGameDetails(gameId) {
    try {
        if (!IGDB_ACCESS_TOKEN) await getTwitchToken(); 

        console.log(`🔍 Fetching game details from IGDB for Game ID: ${gameId}`);

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                "Authorization": `Bearer ${IGDB_ACCESS_TOKEN}`,
                "Content-Type": "text/plain",
            },
            body: `fields id, name; where id = ${parseInt(gameId, 10)};`
        });

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            return { id: gameId, name: "Unknown Game" };
        }

        return { id: data[0].id, name: data[0].name };
    } catch (error) {
        console.error("🚨 Error fetching game from IGDB API:", error.message);
        return { id: gameId, name: "Unknown Game" };
    }
}

// ✅ Fetch all posts with game details and replies
router.get("/", async (req, res) => {
    try {
        console.log("🔍 Fetching posts from the database...");
        
        const posts = await pool.query(
            `SELECT posts.*, games.name AS game_name FROM posts 
             LEFT JOIN games ON posts.game_id = games.id`
        );

        for (let post of posts.rows) {
            const replies = await pool.query("SELECT * FROM replies WHERE post_id = $1", [post.id]);
            post.replies = replies.rows;
        }

        res.json(posts.rows);
    } catch (error) {
        console.error("🚨 Database Query Failed:", error.message);
        res.status(500).json({ error: "Failed to fetch posts", details: error.message });
    }
});

// ✅ Create a new post with game details
router.post("/", async (req, res) => {
    try {
        const { username, content, game_id } = req.body;

        if (!username || !content || !game_id) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const userResult = await pool.query("SELECT id, profile_pic FROM users WHERE username = $1", [username]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user_id = userResult.rows[0].id;
        const profile_pic = userResult.rows[0].profile_pic || "https://placehold.co/50";

        let game_name = "Unknown Game";
        const gameQuery = await pool.query("SELECT name FROM games WHERE id = $1", [game_id]);
        if (gameQuery.rowCount > 0) {
            game_name = gameQuery.rows[0].name;
        } else {
            const gameDetails = await fetchGameDetails(game_id);
            game_name = gameDetails.name;
            await pool.query("INSERT INTO games (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [game_id, game_name]);
        }

        const result = await pool.query(
            "INSERT INTO posts (user_id, username, content, game_id, game_name, profile_pic) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [user_id, username, content, game_id, game_name, profile_pic]
        );

        res.json(result.rows[0]);
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

// ✅ Fetch replies for a post
router.get("/:id/replies", async (req, res) => {
    const { id } = req.params;

    try {
        const replies = await pool.query("SELECT * FROM replies WHERE post_id = $1", [id]);
        res.json(replies.rows);
    } catch (error) {
        console.error("🚨 Error fetching replies:", error.message);
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});

module.exports = router;
