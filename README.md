# Sleep Window — Sleep Cycle Calculator

**Sleep Window** is a free, open-source Chrome extension that calculates bedtime and wake-up times from 90-minute sleep cycles. It runs entirely in the browser popup: no account, no analytics, no data leaving your device.

Made by [Hypnothera](https://hypnothera.ai), an AI hypnosis app for personalized sleep and focus sessions.

Chrome Web Store listing is pending review. Homepage: [hypnothera.ai](https://hypnothera.ai).

## What it does

- **Wake mode** — enter the time you need to wake up; see suggested bedtimes for 3, 4, 5, and 6 cycles
- **Sleep mode** — enter bedtime, or tap Sleep now, to see suggested wake times
- **5-cycle highlight** — 7.5 hours is marked as the usual pick
- **Fall-asleep buffer** — 0–30 minutes (default 14) so the math includes time to drift off
- **Optional bedtime reminder** — a local Chrome notification, opt-in only
- **2-minute wind-down** — offline breathing pacer in the popup

## How 90-minute sleep cycles work

Adult sleep is often described as repeating **cycles** of lighter sleep, deeper sleep, and REM. A commonly used planning figure is **about 90 minutes per cycle**. The idea behind a sleep cycle calculator is simple:

1. Decide when you need to wake (or when you will go to bed).
2. Count backward (or forward) in 90-minute blocks.
3. Add a few minutes to fall asleep.
4. Aim to wake near the end of a cycle, when many people feel less groggy than if they are pulled out of deeper sleep.

Sleep Window shows four windows:

| Cycles | Time asleep |
| ------ | ----------- |
| 3 | 4 hours 30 minutes |
| 4 | 6 hours |
| 5 | 7 hours 30 minutes (highlighted) |
| 6 | 9 hours |

This is a **planning heuristic**, not a measurement of your sleep. Cycle length varies by person and by night. Sleep Window does not read a wearable, does not diagnose insomnia, and is not a medical device.

## How the math works

All calculation is local JavaScript in `popup.js`.

- Cycle length = 90 minutes
- Wake mode bedtime = wake time − (cycles × 90) − fall-asleep minutes
- Sleep mode wake time = bedtime + fall-asleep minutes + (cycles × 90)
- Times wrap across midnight

Preferences (wake time, fall-asleep minutes, last mode, reminder on/off) stay in `chrome.storage.local`. The optional reminder uses `chrome.alarms` and `chrome.notifications` on this device only.

## Install

### From source (load unpacked)

1. Clone this repo
2. Open Chrome → `chrome://extensions`
3. Turn on **Developer mode**
4. **Load unpacked** → select this folder (the one with `manifest.json`)

No build step. No npm. Manifest V3, vanilla HTML/CSS/JS.

### Chrome Web Store

The listing is submitted and pending review. When it is live, this README will point at the Store URL. The Store homepage is [hypnothera.ai](https://hypnothera.ai).

## Privacy

Sleep Window collects **zero** user data. No accounts, no telemetry, no remote scripts, no CDNs. Details: [`EXTENSION_PRIVACY.md`](EXTENSION_PRIVACY.md) and [hypnothera.ai/privacy](https://hypnothera.ai/privacy).

## Want a session written for tonight?

If a calculated bedtime is not enough, [Hypnothera](https://hypnothera.ai/sleep-hypnosis-generator) can generate a personalized sleep hypnosis session from what is actually keeping you up. The extension links there; the calculator works fine without it.

## FAQ

**Is this medical advice?**  
No. It is a convenience calculator for education and planning.

**Why 14 minutes to fall asleep?**  
It is a default buffer you can change (0–30). It is not a claim about how long you take to fall asleep.

**Does it work offline?**  
Yes. The calculator and wind-down do not need a network. Links you choose to open (Hypnothera) are normal browser navigations.

**Can I reuse this?**  
Yes, under the MIT License. Keep the copyright notice.

## License

[MIT](LICENSE) © 2026 Hypnothera / La Salida
