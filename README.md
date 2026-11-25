# AWAAZ SOS

**Voice-first, hands-free emergency safety Progressive Web App (PWA) for women in India.**

In an emergency, you may not be able to unlock your phone, open an app, or type a message. **AWAAZ SOS** listens continuously in Indian English & Hinglish (`en-IN`) so a single spoken wake phrase triggers your entire emergency response automatically.

---

## Key Features

- **Hands-Free Voice Activation (`en-IN`):** Continuously listens via the Web Speech API for **"Awaaz help me"** (supporting Indian English & Hinglish pronunciations while ignoring partial matches).
- **5-Second Safety Countdown:** Immediately flashes a fullscreen pulsing red **SOS ACTIVE** alert, speaks `"AWAAZ SOS activated. Stay calm. Sending alert in 5 seconds."`, and shows a large **CANCEL SOS** button to prevent accidental triggers.
- **Simultaneous Emergency Actions:** After 5 seconds (if not cancelled):
  1. **Live GPS Location:** Captures coordinates via the browser Geolocation API (with an 8-second timeout and `"Location unavailable."` fallback).
  2. **Audio Evidence Recording:** Records surrounding audio via `MediaRecorder` and saves a timestamped `.webm` file (`awaaz-sos-<timestamp>.webm`) automatically when deactivated.
  3. **Instant WhatsApp Alerts:** Opens WhatsApp (`wa.me`) sequentially for up to 3 trusted `+91` contacts with a pre-filled emergency message and Google Maps location link, plus on-screen one-tap `tel:` Call fallback buttons.
- **Voice Deactivation:** Say **"Awaaz I'm safe"** (or tap **CANCEL SOS**) to stop recording, save the audio file, speak confirmation, and return to listening mode.
- **Test SOS Mode:** Safely demonstrates the full activation countdown, TTS, GPS, and audio recording flow without opening WhatsApp or sending real alerts.
- **Zero Setup & Offline Ready:** Trusted contacts are stored locally in `localStorage`—no Twilio, no backend server, and no API keys required. Installable directly from Chrome on Android as a standalone fullscreen PWA via `manifest.json` and `sw.js`.

---

## Project Structure

```text
awaaz-sos/
├── index.html          # App shell, setup/idle/SOS views, and service worker registration
├── styles.css          # Dark mobile-first UI, pulsing animations, and SOS overlay
├── app.js              # Voice recognition, TTS, countdown, GPS, MediaRecorder, and WhatsApp dispatch
├── manifest.json       # PWA manifest (standalone, portrait, #ff2d55 theme, #0a0a0f background)
├── sw.js               # Service worker for offline caching
├── README.md           # Documentation
└── icons/
    ├── icon-192.png    # 192x192 app icon
    ├── icon-512.png    # 512x512 app icon
    └── icon.svg        # Vector shield icon
```

---

## Quick Start

1. **Host over HTTPS** (required by Android Chrome for PWA install, microphone, and GPS—e.g. **GitHub Pages** or **Netlify**).
2. Open the site in **Google Chrome on Android** and tap **Install App** on the prompt to add **AWAAZ SOS** to your home screen.
3. Add **1 to 3 trusted contacts** in `+91` format and grant **Microphone** & **Location** permissions.
4. Keep the app open in listening mode—say **"Awaaz help me"** to trigger SOS, or use **Test SOS** to demo safely.

---

## Tech Stack

- **HTML5, CSS3, Vanilla JavaScript** (zero frameworks or external dependencies)
- **Web Speech API** (`SpeechRecognition` `en-IN` + `speechSynthesis`)
- **Geolocation API** (`navigator.geolocation`)
- **MediaRecorder API** (`.webm` audio capture)
- **WhatsApp URL Scheme** (`https://wa.me/...`)
- **PWA** (`manifest.json` + `sw.js` Service Worker + `localStorage`)

---

## Privacy

All trusted contacts are saved locally in your browser's `localStorage`, and emergency audio recordings are saved directly to your device. No personal data is transmitted to or stored on any external server.
