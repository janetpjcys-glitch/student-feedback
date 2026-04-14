// ================================================================
//   Offenso Hackers Academy — Student Feedback platform
//   app.js
// ================================================================

const CONFIG = {
  BASE_URL:    window.location.origin,
  ADMIN_API:   window.location.origin + "/api/admin/feedbacks",
  SECRET_KEY:  "OFFENSO_MASTER_KEY",
  ADMIN_TOKEN: "MASTER_ACCESS_OHA_2026",
  JWT_SECRET:  "oha_jwt_s3cr3t_key_2026",
  DEBUG:       true,
};

// ── Matrix ratings state ──────────────────────────────────────────
const matrixRatings = {
  regularity: "",
  punctuality: "",
  teaching: "",
};

function initMatrix() {
  document.querySelectorAll(".m-radio").forEach(el => {
    el.addEventListener("click", () => {
      const row = el.dataset.row;
      const val = el.dataset.val;
      matrixRatings[row] = val;
      // Uncheck all in row, check clicked
      document.querySelectorAll(`.m-radio[data-row="${row}"]`).forEach(r => r.classList.remove("checked"));
      el.classList.add("checked");
      // Update hidden input
      const inputMap = { regularity: "ratingRegularity", punctuality: "ratingPunctuality", teaching: "ratingTeaching" };
      document.getElementById(inputMap[row]).value = val;
    });
  });
}

// ── Mode radio buttons ────────────────────────────────────────────
function initModeRadios() {
  document.querySelectorAll(".radio-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".radio-opt").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      opt.querySelector("input[type='radio']").checked = true;
    });
  });
}

// ── Load trainers ─────────────────────────────────────────────────
async function loadTrainers() {
  try {
    const res      = await fetch(`${CONFIG.BASE_URL}/api/trainers`);
    const trainers = await res.json();
    const sel      = document.getElementById("trainerSelect");
    trainers.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      sel.appendChild(opt);
    });
  } catch (e) {
    if (CONFIG.DEBUG) console.error("[OHA Debug] Trainer load failed:", e);
  }
}

// ── Submit ────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();

  const name          = document.getElementById("studentName").value.trim();
  const email         = document.getElementById("emailInput").value.trim();
  const course        = document.getElementById("courseSelect").value;
  const batchDate     = document.getElementById("batchDate").value;
  const trainer       = document.getElementById("trainerSelect").value;
  const modeEl        = document.querySelector("input[name='mode']:checked");
  const mode          = modeEl ? modeEl.value : "";
  const trainerThoughts = document.getElementById("trainerThoughts").value.trim();
  const challenges    = document.getElementById("challengesText").value.trim();
  const nonTech       = document.getElementById("nonTechFeedback").value.trim();
  const additional    = document.getElementById("additionalSupport").value.trim();
  const suggestions   = document.getElementById("suggestions").value.trim();

  // Validate required fields
  if (!name || !email || !course || !batchDate || !trainer || !mode) {
    toast("Please fill in all required fields.", "err"); return;
  }
  if (!matrixRatings.regularity || !matrixRatings.punctuality || !matrixRatings.teaching) {
    toast("Please rate all criteria in the rating table.", "err"); return;
  }
  if (!trainerThoughts || !challenges || !nonTech || !suggestions) {
    toast("Please answer all required feedback questions.", "err"); return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true; btn.textContent = "Submitting…";

  try {
    const res = await fetch(`${CONFIG.BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, course, batchDate, trainer, mode,
        ratings: matrixRatings,
        trainerThoughts, challenges, nonTech,
        additionalSupport: additional,
        suggestions,
      }),
    });
    const data = await res.json();
    if (data.success) showSuccess();
    else toast("Submission failed. Please try again.", "err");
  } catch (err) {
    if (CONFIG.DEBUG) console.error("[OHA Debug]", err);
    toast("Network error. Please try again.", "err");
  } finally {
    btn.disabled = false; btn.textContent = "Submit Feedback →";
  }
}

// ── UI Helpers ────────────────────────────────────────────────────
function showSuccess() {
  document.getElementById("formWrap").style.display   = "none";
  document.getElementById("successWrap").style.display = "flex";
}

function toast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3800);
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTrainers();
  initMatrix();
  initModeRadios();
  document.getElementById("feedbackForm").addEventListener("submit", handleSubmit);

  if (CONFIG.DEBUG) {
    console.log("%c[OHA] Debug mode active", "color:#22c55e;font-weight:bold;font-size:13px");
    console.log("%c[OHA] Loaded config:", "color:#94a3b8", CONFIG);
  }
});
