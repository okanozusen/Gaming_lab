const express = require("express");
const { searchGames, getGameDetails } = require("../controllers/gamesController");
const router = express.Router();

// ✅ Route: Search for Games
router.get("/", async (req, res) => {  
    const { search, genres, themes, platforms, esrb, mode, page } = req.query;

    console.log(`🔍 Searching for games with params: ${JSON.stringify(req.query)}`);

    try {
        await searchGames(req, res);
    } catch (error) {
        console.error("🚨 Error in searchGames route:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Route: Get Game Details by ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    
    // ✅ Ensure ID is a valid number
    const gameId = parseInt(id, 10);
    if (isNaN(gameId)) {
        return res.status(400).json({ error: "Invalid Game ID" });
    }

    console.log(`🔍 Fetching game details for ID: ${gameId}`);

    try {
        const gameDetails = await getGameDetails(gameId);
        
        if (!gameDetails || gameDetails.error) {
            return res.status(404).json({ error: "Game not found" });
        }

        res.json(gameDetails);
    } catch (error) {
        console.error("🚨 Error in getGameDetails route:", error.message);
        res.status(500).json({ error: "Failed to fetch game details" });
    }
});

module.exports = router;
