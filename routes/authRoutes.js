const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
});

module.exports = router;
