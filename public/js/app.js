// ================================================================
//   Offenso Hackers Academy — Student Feedback Platform
//   app.js
// ================================================================


const ADMIN_API = "/api/reports";


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


function isValidEmail(email) {
  const trimmed = email.trim();

  // Must contain exactly one @
  if (!trimmed.includes("@")) return false;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;

  const local  = parts[0];
  const domain = parts[1];

  // Something must exist before @
  if (!local || local.length < 1) return false;

  // Domain must have a dot
  if (!domain || !domain.includes(".")) return false;

  // Must have text before the dot AND a TLD of at least 2 chars after
  const domainParts = domain.split(".");
  const tld         = domainParts[domainParts.length - 1];
  const domainName  = domainParts.slice(0, -1).join(".");

  if (!domainName || domainName.length < 1) return false;
  if (!tld || tld.length < 2) return false;

  // Full regex — rejects anything malformed
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(trimmed)) return false;

  return true;
}

// ── Show / clear inline error under email field ───────────────────
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

// ── Live email validation (blur + input events) ───────────────────
function initEmailValidation() {
  const input = document.getElementById("emailInput");
  if (!input) return;

  // Validate when user leaves the field
  input.addEventListener("blur", () => {
    const val = input.value.trim();
    if (val && !isValidEmail(val)) {
      showEmailError("⚠ Please enter a valid email (e.g. name@gmail.com or name@offenso.com)");
      input.style.borderColor = "#ef4444";
    } else if (val && isValidEmail(val)) {
      clearEmailError();
      input.style.borderColor = "#22c55e";  // green = valid
    } else {
      clearEmailError();
      input.style.borderColor = "";
    }
  });

  // Clear error as soon as user starts typing again
  input.addEventListener("input", () => {
    clearEmailError();
    input.style.borderColor = "";
  });
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
    showEmailError("⚠ Please enter a valid email (e.g. name@gmail.com or name@offenso.com)");
    document.getElementById("emailInput").style.borderColor = "#ef4444";
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
  document.getElementById("formWrap").style.display    = "none";
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
  initEmailValidation();   // ← this was missing in your version
  document.getElementById("feedbackForm")
    .addEventListener("submit", handleSubmit);
});