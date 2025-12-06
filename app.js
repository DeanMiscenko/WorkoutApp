const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 3000;

const DB_NAME = "data_source.db";
const db = new sqlite3.Database(DB_NAME);

db.run(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);


db.run(`
  CREATE TABLE IF NOT EXISTS UserDetails (
    user_id INTEGER PRIMARY KEY,
    username TEXT,
    goal TEXT,
    weight REAL,
    weight_goal REAL,
    height REAL,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE
  )
`);

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "change_this_secret",
    resave: false,
    saveUninitialized: false
  })
);

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

    req.session.userId = user.id;

    return res.redirect("/account.html");
  });
});

app.post("/details", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send("Not logged in.");
  }

  const { username, goal, weight, weight_goal, height } = req.body;

  const upsertQuery = `
    INSERT INTO UserDetails (user_id, username, goal, weight, weight_goal, height)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      username = excluded.username,
      goal = excluded.goal,
      weight = excluded.weight,
      weight_goal = excluded.weight_goal,
      height = excluded.height
  `;

  db.run(
    upsertQuery,
    [userId, username || null, goal || null, weight || null, weight_goal || null, height || null],
    err => {
      if (err) {
        console.error("DB error on details:", err);
        return res.status(500).send("Server error.");
      }
      return res.redirect("/account.html");
    }
  );
});

app.get("/api/profile", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const query = `
    SELECT 
      Users.email,
      Users.created_at,
      UserDetails.username,
      UserDetails.goal,
      UserDetails.weight,
      UserDetails.weight_goal,
      UserDetails.height
    FROM Users
    LEFT JOIN UserDetails ON Users.id = UserDetails.user_id
    WHERE Users.id = ?
  `;

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error("DB error on profile:", err);
      return res.status(500).json({ error: "Server error" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(row);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
