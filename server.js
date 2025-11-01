const dotenv = require('dotenv')
dotenv.config();
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret'
const PEPPER = process.env.PEPPER || ''
const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID || ''

const express = require("express")
const session = require("express-session")
const helmet = require('helmet')
const bcrypt = require("bcrypt")
const path = require("path")
const db = require("./database")
const crypto = require('crypto')
const {OAuth2Client} = require('google-auth-library');

const app = express()
const PORT = 8000

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" })) // For form submissions
app.use(
  session({
    secret: SESSION_SECRET,
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
  res.render("index", { nonce: res.locals.nonce }, function (error, html) {
    if (error) {
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

    // this is commented out for testing puposes
    /*if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: "Username or password too short" })
    }*/

    // Check if username already exists
   db.get(
    "SELECT username, email FROM users WHERE username = ? OR email = ?",
    [username, email],
    async (error, user) => {
      if (error) return res.status(500).json({ error: "Database lookup failed" })
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
        function (error) {
          if (error) {
            console.error("Database insert error:", error)
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
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Unexpected server error" })
  }
})

app.post("/googlelogin", (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || !req.body.googleUser) {
      return res.status(400).json({ error: "Invalid request body" })
    }

    const {client_id, credential } = req.body.googleUser
    if (!client_id || !credential) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    /* this only works if we have a public server that google can send a request to
    if (!req.cookies.g_csrf_token) {
      return res.status(400).json({ error: "No CSRF token in Cookie." })
    }

    if (!req.body.g_csrf_token) {
      return res.status(400).json({ error: "No CSRF token in post body." })
    }

    if (req.cookies.g_csrf_token != req.body.g_csrf_token) {
      return res.status(400).json({ error: "Failed to verify double submit cookie." })
    }*/


    const client = new OAuth2Client();
    const verify = async (token) => {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: WEB_CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
          // Or, if multiple clients access the backend:
          //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
      });
      const payload = ticket.getPayload();
      // This ID is unique to each Google Account, making it suitable for use as a primary key
      // during account lookup. Email is not a good choice because it can be changed by the user.
      const userid = payload['sub'];
      // If the request specified a Google Workspace domain:
      // const domain = payload['hd'];

      // TODO: Login on our side as well (save the userid)
      db.get(
      "SELECT id FROM googleusers WHERE id = ?",
      [userid],
      async (error, user) => {
        if (error) return res.status(500).json({ error: "Database lookup failed" })
        if (!user) {
          db.run(
          "INSERT INTO googleusers (id) VALUES (?)",
          [userid],
          function (error) {
            if (error) {
              console.error("Database insert error:", error)
              return res.status(500).json({ error: "Database insert failed" })
            }
            req.session.userId = userid
            req.session.isGoogleUser = true
            return res.status(201).json({
              success: true,
              redirect: req.get('host') + '/profile',
              message: "User registered successfully",
            })
          })
        } else {
          req.session.userId = userid
          req.session.isGoogleUser = true
          return res.status(201).json({
            success: true,
            redirect: req.get('host') + '/profile',
            message: "User logged in successfully",
          })
        }
      })
    }

    verify(credential)
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" })
  }
})

app.post("/login", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Invalid request body" })
  }

  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (error, user) => {
    if (!user) return res.status(400).json({ error: "Invalid email or password"})

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.status(400).json({ error: "Invalid password"})

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
  db.get("SELECT username, email, created_at FROM users WHERE id = ?", [req.session.userId], (error, user) => {
    if (error) return res.status(500).json({ error: "Database error" })
    res.json(user)
  })
})

app.post('/profiledata', requireLogin, (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid request body" })
    }

    const { username, email } = req.body
    if (!username || !email) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Check if username/email already exists for somene else
    db.get(
      "SELECT username, email FROM users WHERE (username = ? OR email = ?) AND id != ?",
      [username, email, req.session.userId],
      async (error, user) => {
        if (error) return res.status(500).json({ error: "Database lookup failed" })
        if (user) {
          if (user.username === username)
            return res.status(409).json({ error: "Username already exists" })
          if (user.email === email)
            return res.status(409).json({ error: "Email already registered" })
        }
        db.get("UPDATE users SET username = ?, email = ?  WHERE id = ?", [username, email, req.session.userId], (error, user) => {
          if (error) return res.status(500).json({ error: "Database error" })
          return res.status(201).json({
              success: true,
              message: "Updated user data successfully"
            })
        })
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ error: "Unexpected server error" })
    }
})

// Serve profile page (protected)
app.get("/profile", requireLogin, (req, res) => {
  res.render("profile", { nonce: res.locals.nonce, isGoogleUser: req.session.isGoogleUser, id: req.session.id }, function (error, html) {
    if (error) {
      res.status(500).send()
    }
    else {
      res.send(html);
    }
  });
})

app.use(express.static(path.join(__dirname, "public")))

app.listen(PORT, () => console.log(`Listening at http://localhost:${PORT}`))
