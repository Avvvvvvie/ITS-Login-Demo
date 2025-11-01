const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "users.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database connection failed:", err.message);
  else console.log("Connected to SQLite database:", dbPath);
});

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS googleusers (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
