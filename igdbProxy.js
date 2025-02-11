const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const router = express.Router();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
let accessToken = "";

// ✅ Function to Fetch Twitch Access Token
async function fetchAccessToken() {
    try {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "client_credentials",
            }),
        });

        const data = await response.json();
        if (data.access_token) {
            console.log("🔑 New Twitch Access Token:", data.access_token);
            accessToken = data.access_token;
        } else {
            console.error("🚨 Failed to get Twitch token");
        }
    } catch (error) {
        console.error("🚨 Error fetching Twitch token:", error.message);
    }
}

// ✅ Fetch Token on Startup
fetchAccessToken();

// ✅ Middleware to Ensure Token Exists
router.use(async (req, res, next) => {
    if (!accessToken) {
        await fetchAccessToken();
    }
    next();
});

// ✅ IGDB API Proxy Route
router.post("/games", async (req, res) => {
    try {
        const query = req.body.query;
        console.log("🎮 Query to IGDB:", query);

        const response = await fetch("https://api.igdb.com/v4/games", {
            method: "POST",
            headers: {
                "Client-ID": CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: query,
        });

        const data = await response.json();
        console.log("✅ IGDB API Response:", data);

        res.json(data);
    } catch (error) {
        console.error("🚨 Error fetching games:", error.message);
        res.status(500).json({ error: "Failed to fetch games from IGDB" });
    }
});

module.exports = router;
