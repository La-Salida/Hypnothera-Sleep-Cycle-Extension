/**
 * Sleep Window — popup UI & local sleep-cycle math
 * All calculation is client-side. No network except user-clicked links.
 */

(function () {
  "use strict";

  const CYCLE_MIN = 90;
  const CYCLES = [3, 4, 5, 6];
  const RECOMMENDED = 5;
  const DEFAULTS = {
    preferredWakeTime: "07:00",
    fallAsleepMinutes: 14,
    lastMode: "wake",
    reminderEnabled: false,
    lastSleepTime: "23:00",
  };

  const UTM =
    "utm_source=chrome&utm_medium=extension&utm_campaign=sleep_window";

  /** @type {"wake"|"sleep"} */
  let mode = "wake";
  let fallAsleep = 14;

  const els = {
    modeWake: document.getElementById("mode-wake"),
    modeSleep: document.getElementById("mode-sleep"),
    wakeFields: document.getElementById("wake-fields"),
    sleepFields: document.getElementById("sleep-fields"),
    wakeTime: document.getElementById("wake-time"),
    sleepTime: document.getElementById("sleep-time"),
    sleepNow: document.getElementById("sleep-now"),
    fallAsleep: document.getElementById("fall-asleep"),
    fallValue: document.getElementById("fall-value"),
    resultsHeading: document.getElementById("results-heading"),
    cycleList: document.getElementById("cycle-list"),
    reminderEnabled: document.getElementById("reminder-enabled"),
    breatheToggle: document.getElementById("breathe-toggle"),
    breathePanel: document.getElementById("breathe-panel"),
    breatheStart: document.getElementById("breathe-start"),
    breatheStop: document.getElementById("breathe-stop"),
    breatheLine: document.getElementById("breathe-line"),
    breatheTimer: document.getElementById("breathe-timer"),
    pacer: document.getElementById("pacer"),
  };

  // --- Time helpers ---

  function parseTimeValue(value) {
    const parts = String(value || "00:00").split(":");
    const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
    const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
    return { h, m, total: h * 60 + m };
  }

  function formatTime12(totalMinutes) {
    let t = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const h24 = Math.floor(t / 60);
    const m = t % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    let h = h24 % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function nowTimeValue() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function hoursLabel(cycles) {
    const total = cycles * CYCLE_MIN;
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  // --- Calculator ---

  function computeResults() {
    const fall = Math.min(30, Math.max(0, Number(fallAsleep) || 0));
    const items = [];

    if (mode === "wake") {
      const wake = parseTimeValue(els.wakeTime.value);
      for (const c of CYCLES) {
        const bed = wake.total - c * CYCLE_MIN - fall;
        items.push({
          cycles: c,
          timeTotal: bed,
          timeLabel: formatTime12(bed),
          recommended: c === RECOMMENDED,
        });
      }
    } else {
      const sleep = parseTimeValue(els.sleepTime.value);
      for (const c of CYCLES) {
        const wake = sleep.total + fall + c * CYCLE_MIN;
        items.push({
          cycles: c,
          timeTotal: wake,
          timeLabel: formatTime12(wake),
          recommended: c === RECOMMENDED,
        });
      }
    }
    return items;
  }

  function renderResults() {
    const items = computeResults();
    els.resultsHeading.textContent =
      mode === "wake" ? "Best bedtimes" : "Best wake times";

    els.cycleList.replaceChildren();
    for (const item of items) {
      const li = document.createElement("li");
      li.className = "cycle-item" + (item.recommended ? " is-recommended" : "");

      const time = document.createElement("span");
      time.className = "cycle-time";
      time.textContent = item.timeLabel;

      const meta = document.createElement("div");
      meta.className = "cycle-meta";

      const label = document.createElement("span");
      label.className = "cycle-label";
      label.textContent = `${item.cycles} cycles`;
      if (item.recommended) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "Ideal";
        label.appendChild(badge);
      }

      const sub = document.createElement("span");
      sub.className = "cycle-sub";
      sub.textContent = hoursLabel(item.cycles) + " sleep";

      meta.append(label, sub);
      li.append(time, meta);
      els.cycleList.appendChild(li);
    }
  }

  // --- Mode / prefs ---

  function setMode(next) {
    mode = next === "sleep" ? "sleep" : "wake";
    els.modeWake.classList.toggle("is-active", mode === "wake");
    els.modeSleep.classList.toggle("is-active", mode === "sleep");
    els.modeWake.setAttribute("aria-selected", mode === "wake" ? "true" : "false");
    els.modeSleep.setAttribute("aria-selected", mode === "sleep" ? "true" : "false");
    els.wakeFields.classList.toggle("is-hidden", mode !== "wake");
    els.sleepFields.classList.toggle("is-hidden", mode !== "sleep");
    renderResults();
    persist();
  }

  function setFallAsleep(n) {
    fallAsleep = Math.min(30, Math.max(0, Math.round(Number(n) || 0)));
    els.fallAsleep.value = String(fallAsleep);
    els.fallAsleep.setAttribute("aria-valuenow", String(fallAsleep));
    els.fallValue.textContent = String(fallAsleep);
    renderResults();
  }

  async function persist() {
    const payload = {
      preferredWakeTime: els.wakeTime.value || DEFAULTS.preferredWakeTime,
      fallAsleepMinutes: fallAsleep,
      lastMode: mode,
      reminderEnabled: !!els.reminderEnabled.checked,
      lastSleepTime: els.sleepTime.value || DEFAULTS.lastSleepTime,
    };
    try {
      await chrome.storage.local.set(payload);
    } catch (_) {
      /* storage may be unavailable in plain file preview */
    }
    if (payload.reminderEnabled) {
      try {
        await chrome.runtime.sendMessage({
          type: "scheduleReminder",
          minutesBeforeBed: 30,
        });
      } catch (_) {}
    }
  }

  async function loadPrefs() {
    let data = { ...DEFAULTS };
    try {
      data = await chrome.storage.local.get(DEFAULTS);
    } catch (_) {}
    els.wakeTime.value = data.preferredWakeTime || DEFAULTS.preferredWakeTime;
    els.sleepTime.value = data.lastSleepTime || DEFAULTS.lastSleepTime;
    setFallAsleep(data.fallAsleepMinutes ?? DEFAULTS.fallAsleepMinutes);
    els.reminderEnabled.checked = !!data.reminderEnabled;
    setMode(data.lastMode || DEFAULTS.lastMode);
  }

  // --- Reminder ---

  async function onReminderToggle() {
    const enabled = !!els.reminderEnabled.checked;
    try {
      await chrome.storage.local.set({ reminderEnabled: enabled });
    } catch (_) {}

    if (enabled) {
      try {
        const res = await chrome.runtime.sendMessage({
          type: "scheduleReminder",
          minutesBeforeBed: 30,
        });
        if (!res?.ok) {
          console.warn("Reminder schedule failed", res?.error);
        }
      } catch (e) {
        console.warn("Reminder message failed", e);
      }
    } else {
      try {
        await chrome.runtime.sendMessage({ type: "clearReminder" });
      } catch (_) {}
    }
  }

  // --- Wind-down breathing (2 minutes, offline) ---

  const BREATHE_TOTAL_MS = 2 * 60 * 1000;
  const PHASE_MS = 8000; // inhale ~3.2s, hold ~1.2s, exhale ~3.6s (matches CSS keyframes)
  const LINES = [
    "Settle. Soften the jaw.",
    "Inhale gently through the nose.",
    "Hold softly — no strain.",
    "Exhale longer than you inhale.",
    "Let the shoulders drop.",
    "Nothing to fix. Only notice.",
    "Quiet weight in the limbs.",
    "Return to the room when ready.",
  ];

  let breatheTimerId = null;
  let breatheTickId = null;
  let breatheStartedAt = 0;
  let audioCtx = null;
  let reducedMotion = false;

  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {}

  function playSoftTone() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, audioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (_) {
      /* Web Audio optional */
    }
  }

  function updateBreatheUI(elapsed) {
    const remaining = Math.max(0, BREATHE_TOTAL_MS - elapsed);
    const sec = Math.ceil(remaining / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    els.breatheTimer.textContent = `${m}:${String(s).padStart(2, "0")}`;

    const phaseIndex = Math.floor(elapsed / PHASE_MS) % LINES.length;
    // Within phase: pick inhale / hold / exhale line flavor
    const phasePos = (elapsed % PHASE_MS) / PHASE_MS;
    let line = LINES[phaseIndex];
    if (!reducedMotion) {
      if (phasePos < 0.4) line = "Inhale gently through the nose.";
      else if (phasePos < 0.55) line = "Hold softly — no strain.";
      else line = LINES[Math.min(LINES.length - 1, 3 + (phaseIndex % 4))];
    }
    els.breatheLine.textContent = line;
  }

  function stopBreathing() {
    if (breatheTimerId) {
      clearTimeout(breatheTimerId);
      breatheTimerId = null;
    }
    if (breatheTickId) {
      clearInterval(breatheTickId);
      breatheTickId = null;
    }
    els.pacer.classList.remove("is-running");
    els.breatheStart.disabled = false;
    els.breatheStop.disabled = true;
    els.breatheTimer.textContent = "2:00";
    els.breatheLine.textContent = "Settle. Soften the jaw.";
  }

  function startBreathing() {
    stopBreathing();
    breatheStartedAt = Date.now();
    els.breatheStart.disabled = true;
    els.breatheStop.disabled = false;
    if (!reducedMotion) els.pacer.classList.add("is-running");
    playSoftTone();
    updateBreatheUI(0);

    breatheTickId = setInterval(() => {
      const elapsed = Date.now() - breatheStartedAt;
      updateBreatheUI(elapsed);
      if (elapsed >= BREATHE_TOTAL_MS) {
        stopBreathing();
        els.breatheLine.textContent = "Done. Carry the quiet with you.";
        els.breatheTimer.textContent = "0:00";
      }
    }, 200);

    breatheTimerId = setTimeout(() => {
      stopBreathing();
      els.breatheLine.textContent = "Done. Carry the quiet with you.";
      els.breatheTimer.textContent = "0:00";
    }, BREATHE_TOTAL_MS);
  }

  function toggleBreathePanel() {
    const open = els.breathePanel.hasAttribute("hidden");
    if (open) {
      els.breathePanel.removeAttribute("hidden");
      els.breathePanel.classList.remove("is-collapsed");
      els.breatheToggle.setAttribute("aria-expanded", "true");
      els.breatheToggle.textContent = "Hide";
    } else {
      stopBreathing();
      els.breathePanel.setAttribute("hidden", "");
      els.breathePanel.classList.add("is-collapsed");
      els.breatheToggle.setAttribute("aria-expanded", "false");
      els.breatheToggle.textContent = "Begin";
    }
  }

  // --- Events ---

  els.modeWake.addEventListener("click", () => setMode("wake"));
  els.modeSleep.addEventListener("click", () => setMode("sleep"));

  els.wakeTime.addEventListener("input", () => {
    renderResults();
    persist();
  });
  els.wakeTime.addEventListener("change", () => {
    renderResults();
    persist();
  });

  els.sleepTime.addEventListener("input", () => {
    renderResults();
    persist();
  });
  els.sleepTime.addEventListener("change", () => {
    renderResults();
    persist();
  });

  els.sleepNow.addEventListener("click", () => {
    els.sleepTime.value = nowTimeValue();
    renderResults();
    persist();
  });

  els.fallAsleep.addEventListener("input", () => {
    setFallAsleep(els.fallAsleep.value);
  });
  els.fallAsleep.addEventListener("change", () => {
    setFallAsleep(els.fallAsleep.value);
    persist();
  });

  els.reminderEnabled.addEventListener("change", onReminderToggle);

  els.breatheToggle.addEventListener("click", toggleBreathePanel);
  els.breatheStart.addEventListener("click", startBreathing);
  els.breatheStop.addEventListener("click", stopBreathing);

  // Keyboard: left/right on mode tabs
  document.querySelector(".modes")?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setMode(mode === "wake" ? "sleep" : "wake");
      (mode === "wake" ? els.modeWake : els.modeSleep).focus();
    }
  });

  // Ensure outbound links keep UTM (already in HTML; belt-and-suspenders)
  document.querySelectorAll('a[href*="hypnothera.ai"]').forEach((a) => {
    try {
      const u = new URL(a.href);
      if (!u.searchParams.get("utm_source")) {
        u.search = UTM;
        a.href = u.toString();
      }
    } catch (_) {}
  });

  loadPrefs().then(() => renderResults());
})();
