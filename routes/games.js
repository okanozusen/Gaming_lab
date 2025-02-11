const express = require("express");
const router = express.Router();
const { searchGames, getGameDetails } = require("../controllers/gamesController");

// ✅ Define Routes Correctly
router.get("/search", searchGames);
router.get("/:id", getGameDetails);

module.exports = router;
