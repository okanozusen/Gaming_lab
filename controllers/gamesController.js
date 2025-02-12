const axios = require("axios");

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN;

// ✅ Fetch Data from IGDB API
async function fetchFromIGDB(endpoint, query) {
    try {
        console.log("🌎 Fetching from IGDB:\n", query);  // ✅ Debugging log

        const response = await axios.post(`https://api.igdb.com/v4/${endpoint}`, query, {
            headers: {
                "Client-ID": CLIENT_ID,
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "text/plain",
            },
        });

        console.log("🎮 IGDB API Response:", response.data);  // ✅ Debugging log
        return response.data;
    } catch (error) {
        console.error("🚨 IGDB API Error:", error.response ? error.response.data : error.message);
        throw new Error("IGDB API Request Failed");
    }
}

// ✅ Search & Filter Games with Infinite Scroll
async function searchGames(req, res) {
    try {
        const {
            search = "",
            genres = "",
            themes = "",
            platforms = "",
            esrb = "",
            mode = "",
            page = 1,
        } = req.query;

        const limit = 20;  // ✅ Keep pagination smooth
        const offset = (parseInt(page, 10) - 1) * limit;

        let query = `
            fields id, name, cover.url, genres.name, themes.name, platforms.name, rating, age_ratings.category, game_modes.name, first_release_date;
            limit ${limit};
            offset ${offset};
        `;

        let whereClauses = [];

        // ✅ Type Search (Fix for Resident Evil)
        if (search) {
            whereClauses.push(`name ~ *"${search}"*`);
        }

        // ✅ Genre Filter
        if (genres) whereClauses.push(`genres = (${genres})`);

        // ✅ Theme Filter
        if (themes) whereClauses.push(`themes = (${themes})`);

        // ✅ Platform Filter
        if (platforms) whereClauses.push(`platforms = (${platforms})`);

        // ✅ ESRB Rating Filter
        if (esrb) whereClauses.push(`age_ratings.category = ${esrb}`);

        // ✅ Game Mode Filter
        if (mode) whereClauses.push(`game_modes = (${mode})`);

        // ✅ Apply Filters
        if (whereClauses.length > 0) {
            query += ` where ${whereClauses.join(" & ")};`;
        }

        // ✅ Sort Games By Rating
        query += ` sort rating desc;`;

        console.log("🌎 IGDB Query:\n", query);  // ✅ Debugging log
        const data = await fetchFromIGDB("games", query);

        // ✅ Convert Release Date Format
        const formattedData = data.map((game) => ({
            ...game,
            releaseDate: game.first_release_date
                ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
                : "Unknown",
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch games" });
    }
}

// ✅ Fetch Game Details (FIXED)
async function getGameDetails(gameId) {
    try {
        console.log(`📡 Fetching game details for ID: ${gameId}`);

        // Ensure gameId is valid
        if (!gameId || isNaN(gameId)) {
            throw new Error("Invalid Game ID");
        }

        const response = await axios.post(
            "https://api.igdb.com/v4/games",
            `fields id, name, summary, cover.url, first_release_date, platforms.name, age_ratings.category; where id = ${gameId};`,
            {
                headers: {
                    "Client-ID": process.env.TWITCH_CLIENT_ID,
                    Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
                },
            }
        );

        const game = response.data[0];

        if (!game) {
            console.warn(`⚠️ No game found for ID: ${gameId}`);
            return { error: "Game not found" };
        }

        console.log(`✅ Game details fetched: ${game.name}`);

        return game;
    } catch (error) {
        console.error("🚨 Error fetching game details:", error.message);
        return { error: "Failed to retrieve game details" };
    }
}


// ✅ Export all controller functions
module.exports = { searchGames, getGameDetails };
