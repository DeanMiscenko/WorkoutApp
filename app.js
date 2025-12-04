const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;

const DB_NAME = "data_source.db";
const db = new sqlite3.Database(DB_NAME);

db.run(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )
`);

app.use(express.urlencoded({ extended: false })); 
app.use(express.static(path.join(__dirname, "public"))); 



// handles registration form
app.post("/register", (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).send("Please fill in all fields.");
    }

    const trimmedEmail = email.trim().toLowerCase();
    const passwordHash = bcrypt.hashSync(password, 10);

    const insertQuery = `
        INSERT INTO Users (email, password_hash)
        VALUES (?, ?)
    `;

    db.run(insertQuery, [trimmedEmail, passwordHash], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.status(400).send("An account with that email already exists.");
            }
            console.error("DB error on register:", err);
            return res.status(500).send("Server error.");
        }

        return res.redirect("/register_success.html");

    });
});

// handles login form (checks db)
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const trimmedEmail = (email || "").trim().toLowerCase();

    const selectQuery = `
        SELECT * FROM Users WHERE email = ?
    `;

    db.get(selectQuery, [trimmedEmail], (err, user) => {
        if (err) {
            console.error("DB error on login:", err);
            return res.status(500).send("Server error.");
        }

        if (!user) {
            return res.status(400).send("Invalid email or password.");
        }

        const passwordMatches = bcrypt.compareSync(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(400).send("Invalid email or password.");
        }

        // should display when log in successful
        res.send(`
            <h1>Welcome, ${user.email}!</h1>
            <p>You are now logged in.</p>
            <a href="/index.html">Go to home</a>
        `);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
