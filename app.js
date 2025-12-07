const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 3000;

const DB_NAME = "data_source.db";
const db = new sqlite3.Database(DB_NAME);

db.serialize(() => {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS Exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      body_part TEXT,
      description TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS WorkoutLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL,
      sets INTEGER,
      reps_per_set INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY(exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
    )
  `);

  db.get("SELECT COUNT(*) AS count FROM Exercises", (err, row) => {
    if (err) {
      console.error("Error counting exercises:", err.message);
      return;
    }
    if (row && row.count > 0) {
      console.log("Exercises already seeded, skipping.");
      return;
    }

    console.log("Seeding exercises table...");

    const insert = db.prepare(
      "INSERT INTO Exercises (name, region, body_part, description) VALUES (?, ?, ?, ?)"
    );

    insert.run("Pull-up", "upper", "back", "Vertical pulling movement targeting lats, upper back and biceps. Can be done bodyweight or assisted.");
    insert.run("Barbell row", "upper", "back", "Hip-hinged horizontal row focusing on mid-back and lats, with some posterior-chain stability.");
    insert.run("Face pull", "upper", "shoulders", "Cable or band pull to the face that strengthens rear delts and external rotators.");
    insert.run("Overhead press", "upper", "shoulders", "Pressing movement overhead, targeting front and side delts and triceps.");
    insert.run("Barbell curl", "upper", "biceps", "Standing curl focusing on elbow flexion and biceps size and strength.");
    insert.run("Hammer curl", "upper", "biceps", "Neutral-grip curl emphasizing brachialis and forearm muscles.");
    insert.run("Skullcrusher", "upper", "triceps", "Lying triceps extension to target long head and overall triceps strength.");
    insert.run("Cable pushdown", "upper", "triceps", "Cable movement isolating triceps with controlled lockout.");
    insert.run("Wrist curl", "upper", "forearms", "Seated curl variation focusing on wrist flexors and grip endurance.");
    insert.run("Reverse curl", "upper", "forearms", "Overhand grip curl targeting brachioradialis and wrist extensors.");
    insert.run("Bench press", "upper", "chest", "Horizontal press for chest, shoulders and triceps, often used as a strength benchmark.");
    insert.run("Incline dumbbell press", "upper", "chest", "Incline variation emphasizing upper chest and front delts.");

    insert.run("Plank", "core", "core", "Isometric hold in a straight line, training bracing and overall core stability.");
    insert.run("Side plank", "core", "core", "Side-on hold emphasizing obliques and lateral hip stability.");
    insert.run("Hanging leg raise", "core", "core", "Hanging hip flexion for lower abs and grip strength.");
    insert.run("Dead bug", "core", "core", "Slow, controlled contralateral limb movement while maintaining a braced trunk.");
    insert.run("Cable woodchop", "core", "core", "Rotational movement training obliques and anti-rotation control.");
    insert.run("Ab wheel rollout", "core", "core", "Dynamic anti-extension drill challenging the entire anterior core.");

    insert.run("Hip thrust", "lower", "glutes", "Horizontal hip extension focusing on glute strength and lockout power.");
    insert.run("Glute bridge", "lower", "glutes", "Bodyweight or loaded bridge for glutes and posterior chain activation.");
    insert.run("Back squat", "lower", "quads", "Compound squat variation targeting quads, glutes and overall leg strength.");
    insert.run("Leg press", "lower", "quads", "Machine-based pressing movement to load quads with added stability.");
    insert.run("Romanian deadlift", "lower", "hamstrings", "Hip hinge emphasizing hamstrings and glutes with minimal knee bend.");
    insert.run("Lying leg curl", "lower", "hamstrings", "Machine curl targeting knee flexion strength in the hamstrings.");
    insert.run("Standing calf raise", "lower", "calves", "Straight-leg calf raise focusing on gastrocnemius.");
    insert.run("Seated calf raise", "lower", "calves", "Bent-knee calf raise emphasizing soleus and calf endurance.");

    insert.finalize();
  });
});


db.run(`
  CREATE TABLE IF NOT EXISTS WorkoutLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    weight REAL,
    sets INTEGER,
    reps_per_set INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
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

app.get("/api/exercises", (req, res) => {
  const { id, region, body_part } = req.query;

  if (id) {
    db.get("SELECT * FROM Exercises WHERE id = ?", [id], (err, row) => {
      if (err) {
        console.error("DB error on get exercise:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (!row) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      return res.json(row);
    });
    return;
  }

  let where = "WHERE 1=1";
  const params = [];

  if (region) {
    where += " AND region = ?";
    params.push(region);
  }
  if (body_part) {
    where += " AND body_part = ?";
    params.push(body_part);
  }

  db.all(
    `SELECT * FROM Exercises ${where} ORDER BY name`,
    params,
    (err, rows) => {
      if (err) {
        console.error("DB error on list exercises:", err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(rows || []);
    }
  );
});

app.post("/log-exercise", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send("Not logged in.");
  }

  const { exercise_id, weight, sets, reps_per_set } = req.body;

  db.run(
    `
      INSERT INTO WorkoutLogs (user_id, exercise_id, weight, sets, reps_per_set)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      exercise_id,
      weight || null,
      sets || null,
      reps_per_set || null
    ],
    err => {
      if (err) {
        console.error("DB error on log exercise:", err);
        return res.status(500).send("Server error.");
      }
      return res.redirect("/account.html");
    }
  );
});

app.get("/api/recent-activity", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const sql = `
    SELECT 
      WorkoutLogs.id,
      WorkoutLogs.created_at,
      WorkoutLogs.weight,
      WorkoutLogs.sets,
      WorkoutLogs.reps_per_set,
      Exercises.name
    FROM WorkoutLogs
    JOIN Exercises ON WorkoutLogs.exercise_id = Exercises.id
    WHERE WorkoutLogs.user_id = ?
    ORDER BY WorkoutLogs.created_at DESC
    LIMIT 4
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error("DB error on recent activity:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(rows || []);
  });
});




app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
