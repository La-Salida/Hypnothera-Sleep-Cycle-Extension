# Sleep Window

Free sleep-cycle calculator Chrome extension (Manifest V3) by [Hypnothera](https://hypnothera.ai).

Popup-only tool: pick a wake time or bedtime, adjust minutes-to-fall-asleep, and see suggested 3–6 cycle windows (90 minutes each). Includes an optional local bedtime reminder and a 2-minute offline wind-down breath. All math runs on-device.

**Homepage must stay:** https://hypnothera.ai

## Load unpacked (development)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder (the one that contains `manifest.json`)
5. Click the Sleep Window icon in the toolbar to open the popup

No build step. No npm. Vanilla HTML/CSS/JS only.

## Pack for distribution

1. On `chrome://extensions`, click **Pack extension** (or use the Chrome Web Store Developer Dashboard zip upload)
2. Select this extension root (the folder containing `manifest.json`)
3. Upload the zip of the root contents (not a parent folder) to the Chrome Web Store

Suggested zip contents: `manifest.json`, `popup.html`, `popup.css`, `popup.js`, `background.js`, `icons/`, plus listing docs if desired (not required at runtime).

```bash
cd /workspace/sleep-window
zip -r ../sleep-window.zip manifest.json popup.html popup.css popup.js background.js icons README.md STORE_LISTING.md EXTENSION_PRIVACY.md
```

## Chrome Web Store checklist

- [ ] `homepage_url` is `https://hypnothera.ai` (do not change)
- [ ] Privacy policy URL: https://hypnothera.ai/privacy
- [ ] Single purpose described clearly (sleep cycle / bedtime / wake-time calculator)
- [ ] Permissions justified (`storage`, `alarms`, `notifications`) — see `STORE_LISTING.md` and `EXTENSION_PRIVACY.md`
- [ ] No remote code, no CDNs, no analytics
- [ ] Icons 128×128 (and 16/32/48) included
- [ ] Screenshots 1280×800 (generate from UI if not present — see note below)
- [ ] Store listing copy from `STORE_LISTING.md`
- [ ] Category: Productivity (or Lifestyle)
- [ ] Confirm disclaimer: planning heuristic, not medical advice / not a medical device

## Screenshots

Store screenshots (1280×800) are in `store/`:

- `store/screenshot-1-wake.png`
- `store/screenshot-2-cycles.png`

They are marketing frames around a headless render of `popup.html`. Re-capture from a live loaded extension if you want toolbar chrome in the shot.

## Features

- Modes: “I need to wake at…” and “I’m going to sleep at…” / Sleep now
- Shows 3, 4, 5, 6 cycles; highlights 5 cycles (7.5h)
- Adjustable fall-asleep buffer (0–30 min, default 14)
- Preferences in `chrome.storage.local`
- Optional bedtime reminder (`chrome.alarms` + `notifications`), opt-in with UI explanation
- 2-minute guided breathing in the popup (visual pacer; `prefers-reduced-motion` respected; optional local Web Audio tone)
- Quiet funnel links to Hypnothera with UTM parameters

## Privacy

Zero data collection. See `EXTENSION_PRIVACY.md`.

## License

Proprietary — Hypnothera. Free to install from the Chrome Web Store when published.
