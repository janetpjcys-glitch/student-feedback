// ================================================================
//   Offenso Hackers Academy — Student Feedback Platform
//   app.js
// ================================================================

// ════════════════════════════════════════════════════════════════
//  🔴 VULNERABILITY 3 — Information Disclosure via Client-Side JS
//
//  What it is:
//    A leftover debug fetch() call in the frontend source code
//    reveals an internal admin API endpoint (/api/reports) to
//    anyone who opens DevTools → Sources and reads this file.
//    Combined with Vulnerability 2, it tells an attacker exactly
//    which URL to target with the x-user-role: admin header.
//
//  Why it's realistic:
//    Developers leave debug code in production builds all the time.
//    Frontend JS is always readable by the client — there is no
//    such thing as "hidden" client-side code.
//
//  Discovery path:
//    Step 1 → Open DevTools (F12) → Sources tab
//    Step 2 → Open app.js
//    Step 3 → Spot the fetch("/api/reports") call near the top
//    Step 4 → Use that endpoint with x-user-role: admin header
//             to dump all feedback data (see Vulnerability 2)
//
//  How to exploit:
//    DevTools Console:
//      fetch("/api/reports", {
//        headers: { "x-user-role": "admin" }
//      }).then(r => r.json()).then(d => console.log(d))
// ════════════════════════════════════════════════════════════════

// TODO: remove before production — exposes internal admin endpoint
const ADMIN_API = "/api/reports";

// DEBUG: checking admin API response (left in by mistake — visible to all users)
fetch(ADMIN_API)
  .then(res => res.json())
  .then(data => console.log("ADMIN DATA:", data))
  .catch(() => {});

// ── Matrix ratings state ──────────────────────────────────────────
const matrixRatings = {
  regularity:  "",
  punctuality: "",
  teaching:    "",
};

// ── Email validation — accepts any valid email format ─────────────
//    NOTE: Server-side (/api/feedback) does NOT restrict to Gmail.
//    This client-side check mirrors that — all valid emails pass.
function isValidEmail(email) {
  const trimmed = email.trim();

  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(trimmed)) return false;

  const [local, domain] = trimmed.split("@");
  if (!local || local.length < 1) return false;

  if (!domain || !domain.includes(".")) return false;
  const tld = domain.split(".").pop();
  if (!tld || tld.length < 2) return false;

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

      document.querySelectorAll(`.m-radio[data-row="${row}"]`)
        .forEach(r => r.classList.remove("checked"));

      el.classList.add("checked");

      const inputMap = {
        regularity:  "ratingRegularity",
        punctuality: "ratingPunctuality",
        teaching:    "ratingTeaching",
      };

      const inp = document.getElementById(inputMap[row]);
      if (inp) inp.value = val;
    });
  });
}

// ── Mode radio buttons ────────────────────────────────────────────
function initModeRadios() {
  document.querySelectorAll(".radio-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".radio-opt")
        .forEach(o => o.classList.remove("selected"));

      opt.classList.add("selected");
      opt.querySelector("input[type='radio']").checked = true;
    });
  });
}

// ── Load trainers from public API ─────────────────────────────────
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

// ════════════════════════════════════════════════════════════════
//  💡 STUDENT HINT — How to find Vulnerability 2
//
//  After submitting feedback (or any API call), open:
//    DevTools (F12) → Network tab → click the /api/reports request
//    → Response Headers
//
//  You will see:
//    x-user-role: guest
//    x-hint: Access control is header-based
//
//  That header leaks the role name used by the server.
//  Try resending the request with:
//    x-user-role: admin
//  ... and observe what changes in the response.
// ════════════════════════════════════════════════════════════════

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

  if (!isValidEmail(email)) {
    showEmailError("⚠ Please enter a valid email address.");
    document.getElementById("emailInput").focus();
    return;
  }

  if (!matrixRatings.regularity || !matrixRatings.punctuality || !matrixRatings.teaching) {
    toast("Please rate all criteria.", "err");
    return;
  }

  if (!trainerThoughts || !challenges || !nonTech || !suggestions) {
    toast("Please answer all required questions.", "err");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled    = true;
  btn.textContent = "Submitting…";

  try {
    const res = await fetch("/api/feedback", {
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
    else toast("Submission failed.", "err");

  } catch {
    toast("Network error.", "err");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Submit Feedback →";
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
  t.className   = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTrainers();
  initMatrix();
  initModeRadios();
  document.getElementById("feedbackForm")
    .addEventListener("submit", handleSubmit);
});