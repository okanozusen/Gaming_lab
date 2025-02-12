const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const gamesRoutes = require("./routes/gamesRoute.js");
const friendsRoutes = require("./routes/friendsRoutes");
const postsRoutes = require("./routes/postsRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const userRoutes = require("./routes/usersRoutes"); 
const messagesRoutes = require("./routes/messagesRoutes");
const knex = require("knex")(require("./knexfile.js").development);
const { Pool } = require("pg");
const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

console.log("🔍 Checking Database Connection Configuration:");
console.log({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? "✅ Password Loaded" : "⚠️ No Password Found!",
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL
});

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
        console.error("🚨 GLOBAL Database Connection Error:", err.message);
    } else {
        console.log("✅ GLOBAL PostgreSQL Database Connection Established!");
        release();
    }
});

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Route Mounting
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/posts", postsRoutes);

console.log("🔍 Checking Registered Routes...");
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(`✅ Route: ${middleware.route.path}`);
    }
});

app.locals.db = knex;

const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let IGDB_ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN || "";
let TOKEN_EXPIRATION_TIME = 0;

const TOKEN_FILE_PATH = "./twitch_token.json";
if (fs.existsSync(TOKEN_FILE_PATH)) {
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE_PATH, "utf8"));
    IGDB_ACCESS_TOKEN = tokenData.access_token;
    TOKEN_EXPIRATION_TIME = tokenData.expires_at;
}

async function getTwitchToken() {
    const currentTime = Math.floor(Date.now() / 1000);

    if (IGDB_ACCESS_TOKEN && currentTime < TOKEN_EXPIRATION_TIME) {
        console.log("✅ Using cached Twitch token:", IGDB_ACCESS_TOKEN);
        return IGDB_ACCESS_TOKEN;
    }

    console.log("🔑 Fetching new Twitch Access Token...");
    try {
        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: "client_credentials",
            }),
        });

        const data = await response.json();
        if (data.access_token) {
            IGDB_ACCESS_TOKEN = data.access_token;
            TOKEN_EXPIRATION_TIME = currentTime + data.expires_in;

            console.log("✅ New Twitch Token:", IGDB_ACCESS_TOKEN);

            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify({
                access_token: IGDB_ACCESS_TOKEN,
                expires_at: TOKEN_EXPIRATION_TIME
            }));

            return IGDB_ACCESS_TOKEN;
        } else {
            throw new Error("⚠️ Failed to retrieve Twitch token");
        }
    } catch (error) {
        console.error("🚨 Twitch Token Fetch Error:", error.message);
        return null;
    }
}

app.use(async (req, res, next) => {
    if (!IGDB_ACCESS_TOKEN) await getTwitchToken();
    req.IGDB_ACCESS_TOKEN = IGDB_ACCESS_TOKEN;
    next();
});

// ✅ Test Database Connection Endpoint
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW();"); 
        res.json({ success: true, time: result.rows[0].now });
    } catch (error) {
        console.error("🚨 Database connection error:", error.message);
        res.status(500).json({ error: "Database connection failed", details: error.message });
    }
});

// ✅ Serve React Frontend for All Routes
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// ✅ Start the Server
app.listen(PORT, async () => {
    await getTwitchToken(); 
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, getTwitchToken, IGDB_ACCESS_TOKEN };
