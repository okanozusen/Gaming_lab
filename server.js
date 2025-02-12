const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const gamesRoutes = require("./routes/gamesRoute.js");
const friendsRoutes = require("./routes/friendsRoutes");
const postsRoutes = require("./routes/postsRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const userRoutes = require("./routes/usersRoutes"); // ✅ Fixed the import (was `users`, now matches `usersRoutes.js`)
const messagesRoutes = require("./routes/messagesRoutes"); // ✅ Ensure messages API route is included
const knex = require("knex")(require("./knexfile.js").development);
const { Pool } = require("pg");

console.log("🔍 Database Credentials:", {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? "✅ Password Loaded" : "⚠️ No Password Found!",
    port: process.env.DB_PORT
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "gaming_lab",
    password: process.env.DB_PASSWORD, // 🔥 Ensure it's a string!
    port: process.env.DB_PORT || 5432,
});

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/users", userRoutes); // ✅ Ensure users API route is mounted correctly
app.use("/api/messages", messagesRoutes); // ✅ Ensure messages API route is mounted correctly
app.use("/api/games", gamesRoutes); // ✅ Mount games routes here
app.use("/api/friends", friendsRoutes);
app.use("/api/posts", postsRoutes);

// ✅ Correct Route Checking
console.log("🔍 Checking Registered Routes...");
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(`✅ Route: ${middleware.route.path}`);
    }
});

app.locals.db = knex;

const PORT = 5000;
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
let ACCESS_TOKEN = "";

// ✅ Function to fetch a new Twitch token
async function getTwitchToken() {
    try {
        console.log("🔑 Fetching new Twitch token...");
        const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "client_credentials",
            },
        });
        ACCESS_TOKEN = response.data.access_token;
        console.log("✅ New Twitch Access Token:", ACCESS_TOKEN);
    } catch (error) {
        console.error("🚨 Failed to get Twitch token", error.response ? error.response.data : error.message);
    }
}

// ✅ Middleware to refresh token before making API requests
app.use(async (req, res, next) => {
    if (!ACCESS_TOKEN) await getTwitchToken();
    req.ACCESS_TOKEN = ACCESS_TOKEN;
    next();
});

// ✅ Start the Server
app.listen(PORT, async () => {
    await getTwitchToken(); // ✅ Fetch token before starting
    console.log(`🚀 Server running on port ${PORT}`);
});
