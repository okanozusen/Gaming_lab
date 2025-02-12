const express = require("express");
const { Pool } = require("pg");
const fetch = require("node-fetch");

const router = express.Router();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let IGDB_ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN || "";
let TOKEN_EXPIRATION_TIME = 0;

// ✅ Ensure DB connection
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

// ✅ Fetch new Twitch token
async function getTwitchToken() {
    const currentTime = Math.floor(Date.now() / 1000);

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
            TOKEN_EXPIRATION_TIME = currentTime + data.expires_in;
            console.log("✅ New IGDB Access Token Set");
            return IGDB_ACCESS_TOKEN;
        } else {
            throw new Error("⚠️ Failed to retrieve Twitch token");
        }
    } catch (error) {
        console.error("🚨 Twitch Token Fetch Error:", error.message);
        return null;
    }
}

// ✅ Fetch game details
async function fetchGameDetails(gameId) {
    try {
        const accessToken = await getTwitchToken();
        if (!accessToken) return { id: gameId, name: "Unknown Game" };

        console.log(`🔍 Fetching game details from IGDB for Game ID: ${gameId}`);

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": TWITCH_CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: `fields id, name; where id = ${parseInt(gameId, 10)};`,
        });

        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            console.log(`⚠️ IGDB API returned no results for Game ID: ${gameId}`);
            return { id: gameId, name: "Unknown Game" };
        }

        console.log(`✅ Found Game: ${data[0].name}`);
        return { id: data[0].id, name: data[0].name };
    } catch (error) {
        console.error("🚨 Error fetching game from IGDB API:", error.message);
        return { id: gameId, name: "Unknown Game" };
    }
}

// ✅ Fetch posts with correct game details
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

module.exports = router;
