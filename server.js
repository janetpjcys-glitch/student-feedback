// ================================================================
//   Offenso Hackers Academy — Student Feedback Platform
//   server.js
//   ⚠️  INTENTIONALLY VULNERABLE — SECURITY TRAINING USE ONLY
// ================================================================

const express = require("express");
const path    = require("path");
const fs      = require("fs");                          // ← ADDED
const app     = express();
const PORT    = process.env.PORT || 3000;

// ── Path to data.json ─────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, "data.json");   // ← ADDED

// ── Helper: write feedbackDB back to data.json ────────────────────
function saveToFile() {                                 // ← ADDED
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
    trainer: "Web Exploitation Trainer",
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
    trainer: "Cyber Security Trainer",
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
    "GOWRISHANKAR"
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
  saveToFile();   // ← ADDED: saves to data.json every time feedback is submitted

  console.log(`✅  New feedback saved — ID ${newEntry.id} by ${newEntry.name}`);

  res.json({ success: true, message: "Feedback submitted. Thank you!" });
});

// ════════════════════════════════════════════════════════════════
//  🔴 VULNERABILITY 1 — Unauthenticated Admin API
// ════════════════════════════════════════════════════════════════
app.get("/api/admin/feedbacks", (req, res) => {
  res.json({
    _warning:       "INTERNAL — Do not expose this endpoint publicly.",
    admin_email:    "admin@offensohackersacademy.com",
    admin_password: "OHA@Admin2026",
    db_user:        "oha_db_admin",
    db_password:    "db$ecret_OHA99",
    internal_notes: "Temp creds active until next migration.",
    total_entries:  feedbackDB.length,
    feedbacks:      feedbackDB,
  });
});

// ════════════════════════════════════════════════════════════════
//  🔴 VULNERABILITY 2 — Exposed .env file
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
//  🔴 VULNERABILITY 4 — Exposed backup file
// ════════════════════════════════════════════════════════════════
app.get("/backup/feedback_backup.json", (req, res) => {
  res.json({
    _note:       "Auto-backup via oha-cron",
    exported_by: "admin@offensohackersacademy.com",
    records:     feedbackDB,
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