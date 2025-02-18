const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, 
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } // Required for Render PostgreSQL
});

// ✅ Check Database Connection
pool.connect()
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch((err) => console.error("🚨 Database Connection Error:", err));

// **🔹 Register New User**
exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        console.log("🔍 Registration Attempt:", email, username);

        if (!email || !username || !password) {
            console.error("❌ Missing fields:", req.body);
            return res.status(400).json({ error: "All fields are required." });
        }

        // ✅ Ensure email is in lowercase
        const lowerEmail = email.toLowerCase();

        // ✅ Password Strength Check (at least 8 chars, 1 uppercase, 1 special char)
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            console.error("❌ Weak Password Attempt.");
            return res.status(400).json({
                error: "Password must be at least 8 characters, contain 1 uppercase letter, and 1 special character."
            });
        }

        // ✅ Check if email or username already exists
        const userExists = await pool.query(
            "SELECT id FROM users WHERE email = $1 OR username = $2",
            [lowerEmail, username]
        );

        if (userExists.rowCount > 0) {
            console.error("❌ Email or username already taken:", { lowerEmail, username });
            return res.status(400).json({ error: "Email or username already registered." });
        }

        // ✅ Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert into Database
        const result = await pool.query(
            "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, username, email",
            [lowerEmail, username, hashedPassword]
        );

        console.log("✅ User Registered Successfully:", result.rows[0]);
        return res.json({ message: "Registration successful", user: result.rows[0] });

    } catch (error) {
        console.error("🚨 Registration Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// **🔹 Login User**
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🔍 Login Attempt:", email);

        if (!email || !password) {
            console.error("❌ Missing login fields:", req.body);
            return res.status(400).json({ error: "Email and password are required." });
        }

        const lowerEmail = email.toLowerCase();

        // ✅ Fetch user by email
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [lowerEmail]
        );

        if (userResult.rowCount === 0) {
            console.error("❌ No user found:", lowerEmail);
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = userResult.rows[0];
        console.log("✅ User Found:", user.username);

        // ✅ Validate Password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.error("❌ Incorrect password for:", user.username);
            return res.status(401).json({ error: "Invalid email or password." });
        }

        // ✅ Check JWT Secret
        if (!process.env.JWT_SECRET) {
            console.error("🚨 JWT Secret Missing!");
            return res.status(500).json({ error: "Server misconfiguration." });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("✅ Login Successful! Token Created.");
        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePic: user.profile_pic || "https://picsum.photos/200",
                banner: user.banner || "https://picsum.photos/800/250",
            }
        });

    } catch (error) {
        console.error("🚨 Login Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// **🔹 Middleware: Authenticate User**
exports.authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("🚨 Token Validation Error:", error);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

// **🔹 Fetch User Profile**
exports.getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        console.log("🔍 Fetching Profile for:", username);

        const result = await pool.query(
            "SELECT username, email, profile_pic, banner FROM users WHERE username = $1",
            [username]
        );

        if (result.rowCount === 0) {
            console.error("❌ User not found:", username);
            return res.status(404).json({ error: "User not found." });
        }

        return res.json(result.rows[0]);

    } catch (error) {
        console.error("🚨 Profile Fetch Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};
