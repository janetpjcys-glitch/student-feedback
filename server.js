

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


const feedbackDB = (() => {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const json = JSON.parse(raw);
    if (Array.isArray(json.feedbacks) && json.feedbacks.length > 0) {
      console.log("loaded " + json.feedbacks.length + " feedbacks");
      return json.feedbacks;
    }
  } catch (err) {
    console.error("failed to load data.json:", err.message);
  }
  return [];
})();


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
    "GOURISHANKAR",
    "ALBIN JOSHY",
  ]);
});


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

app.get("/api/reports", (req, res) => {

  const role = req.headers["x-user-role"];


  if (role !== "admin") {
  
    res.set("x-user-role", "guest");
    res.set("x-hint", "Access control is header-based");
    return res.status(403).json({
      message: "Access denied: admin role required",
    });
  }

  
  res.set("x-user-role", "admin");
  res.json({
    _note:        "Internal report — restricted access",
    generated_at: new Date().toISOString(),
    total:        feedbackDB.length,
    reports:      feedbackDB,
  });
});


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Offenso Hackers Academy — Feedback Platform`);
  console.log(`    Running on port ${PORT}`);
});