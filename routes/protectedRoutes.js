const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

// ✅ Middleware to Authenticate Token
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract Bearer Token
    if (!token) return res.status(401).json({ message: "Access Denied" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = user; // Attach user data to request
        next();
    });
};

// ✅ Protect the following routes
router.get("/dashboard", authenticateToken, (req, res) => {
    res.json({ message: "Welcome to the protected dashboard!", user: req.user });
});

module.exports = router; // ✅ Use CommonJS `module.exports`
