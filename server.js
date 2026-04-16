// ================================================================
//   Offenso Hackers Academy — Student Feedback Platform
//   server.js
//   ⚠️  INTENTIONALLY VULNERABLE — SECURITY TRAINING USE ONLY
// ================================================================

const express = require("express");
const path    = require("path");
const fs      = require("fs");
const app     = express();
const PORT    = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

function saveToFile() {
  try {
    const raw  = fs.readFileSync(DATA_FILE, "utf8");
    const json = JSON.parse(raw);
    json.feedbacks = feedbackDB;
    fs.writeFileSync(DATA_FILE, JSON.stringify(json, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️  Failed to save to data.json:", err.message);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ── In-memory feedback store ──────────────────────────────────────
const feedbackDB = [
  {
    id: 1,
    name: "Arjun Nair",
    email: "arjun.nair@gmail.com",
    course: "OCSP",
    batchDate: "2026-04-10",
    trainer: "AJITH V",
    mode: "Offline",
    ratings: { regularity: "Excellent", punctuality: "Good", teaching: "Excellent" },
    trainerThoughts: "The SQL injection lab was incredibly well structured.",
    challenges: "None so far, everything was well explained.",
    nonTech: "Support staff were very helpful and responsive.",
    additionalSupport: "More hands-on labs would be great.",
    suggestions: "Keep the current pace, it works perfectly.",
    submitted_at: "2026-04-10T09:15:00Z",
  },
  {
    id: 2,
    name: "Priya Thomas",
    email: "priya.thomas@outlook.com",
    course: "ADIS",
    batchDate: "2026-04-10",
    trainer: "JANET PJ",
    mode: "Online",
    ratings: { regularity: "Good", punctuality: "Good", teaching: "Satisfactory" },
    trainerThoughts: "Network scanning session was eye-opening.",
    challenges: "Internet connectivity sometimes caused issues during live demos.",
    nonTech: "Doubt-clearing sessions were very helpful.",
    additionalSupport: "Recording of sessions would help a lot.",
    suggestions: "Provide session recordings for review.",
    submitted_at: "2026-04-10T11:30:00Z",
  },
];

// ── Public: trainer list ──────────────────────────────────────────
app.get("/api/trainers", (req, res) => {
  res.json([
    "AJITH V",
    "ASHISH THOMAS JOSEPH",
    "SOORAJ K",
    "SREEDEVI S NAIR",
    "FATHIMA THAZNEEM",
    "JANET PJ",
    "ALTHAF SHAJAHAN",
    "ANWAR SWADIQUE",
    "MUHAMMED RISWAN S",
    "ALBIN JOSHY",
  ]);
});

// ── Public: submit feedback ───────────────────────────────────────
app.post("/api/feedback", (req, res) => {
  const {
    name, email, course, batchDate, trainer, mode,
    ratings, trainerThoughts, challenges, nonTech,
    additionalSupport, suggestions,
  } = req.body;

  if (!name || !email || !course || !batchDate || !trainer || !mode ||
      !trainerThoughts || !challenges || !nonTech || !suggestions) {
    return res.status(400).json({ success: false, message: "All required fields must be filled." });
  }

  const newEntry = {
    id: feedbackDB.length + 1,
    name, email, course, batchDate, trainer, mode,
    ratings: ratings || {},
    trainerThoughts, challenges, nonTech,
    additionalSupport: additionalSupport || "",
    suggestions,
    submitted_at: new Date().toISOString(),
  };

  feedbackDB.push(newEntry);
  saveToFile();

  console.log(`✅  New feedback saved — ID ${newEntry.id} by ${newEntry.name}`);
  res.json({ success: true, message: "Feedback submitted. Thank you!" });
});

// ════════════════════════════════════════════════════════════════
//  🔴 VULNERABILITY 2 — Exposed .env file
//     Served directly — simulates misconfigured web server.
//     Discovery: type /.env in the browser address bar
// ════════════════════════════════════════════════════════════════
app.get("/.env", (req, res) => {
  res.type("text/plain").send(
`# Offenso Hackers Academy — Environment Config
# !! PRODUCTION SECRETS — DO NOT COMMIT TO GIT !!

APP_NAME=OHA Feedback Platform
APP_ENV=production
APP_PORT=3000

DB_HOST=db.offensohackersacademy.com
DB_PORT=5432
DB_NAME=oha_prod
DB_USER=oha_db_admin
DB_PASSWORD=db$ecret_OHA99

JWT_SECRET=oha_jwt_s3cr3t_key_2026
API_KEY=OFFENSO_MASTER_KEY
ADMIN_TOKEN=MASTER_ACCESS_OHA_2026

SMTP_HOST=smtp.offensohackersacademy.com
SMTP_USER=noreply@offensohackersacademy.com
SMTP_PASS=smtp_0HA_p@ss2026

DEBUG_MODE=true
BYPASS_AUTH=true
`
  );
});

// ════════════════════════════════════════════════════════════════
//  🔴 VULNERABILITY 3 — Broken Access Control via HTTP Header
//
//  What it is:
//    The /api/reports endpoint checks access using a custom
//    HTTP header "x-user-role" instead of a real auth token.
//    An attacker can simply set the header to "admin" and get
//    all data — no password needed.
//
//  Why it's realistic:
//    Developers sometimes use request headers for role checks
//    during testing and forget to replace them with real auth.
//    This is a classic Broken Access Control (OWASP Top 10 #1).
//
//  Discovery path:
//    Step 1 → Open DevTools (F12) → Network tab
//    Step 2 → Look at any API response headers
//             You will see:  x-user-role: guest
//    Step 3 → That "guest" hint tells you roles exist
//    Step 4 → Try sending the request WITH the header:
//             x-user-role: admin
//    Step 5 → Get all feedback data — full access!
//
//  How to exploit (3 methods):
//
//  Method 1 — Browser Console (easiest):
//    fetch("/api/reports", {
//      headers: { "x-user-role": "admin" }
//    }).then(r => r.json()).then(d => console.log(d))
//
//  Method 2 — Burp Suite:
//    Intercept GET /api/reports
//    Add header:  x-user-role: admin
//    Forward → get all data
//
//  Method 3 — curl (terminal):
//    curl -H "x-user-role: admin" https://your-site.com/api/reports
// ════════════════════════════════════════════════════════════════
app.get("/api/reports", (req, res) => {

  const role = req.headers["x-user-role"];

  // 🔴 VULNERABLE: trusting a client-supplied header for access control
  if (role !== "admin") {
    // Hint in response header — students spot this in Network tab
    res.set("x-user-role", "guest");
    res.set("x-hint", "Access control is header-based");
    return res.status(403).json({
      message: "Access denied: admin role required",
    });
  }

  // Admin gets everything
  res.set("x-user-role", "admin");
  res.json({
    _note:        "Internal report — restricted access",
    generated_at: new Date().toISOString(),
    total:        feedbackDB.length,
    reports:      feedbackDB,
  });
});

// ── Catch-all: SPA fallback ───────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🚀  Offenso Hackers Academy — Feedback Platform`);
  console.log(`    Running on port ${PORT}`);
  console.log(`    ⚠️   Intentionally vulnerable — training use only.\n`);
});