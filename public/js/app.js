// ================================================================
//   Offenso Hackers Academy — Student Feedback Platform
//   app.js
// ================================================================

// ── Matrix ratings state ──────────────────────────────────────────
const matrixRatings = {
  regularity:  "",
  punctuality: "",
  teaching:    "",
};

// ── Email validation — ONLY accepts @gmail.com addresses ──────────
// Accepts:  name@gmail.com  john.doe123@gmail.com
// Rejects:  ems  ema@  em@gmail  name@yahoo.com  name@outlook.com  test@test.com
function isValidEmail(email) {
  const trimmed = email.trim().toLowerCase();

  // Must match: something@gmail.com exactly
  const regex = /^[a-zA-Z0-9._%+\-]+@gmail\.com$/;
  if (!regex.test(trimmed)) return false;

  // Must have at least 1 character before @
  const local = trimmed.split("@")[0];
  if (!local || local.length < 1) return false;

  return true;
}

// ── Show inline error under email field ───────────────────────────
function showEmailError(msg) {
  let err = document.getElementById("emailError");
  if (!err) {
    err = document.createElement("div");
    err.id = "emailError";
    err.style.cssText = "color:#ef4444;font-size:12px;margin-top:6px;font-family:'Inter',sans-serif;";
    document.getElementById("emailInput").parentNode.appendChild(err);
  }
  err.textContent = msg;
}

function clearEmailError() {
  const err = document.getElementById("emailError");
  if (err) err.textContent = "";
}

// ── Matrix rating init ────────────────────────────────────────────
function initMatrix() {
  document.querySelectorAll(".m-radio").forEach(el => {
    el.addEventListener("click", () => {
      const row = el.dataset.row;
      const val = el.dataset.val;
      matrixRatings[row] = val;
      document.querySelectorAll(`.m-radio[data-row="${row}"]`).forEach(r => r.classList.remove("checked"));
      el.classList.add("checked");
      const inputMap = { regularity: "ratingRegularity", punctuality: "ratingPunctuality", teaching: "ratingTeaching" };
      const inp = document.getElementById(inputMap[row]);
      if (inp) inp.value = val;
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
    const res      = await fetch("/api/trainers");
    const trainers = await res.json();
    const sel      = document.getElementById("trainerSelect");
    trainers.forEach(name => {
      const opt       = document.createElement("option");
      opt.value       = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.error("Could not load trainers:", e);
  }
}

// ── Submit ────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();
  clearEmailError();

  const name            = document.getElementById("studentName").value.trim();
  const email           = document.getElementById("emailInput").value.trim();
  const course          = document.getElementById("courseSelect").value;
  const batchDate       = document.getElementById("batchDate").value;
  const trainer         = document.getElementById("trainerSelect").value;
  const modeEl          = document.querySelector("input[name='mode']:checked");
  const mode            = modeEl ? modeEl.value : "";
  const trainerThoughts = document.getElementById("trainerThoughts").value.trim();
  const challenges      = document.getElementById("challengesText").value.trim();
  const nonTech         = document.getElementById("nonTechFeedback").value.trim();
  const additional      = document.getElementById("additionalSupport").value.trim();
  const suggestions     = document.getElementById("suggestions").value.trim();

  if (!name || !email || !course || !batchDate || !trainer || !mode) {
    toast("Please fill in all required fields.", "err");
    return;
  }

  // ── STRICT GMAIL-ONLY VALIDATION ─────────────────────────────
  if (!isValidEmail(email)) {
    showEmailError("⚠ Only Gmail addresses are accepted (e.g. name@gmail.com)");
    document.getElementById("emailInput").focus();
    document.getElementById("emailInput").style.borderColor = "#ef4444";
    return;
  }

  if (!matrixRatings.regularity || !matrixRatings.punctuality || !matrixRatings.teaching) {
    toast("Please rate all criteria in the rating table.", "err");
    return;
  }

  if (!trainerThoughts || !challenges || !nonTech || !suggestions) {
    toast("Please answer all required feedback questions.", "err");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled    = true;
  btn.textContent = "Submitting…";

  try {
    const res  = await fetch("/api/feedback", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, course, batchDate, trainer, mode,
        ratings: matrixRatings,
        trainerThoughts, challenges, nonTech,
        additionalSupport: additional, suggestions,
      }),
    });
    const data = await res.json();
    if (data.success) showSuccess();
    else toast("Submission failed. Please try again.", "err");
  } catch (err) {
    toast("Network error. Please try again.", "err");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Submit Feedback →";
  }
}

// ── Live email validation on blur ─────────────────────────────────
function initEmailValidation() {
  const input = document.getElementById("emailInput");
  if (!input) return;

  input.addEventListener("blur", () => {
    const val = input.value.trim();
    if (val && !isValidEmail(val)) {
      showEmailError("⚠ Only Gmail addresses are accepted (e.g. name@gmail.com)");
      input.style.borderColor = "#ef4444";
    } else {
      clearEmailError();
      input.style.borderColor = "";
    }
  });

  input.addEventListener("input", () => {
    clearEmailError();
    input.style.borderColor = "";
  });
}

// ── UI Helpers ────────────────────────────────────────────────────
function showSuccess() {
  document.getElementById("formWrap").style.display    = "none";
  document.getElementById("successWrap").style.display = "flex";
}

function toast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3800);
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTrainers();
  initMatrix();
  initModeRadios();
  initEmailValidation();
  document.getElementById("feedbackForm").addEventListener("submit", handleSubmit);
});