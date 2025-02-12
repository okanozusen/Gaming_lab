const express = require("express");
const router = express.Router();
const { searchGames, getGameDetails } = require("../controllers/gamesController");

// Debugging: Log that the router is being set up correctly
console.log("✅ Game Routes Loaded");

// ✅ Define Routes Correctly with Debugging
router.get("/search", async (req, res) => {
    const { search, page } = req.query;

    // Debugging: Log the incoming request parameters
    console.log(`🔍 Searching for games. Search Term: ${search}, Page: ${page}`);

    try {
        await searchGames(req, res);
    } catch (error) {
        console.error("🚨 Error in searchGames route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    // Debugging: Log the game ID being searched
    console.log(`🔍 Fetching game details for Game ID: ${id}`);

    try {
        await getGameDetails(req, res);
    } catch (error) {
        console.error("🚨 Error in getGameDetails route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
