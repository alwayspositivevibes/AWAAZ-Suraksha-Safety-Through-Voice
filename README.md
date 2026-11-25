<div align="center">

<img src="icons/icon-512.png" alt="AWAAZ Suraksha Shield" width="120" height="120">

# AWAAZ Suraksha
### आवाज़ सुरक्षा

**Voice-first emergency safety app for women in India.**

*One spoken phrase. Instant help. No typing. No tapping. Just your voice.*

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff2d55?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Offline First](https://img.shields.io/badge/Offline-First-0a0a0f?style=flat-square&logo=serviceworker&logoColor=white)](https://developer.chrome.com/docs/workbox)
[![No Backend](https://img.shields.io/badge/Backend-None%20Required-22c55e?style=flat-square)](https://github.com)
[![Language](https://img.shields.io/badge/Language-en--IN%20%2F%20Hinglish-f59e0b?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## The Problem

In a dangerous situation, a woman may not be able to:
- Unlock her phone
- Open an app
- Type a message
- Look at her screen

**Every second matters. Typing takes too long.**

---

## The Solution

**AWAAZ Suraksha** listens silently in the background at all times in Indian English & Hinglish. The moment it hears **"Awaaz help me"**, the entire emergency sequence fires automatically — GPS capture, audio recording, and WhatsApp alerts to trusted contacts — all without a single tap.

---

## How It Works

```
Say "Awaaz help me"
        ↓
Screen turns red — SOS ACTIVE
        ↓
Voice speaks: "AWAAZ SOS activated. Stay calm. Sending alert in 5 seconds."
        ↓
5-second countdown (tap CANCEL SOS to abort if accidental)
        ↓
Simultaneously:
  📍 Live GPS coordinates captured
  🎙️ Audio recording begins
  💬 WhatsApp opened for each trusted contact with emergency message + Maps link
        ↓
Say "Awaaz I'm safe" → Recording saved to device → SOS deactivated
```

---

## Features

| Feature | Details |
|---|---|
| 🎙️ **Wake Phrase Detection** | Continuously listens for `"Awaaz help me"` in Indian English & Hinglish (`en-IN`) |
| ⏱️ **5-Second Safety Countdown** | Prevents accidental triggers — a large CANCEL SOS button is always visible |
| 📍 **Live GPS Capture** | Sends a Google Maps link with real-time coordinates (8-second timeout with graceful fallback) |
| 🎙️ **Audio Evidence Recording** | Records surroundings via MediaRecorder and auto-saves timestamped `.webm` to device |
| 💬 **WhatsApp SOS Alerts** | Opens WhatsApp for up to 3 trusted `+91` contacts — no Twilio, no API keys, no cost |
| 🔇 **Voice Deactivation** | Say `"Awaaz I'm safe"` to stop recording and return to listening mode |
| 🧪 **Test SOS Mode** | Full simulation without sending real alerts — safe for demos |
| 📵 **Works Offline** | Full app cached by service worker — works with no internet after first load |
| 📱 **Installs Like a Native App** | PWA — adds to Android home screen, opens fullscreen with no browser bar |
| 🔒 **Zero Data Collection** | Contacts stored in `localStorage` on-device only — no servers, no accounts |

---

## Emergency Message Sent

```
🚨 EMERGENCY ALERT — AWAAZ SOS. Your contact needs help immediately.
Location: https://maps.google.com/?q=<lat>,<lng>
Please call them or contact emergency services now.
```

---

## Tech Stack

Built entirely with **native browser APIs** — zero frameworks, zero dependencies, zero monthly costs.

| Technology | Used For |
|---|---|
| `Web Speech API` | Continuous `en-IN` voice recognition + Text-to-Speech announcements |
| `Geolocation API` | Live GPS coordinate capture |
| `MediaRecorder API` | Audio evidence recording (`.webm`) |
| `WhatsApp URL Scheme` | `https://wa.me/<number>?text=...` — no Twilio, no backend |
| `localStorage` | Trusted contact storage (on-device only) |
| `manifest.json` | PWA install, standalone fullscreen, theme color `#ff2d55` |
| `sw.js` | Service worker for offline caching |

---

## Project Structure

```
awaaz-suraksha/
├── index.html          ← App shell: setup, idle, and SOS views
├── styles.css          ← Dark mobile-first UI with pulsing animations
├── app.js              ← Voice engine, SOS logic, GPS, recording, WhatsApp dispatch
├── manifest.json       ← PWA manifest (standalone, portrait, #ff2d55 theme)
├── sw.js               ← Service worker: offline cache + navigation fallback
├── README.md
└── icons/
    ├── icon-192.png    ← 192×192 app icon
    ├── icon-512.png    ← 512×512 app icon
    └── icon.svg        ← Vector shield icon
```

---

## Installation

### Install as Android App (No Play Store Needed)
1. Open the live site in **Google Chrome on Android**
2. Tap the **Install App** prompt → **AWAAZ Suraksha** lands on your home screen
3. Opens fullscreen with no browser bar — just like a native app

### Download APK
See [**Releases**](../../releases) → download `awaaz-suraksha.apk` → enable *Install unknown apps* in Android settings → install.

### Run Locally (for Development)
```bash
# Serve over HTTPS or localhost (required for mic + GPS + PWA install)
python -m http.server 8080
# Open http://localhost:8080 in Chrome
```

---

## First-Time Setup

1. Open the app → enter **up to 3 trusted contacts** (name + `+91` WhatsApp number)
2. Grant **Microphone** and **Location** permissions when prompted
3. Tap **Test SOS** to run a full simulation and verify everything works
4. The app is now armed — say **"Awaaz help me"** at any time to activate

> You never need to open or look at the app again after setup. Just keep it running.

---

## Privacy

- ✅ Trusted contacts are stored **only in your browser's `localStorage`** — never uploaded anywhere
- ✅ Audio recordings are saved **directly to your device** — no cloud storage
- ✅ GPS coordinates are only inserted into the WhatsApp URL at the moment of SOS — never logged
- ✅ **No backend server. No database. No analytics. No accounts.**

---

## Browser Compatibility

| Browser | Voice Detection | PWA Install | Offline |
|---|---|---|---|
| Chrome Android ✅ | ✅ Full support | ✅ Full support | ✅ |
| Edge Android ✅ | ✅ Full support | ✅ Full support | ✅ |
| Samsung Internet ⚠️ | ⚠️ Partial | ✅ | ✅ |
| Firefox Android ❌ | ❌ No `SpeechRecognition` | ❌ | ✅ |
| Safari iOS ⚠️ | ⚠️ Limited | ⚠️ Manual only | ✅ |

> **Recommended: Google Chrome on Android** for full hands-free voice functionality.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">

**Built for safety. Designed for India. Powered by voice.**

*AWAAZ Suraksha — आवाज़ सुरक्षा*

</div>
