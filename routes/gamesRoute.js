const express = require("express");
const { searchGames, getGameDetails } = require("../controllers/gamesController");
const router = express.Router();

// Fix the route from /search to /games
router.get("/", async (req, res) => {  // This should match '/api/games'
    const { search, genres, themes, platforms, esrb, mode, page } = req.query;

    // Log to debug the incoming request
    console.log(`🔍 Searching for games with params: ${req.query}`);
    
    try {
        await searchGames(req, res);
    } catch (error) {
        console.error("🚨 Error in searchGames route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Existing game details route
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`🔍 Fetching game details for ID: ${id}`);
    
    try {
        await getGameDetails(req, res);
    } catch (error) {
        console.error("🚨 Error in getGameDetails route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get("/search", async (req, res) => {
    const { search } = req.query;
    if (!search) {
        return res.status(400).json({ error: "Missing search query" });
    }

    try {
        await searchGames(req, res);
    } catch (error) {
        console.error("🚨 Error in game search route:", error.message);
        res.status(500).json({ error: "Failed to fetch game details" });
    }
});


module.exports = router;
