const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "gaming_lab",
    password: process.env.DB_PASSWORD, // ✅ Ensure it's a string
    port: process.env.DB_PORT || 5432,
});

// **✅ Register New User**
exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        console.log("🔍 Registration Attempt:", email, username);

        if (!email || !username || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        // ✅ Ensure password security
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters long, contain 1 uppercase letter, and 1 special character." });
        }

        // ✅ Convert email to lowercase before storing
        const lowerEmail = email.toLowerCase();

        // ✅ Check if email or username is already taken
        const userExists = await pool.query(
            "SELECT id FROM users WHERE email = $1 OR username = $2",
            [lowerEmail, username]
        );
        if (userExists.rowCount > 0) {
            return res.status(400).json({ error: "Email or username already registered." });
        }

        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new user
        const result = await pool.query(
            "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, username, email",
            [lowerEmail, username, hashedPassword]
        );

        res.json({ message: "Registration successful", user: result.rows[0] });
    } catch (error) {
        console.error("🚨 Registration Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// **✅ Login User**
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🔍 Login Attempt - Email:", email);

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        // ✅ Convert email to lowercase to match database
        const lowerEmail = email.toLowerCase();

        // ✅ Fetch user by email
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [lowerEmail]
        );

        if (userResult.rowCount === 0) {
            console.log("❌ No user found with this email.");
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = userResult.rows[0];
        console.log("✅ User Found:", user);

        // ✅ Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log("🔍 Password Match Result:", validPassword);

        if (!validPassword) {
            console.log("❌ Password does not match!");
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // ✅ Generate Token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("✅ Login Successful! Token Generated.");

        // ✅ Return user data
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,  
                email: user.email,
                profilePic: user.profile_pic || "https://picsum.photos/200",  // ✅ Default Profile Pic
                banner: user.banner || "https://picsum.photos/800/250",  // ✅ Default Banner
            }
        });

    } catch (error) {
        console.error("🚨 Login Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// **✅ Middleware to Protect Routes**
exports.authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];  // Extract Bearer Token

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // ✅ Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// **✅ Fetch User Profile**
exports.getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        console.log("🔍 Fetching Profile for:", username);

        const result = await pool.query("SELECT username, email, profile_pic, banner FROM users WHERE username = $1", [username]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("🚨 Profile Fetch Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// **✅ Update Username**
exports.updateUsername = async (req, res) => {
    try {
        const { oldUsername, newUsername } = req.body;
        console.log(`🔄 Updating username from ${oldUsername} to ${newUsername}`);

        if (!oldUsername || !newUsername) {
            return res.status(400).json({ error: "Old and new username are required." });
        }

        // ✅ Check if new username is taken
        const usernameExists = await pool.query("SELECT id FROM users WHERE username = $1", [newUsername]);
        if (usernameExists.rowCount > 0) {
            return res.status(400).json({ error: "Username is already taken." });
        }

        await pool.query("UPDATE users SET username = $1 WHERE username = $2", [newUsername, oldUsername]);
        res.json({ message: "Username updated successfully", newUsername });

    } catch (error) {
        console.error("🚨 Username Update Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// **✅ Update User Preferences**
exports.updatePreferences = async (req, res) => {
    try {
        const { username, platforms, genres } = req.body;
        console.log(`🔄 Updating Preferences for ${username}`);

        if (!username) {
            return res.status(400).json({ error: "Username is required." });
        }

        await pool.query("UPDATE users SET platforms = $1, genres = $2 WHERE username = $3", [platforms, genres, username]);
        res.json({ message: "Preferences updated successfully", platforms, genres });

    } catch (error) {
        console.error("🚨 Preferences Update Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

