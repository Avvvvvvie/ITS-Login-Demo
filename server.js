const dotenv = require('dotenv')
dotenv.config();
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret'
const PEPPER = process.env.PEPPER || ''

const express = require("express")
const session = require("express-session")
const helmet = require('helmet')
const bcrypt = require("bcrypt")
const path = require("path")
const db = require("./database")
const crypto = require('crypto')

const app = express()
const PORT = 8000

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" })) // For form submissions
app.use(
  session({
    secret: "super-secret-key", // change this in production
    resave: false,
    saveUninitialized: false,
  })
)
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

const sites = ['translate.googleapis.com', 'https://accounts.google.com', 'https://apis.google.com', 'https://www.gstatic.com']

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
  /*referrerPolicy: {policy: "referrer-when-downgrade"}*/
}))
app.use((req, res, next) => {
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'", ...sites],
      scriptSrc: [
        "'self'",
        `'nonce-${res.locals.nonce}'`,
        ...sites
      ],
      frameSrc: ["'self'", ...sites],
      connectSrc: [
        "'self'",
        ...sites
      ],
      imgSrc: ["'self'", "https://lh3.googleusercontent.com", "data:", ...sites],
    },
  })(req, res, next);
})

// Middleware to check login
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect("/")
  next()
}

app.get("/", (req, res) => {
  res.render("index", { nonce: res.locals.nonce }, function (err, html) {
    if (err) {
      res.status(500).send()
    }
    else {
      res.send(html);
    }
  })
})

app.post("/register", async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: "Content-Type must be application/json" })
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid or empty JSON body" })
    }

    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing username, email, or password" })
    }

    /*if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: "Username or password too short" })
    }*/

    // Check if username already exists
   db.get(
    "SELECT username, email FROM users WHERE username = ? OR email = ?",
    [username, email],
    async (err, user) => {
      if (err) return res.status(500).json({ error: "Database lookup failed" })
      if (user) {
        if (user.username === username)
          return res.status(409).json({ error: "Username already exists" })
        if (user.email === email)
          return res.status(409).json({ error: "Email already registered" })
      }

      // if user does not exist already the new user can be added
      const password_hash = await bcrypt.hash(password, 10)
      db.run(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, password_hash],
        function (err) {
          if (err) {
            console.error("Database insert error:", err)
            return res.status(500).json({ error: "Database insert failed" })
          }

          req.session.userId = this.lastID
          return res.status(201).json({
            success: true,
            redirect: req.get('host') + '/profile',
            message: "User registered successfully",
          })
        }
      )
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ error: "Unexpected server error" })
  }
})

app.post("/googlelogin", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" })
  }

  const {client_id, credential} = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "Missing required fields" })
  }
})

app.post("/login", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" })
  }

  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.status(400).json({ error: "Invalid username or password"})

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(400).json({ error: "Invalid username or password"})

    req.session.userId = user.id
    return res.status(201).json({
      success: true,
      redirect: req.get('host') + '/profile',
      message: "Logged in successfully"
    })
  })
})

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    return res.status(201).json({
      success: true,
      redirect: req.get('host'),
      message: "Logged out successfully"
    })
  })
})

app.get("/profiledata", requireLogin, (req, res) => {
  db.get("SELECT username, email, created_at FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" })
    res.json(user)
  })
})

app.post('/profiledata', requireLogin, (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" })
  }

  const { username, email } = req.body
  if (!username || !email) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  db.get("UPDATE users SET username = ?, email = ?  WHERE id = ?", [username, email, req.session.userId], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" })
    return res.status(201).json({
        success: true,
        message: "Updated user data successfully"
      })
  })
})

// Serve profile page (protected)
app.get("/profile", requireLogin, (req, res) => {
  res.render("profile", { nonce: res.locals.nonce }, function (err, html) {
    if (err) {
      res.status(500).send()
    }
    else {
      res.send(html);
    }
  });
})

app.use(express.static(path.join(__dirname, "public")))

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`))
