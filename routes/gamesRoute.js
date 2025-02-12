const express = require("express");
const { searchGames, getGameDetails } = require("../controllers/gamesController");

const router = express.Router();

// Log to ensure the router is loaded
console.log("✅ Game Routes Loaded");

// Search endpoint
router.get("/search", async (req, res) => {
    const { search, page } = req.query;

    // Log incoming request parameters for debugging
    console.log(`🔍 Searching for games. Search Term: ${search}, Page: ${page}`);

    try {
        // Call the search function from the controller
        await searchGames(req, res);
    } catch (error) {
        console.error("🚨 Error in searchGames route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Game details endpoint
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    // Log game details request
    console.log(`🔍 Fetching details for Game ID: ${id}`);

    try {
        // Call the function to fetch game details
        await getGameDetails(req, res);
    } catch (error) {
        console.error("🚨 Error in getGameDetails route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
