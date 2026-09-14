/**
 * Sleep Window — background service worker
 * Handles optional bedtime reminder alarms and notifications.
 * All scheduling is local; no network calls.
 */

const ALARM_NAME = "sleep-window-bedtime";

chrome.runtime.onInstalled.addListener(() => {
  rescheduleFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  rescheduleFromStorage();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (
    changes.reminderEnabled ||
    changes.preferredWakeTime ||
    changes.fallAsleepMinutes
  ) {
    rescheduleFromStorage();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const { reminderEnabled, preferredWakeTime, fallAsleepMinutes } =
    await chrome.storage.local.get({
      reminderEnabled: false,
      preferredWakeTime: "07:00",
      fallAsleepMinutes: 14,
    });

  if (!reminderEnabled) return;

  const cycles = 5;
  const fall = Number(fallAsleepMinutes) || 14;
  const wakeParts = String(preferredWakeTime || "07:00").split(":");
  const wakeH = parseInt(wakeParts[0], 10) || 7;
  const wakeM = parseInt(wakeParts[1], 10) || 0;

  const totalBack = cycles * 90 + fall;
  let bedMin = wakeH * 60 + wakeM - totalBack;
  while (bedMin < 0) bedMin += 24 * 60;
  const bh = Math.floor(bedMin / 60) % 24;
  const bm = bedMin % 60;
  const bedLabel = formatTime12(bh, bm);

  try {
    await chrome.notifications.create("sleep-window-reminder", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Sleep Window",
      message: `Wind-down time. Aim for bed around ${bedLabel} for a 5-cycle night.`,
      priority: 1,
    });
  } catch (e) {
    console.warn("Sleep Window notification failed", e);
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "scheduleReminder") {
    scheduleReminder(msg.minutesBeforeBed ?? 30)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
  if (msg?.type === "clearReminder") {
    chrome.alarms.clear(ALARM_NAME).then((cleared) => {
      sendResponse({ ok: true, cleared });
    });
    return true;
  }
  return false;
});

async function rescheduleFromStorage() {
  const { reminderEnabled } = await chrome.storage.local.get({
    reminderEnabled: false,
  });
  if (!reminderEnabled) {
    await chrome.alarms.clear(ALARM_NAME);
    return;
  }
  await scheduleReminder(30);
}

async function scheduleReminder(minutesBeforeBed) {
  const { preferredWakeTime, fallAsleepMinutes, reminderEnabled } =
    await chrome.storage.local.get({
      preferredWakeTime: "07:00",
      fallAsleepMinutes: 14,
      reminderEnabled: false,
    });

  if (!reminderEnabled) {
    await chrome.alarms.clear(ALARM_NAME);
    return;
  }

  const cycles = 5;
  const fall = Number(fallAsleepMinutes) || 14;
  const wakeParts = String(preferredWakeTime || "07:00").split(":");
  const wakeH = parseInt(wakeParts[0], 10) || 7;
  const wakeM = parseInt(wakeParts[1], 10) || 0;

  const totalBack = cycles * 90 + fall;
  let bedMin = wakeH * 60 + wakeM - totalBack;
  while (bedMin < 0) bedMin += 24 * 60;

  const before = Math.max(0, Number(minutesBeforeBed) || 30);
  let remindMin = bedMin - before;
  while (remindMin < 0) remindMin += 24 * 60;

  const now = new Date();
  const when = new Date(now);
  when.setHours(Math.floor(remindMin / 60) % 24, remindMin % 60, 0, 0);
  if (when.getTime() <= now.getTime()) {
    when.setDate(when.getDate() + 1);
  }

  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, {
    when: when.getTime(),
    periodInMinutes: 24 * 60,
  });
}

function formatTime12(h, m) {
  const ampm = h >= 12 ? "PM" : "AM";
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}
