const fetch = require("node-fetch");
require("dotenv").config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
let accessToken = null;

if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("🚨 Missing Twitch API credentials. Check your .env file.");
}

// ✅ Function to Get a New Access Token
async function getAccessToken() {
    try {
        console.log("🔑 Fetching a new Twitch token...");

        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`🚨 Failed to get access token: ${errorText}`);
        }

        const data = await response.json();
        accessToken = data.access_token; // ✅ Save new token
        console.log("✅ New IGDB Access Token:", accessToken);

        return accessToken;
    } catch (error) {
        console.error("🚨 Twitch Token Error:", error.message);
        throw error;
    }
}

// ✅ Function to Fetch Data from IGDB (With Token Refresh)
async function fetchFromIGDB(endpoint, query, retry = true) {
    if (!accessToken) {
        await getAccessToken(); // Ensure we have a token
    }

    try {
        const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
            method: "POST",
            headers: {
                "Client-ID": CLIENT_ID,
                "Authorization": `Bearer ${accessToken}`, // ✅ Use latest token
                "Content-Type": "text/plain"
            },
            body: query.trim()
        });

        if (response.status === 401 && retry) {
            console.warn("🔄 Token expired. Refreshing...");
            await getAccessToken();
            return fetchFromIGDB(endpoint, query, false); // ✅ Only retry once
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("🚨 IGDB API Error:", errorText);
            throw new Error(`IGDB API Request Failed: ${errorText}`);
        }

        return response.json();
    } catch (error) {
        console.error("🚨 IGDB Fetch Error:", error.message);
        throw error;
    }
}

module.exports = { fetchFromIGDB };
