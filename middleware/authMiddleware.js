const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load environment variables

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key"; // Use env variable

function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token." });
        }
        req.user = user; // Attach user data to request
        next();
    });
}

module.exports = { authenticateToken };
