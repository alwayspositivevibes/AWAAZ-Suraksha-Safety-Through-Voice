(() => {
  'use strict';

  const STORAGE_CONTACTS = 'awaaz_trusted_contacts';
  const STORAGE_SETTINGS = 'awaaz_settings';
  const STORAGE_LOG = 'awaaz_incident_log';
  const STORAGE_ADVANCED = 'awaaz_advanced_config';
  const STORAGE_INSTALL_SEEN = 'awaaz_install_prompt_seen';

  const IDB_NAME = 'awaaz_evidence_db';
  const IDB_STORE = 'clips';

  const COUNTDOWN_SECONDS = 5;
  const GPS_TOTAL_TIMEOUT_MS = 8000;
  const SHAKE_THRESHOLD = 22; // m/s^2 delta/magnitude threshold for strong shake
  const SHAKE_WINDOW_MS = 1500;
  const SHAKE_COOLDOWN_MS = 220;
  const POWER_WINDOW_MS = 2000;

  // --- DOM Elements ---
  const $ = (id) => document.getElementById(id);

  const appIconTrigger = $('app-icon-trigger');
  const micStatusPill = $('mic-status-pill');
  const gpsStatusPill = $('gps-status-pill');

  const installBanner = $('install-banner');
  const installConfirmBtn = $('install-confirm-btn');
  const installDismissBtn = $('install-dismiss-btn');
  const installManualHint = $('install-manual-hint');

  const noContactsBanner = $('no-contacts-banner');
  const jumpContactsBtn = $('jump-contacts-btn');

  const sosMainBtn = $('sos-main-btn');
  const liveTranscriptEl = $('live-transcript');
  const testSosBtn = $('test-sos-btn');
  const fakeCallOpenBtn = $('fake-call-open-btn');

  const toggleVoice = $('toggle-voice');
  const toggleSilent = $('toggle-silent');
  const toggleSiren = $('toggle-siren');
  const toggleShake = $('toggle-shake');

  const contactsSection = $('contacts-section');
  const contactsCountBadge = $('contacts-count-badge');
  const contactsListEl = $('contacts-list');
  const contactForm = $('contact-form');
  const contactEditIndex = $('contact-edit-index');
  const contactNameInput = $('contact-name-input');
  const contactPhoneInput = $('contact-phone-input');
  const contactFormError = $('contact-form-error');
  const contactSaveBtn = $('contact-save-btn');
  const contactCancelEditBtn = $('contact-cancel-edit-btn');

  const vaultCountBadge = $('vault-count-badge');
  const vaultListEl = $('vault-list');

  const logCountBadge = $('log-count-badge');
  const incidentLogListEl = $('incident-log-list');
  const clearLogBtn = $('clear-log-btn');

  const advancedStatusBadge = $('advanced-status-badge');
  const advancedForm = $('advanced-form');
  const advWebhookUrl = $('adv-webhook-url');
  const advWaPhoneId = $('adv-wa-phone-id');
  const advWaToken = $('adv-wa-token');
  const advClearBtn = $('adv-clear-btn');
  const advSaveStatus = $('adv-save-status');

  // SOS View Elements
  const sosView = $('sos-view');
  const sosSilentBadge = $('sos-silent-badge');
  const sosDemoBadge = $('sos-demo-badge');
  const sosPhaseText = $('sos-phase-text');
  const countdownBox = $('countdown-box');
  const countdownNumber = $('countdown-number');
  const sosGpsBadge = $('sos-gps-badge');
  const sosCoordsEl = $('sos-coords');
  const sosAddressEl = $('sos-address');
  const sosMapsLink = $('sos-maps-link');
  const sosRecStatus = $('sos-rec-status');
  const sosWaStatus = $('sos-wa-status');
  const sosContactsPanel = $('sos-contacts-panel');
  const sosFallbackNote = $('sos-fallback-note');
  const sosContactsActions = $('sos-contacts-actions');
  const sosDemoPreview = $('sos-demo-preview');
  const cancelSosBtn = $('cancel-sos-btn');

  // Fake Call Elements
  const fakeCallModal = $('fake-call-modal');
  const fakeCallCloseBtn = $('fake-call-close-btn');
  const fakeCallerChoices = $('fake-caller-choices');
  const fakeDelayChoices = $('fake-delay-choices');
  const fakeCallStartBtn = $('fake-call-start-btn');

  const fakeCallScreen = $('fake-call-screen');
  const fakeCallNameEl = $('fake-call-name');
  const fakeCallSubEl = $('fake-call-sub');
  const fakeCallTimerEl = $('fake-call-timer');
  const fakeCallRingActions = $('fake-call-ring-actions');
  const fakeCallActiveActions = $('fake-call-active-actions');
  const fakeCallAcceptBtn = $('fake-call-accept-btn');
  const fakeCallDeclineBtn = $('fake-call-decline-btn');
  const fakeCallEndBtn = $('fake-call-end-btn');

  // Mic Denied Overlay
  const micDeniedOverlay = $('mic-denied-overlay');
  const micRetryOverlayBtn = $('mic-retry-overlay-btn');
  const micContinueWithoutBtn = $('mic-continue-without-btn');

  // --- Application State ---
  const state = {
    contacts: [],
    settings: {
      voiceEnabled: true,
      silentMode: false,
      sirenEnabled: true,
      shakeEnabled: true
    },
    advanced: {
      webhookUrl: '',
      waPhoneId: '',
      waToken: ''
    },
    logs: [],
    clips: [],
    mode: 'idle', // 'idle' | 'countdown' | 'active'
    isDemo: false,
    runSilent: false,
    dispatchToken: 0,
    countdownRemaining: COUNTDOWN_SECONDS,
    countdownTimer: null,
    deferredInstallPrompt: null,

    // Voice
    recognition: null,
    isListening: false,
    micOk: false,
    micBlocked: false,
    micDeniedDismissed: false,
    lastVoiceTriggerAt: 0,

    // GPS
    gpsOk: false,
    gpsWatchId: null,
    lastGeocodeKey: '',
    currentLocation: null, // { lat, lng, address }

    // Audio Recording
    mediaRecorder: null,
    mediaStream: null,
    audioChunks: [],
    recordingStartedAt: 0,
    recordingTimer: null,

    // Siren Audio
    sirenCtx: null,
    sirenInterval: null,
    sirenOsc1: null,
    sirenOsc2: null,

    // Shake & Power Listeners
    shakeTimestamps: [],
    lastShakeAt: 0,
    lastAccel: null,
    powerTimestamps: [],
    visibilityTimestamps: [],
    holdTimer: null,

    // Fake Call
    fakeCaller: 'Maa',
    fakeDelaySec: 0,
    fakeCallTimeout: null,
    fakeCallTimerInterval: null,
    fakeCallStartedAt: 0,
    ringCtx: null,
    ringInterval: null,

    // Vault active audio playback
    activeAudioEl: null,
    activePlayBtn: null
  };

  // --- Storage Helpers ---
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota errors
    }
  }

  function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // --- IndexedDB for Audio Evidence Vault ---
  function openEvidenceDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadClipsFromDB() {
    try {
      const db = await openEvidenceDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = Array.isArray(req.result) ? req.result : [];
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async function saveClipToDB(clip) {
    try {
      const db = await openEvidenceDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(clip);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback: clip still stays in state.clips for current session
    }
  }

  // --- Incident Log ---
  function addIncidentLog(eventTitle, detail = '') {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      event: eventTitle,
      detail
    };
    state.logs.unshift(entry);
    if (state.logs.length > 100) {
      state.logs = state.logs.slice(0, 100);
    }
    writeJson(STORAGE_LOG, state.logs);
    renderIncidentLog();
  }

  function renderIncidentLog() {
    logCountBadge.textContent = `${state.logs.length} event${state.logs.length === 1 ? '' : 's'}`;
    incidentLogListEl.innerHTML = '';

    if (state.logs.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-msg';
      empty.textContent = 'No incidents recorded.';
      incidentLogListEl.appendChild(empty);
      return;
    }

    state.logs.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'incident-log-item';

      const titleEl = document.createElement('strong');
      titleEl.textContent = entry.event;

      const timeEl = document.createElement('span');
      timeEl.className = 'incident-time';
      timeEl.textContent = formatTimestamp(entry.timestamp);

      li.append(titleEl, timeEl);
      if (entry.detail) {
        const detailEl = document.createElement('span');
        detailEl.className = 'muted-small';
        detailEl.textContent = entry.detail;
        li.appendChild(detailEl);
      }
      incidentLogListEl.appendChild(li);
    });
  }

  // --- Audio Evidence Vault Rendering ---
  function renderVault() {
    vaultCountBadge.textContent = `${state.clips.length} clip${state.clips.length === 1 ? '' : 's'}`;
    vaultListEl.innerHTML = '';

    if (state.clips.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-msg';
      empty.textContent = 'No recorded SOS audio clips yet.';
      vaultListEl.appendChild(empty);
      return;
    }

    state.clips.forEach((clip) => {
      const row = document.createElement('div');
      row.className = 'vault-item';

      const meta = document.createElement('div');
      meta.className = 'vault-meta';

      const left = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'vault-name';
      nameEl.textContent = clip.filename;

      const subEl = document.createElement('div');
      subEl.className = 'vault-sub';
      subEl.textContent = `${formatTimestamp(clip.timestamp)} • Duration ${formatDuration(clip.durationSec)}`;
      left.append(nameEl, subEl);
      meta.appendChild(left);

      const actions = document.createElement('div');
      actions.className = 'vault-actions';

      const objectUrl = clip._url || (clip._url = URL.createObjectURL(clip.blob));

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'btn btn-secondary btn-xs';
      playBtn.textContent = 'Play';

      playBtn.addEventListener('click', () => {
        if (state.activeAudioEl && state.activePlayBtn === playBtn) {
          state.activeAudioEl.pause();
          state.activeAudioEl = null;
          playBtn.textContent = 'Play';
          state.activePlayBtn = null;
          return;
        }
        if (state.activeAudioEl) {
          state.activeAudioEl.pause();
          if (state.activePlayBtn) state.activePlayBtn.textContent = 'Play';
        }
        const audio = new Audio(objectUrl);
        state.activeAudioEl = audio;
        state.activePlayBtn = playBtn;
        playBtn.textContent = 'Stop';
        audio.onended = () => {
          playBtn.textContent = 'Play';
          state.activeAudioEl = null;
          state.activePlayBtn = null;
        };
        audio.play().catch(() => {
          playBtn.textContent = 'Play';
        });
      });

      const dlLink = document.createElement('a');
      dlLink.className = 'btn btn-safe btn-xs';
      dlLink.href = objectUrl;
      dlLink.download = clip.filename;
      dlLink.textContent = 'Download';

      actions.append(playBtn, dlLink);
      row.append(meta, actions);
      vaultListEl.appendChild(row);
    });
  }

  // --- Trusted Contacts ---
  function normalizeIndianPhone(input) {
    const cleaned = input.replace(/[^\d+]/g, '');
    if (!cleaned) return null;
    let digits = cleaned;
    if (digits.startsWith('+91')) digits = digits.slice(3);
    else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
    else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
    if (!/^[6-9]\d{9}$/.test(digits)) return null;
    return `+91${digits}`;
  }

  function formatDisplayPhone(e164) {
    const d = e164.replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) {
      return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
    }
    return e164;
  }

  function renderContacts() {
    const count = state.contacts.length;
    contactsCountBadge.textContent = `${count} / 3 saved`;
    noContactsBanner.classList.toggle('hidden', count > 0);
    contactsListEl.innerHTML = '';

    state.contacts.forEach((contact, idx) => {
      const item = document.createElement('div');
      item.className = 'contact-item';

      const info = document.createElement('div');
      info.className = 'contact-item-info';
      const nameEl = document.createElement('strong');
      nameEl.textContent = contact.name;
      const phoneEl = document.createElement('span');
      phoneEl.textContent = formatDisplayPhone(contact.phone);
      info.append(nameEl, phoneEl);

      const btns = document.createElement('div');
      btns.className = 'contact-item-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-xs';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        contactEditIndex.value = String(idx);
        contactNameInput.value = contact.name;
        contactPhoneInput.value = contact.phone.replace(/^\+91/, '');
        contactSaveBtn.textContent = 'Update Contact';
        contactCancelEditBtn.classList.remove('hidden');
        contactFormError.classList.add('hidden');
        contactNameInput.focus();
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-outline-danger btn-xs';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        state.contacts.splice(idx, 1);
        writeJson(STORAGE_CONTACTS, state.contacts);
        resetContactForm();
        renderContacts();
      });

      btns.append(editBtn, delBtn);
      item.append(info, btns);
      contactsListEl.appendChild(item);
    });

    const atLimit = count >= 3 && Number(contactEditIndex.value) < 0;
    contactForm.classList.toggle('hidden', atLimit);
  }

  function resetContactForm() {
    contactEditIndex.value = '-1';
    contactNameInput.value = '';
    contactPhoneInput.value = '';
    contactSaveBtn.textContent = 'Add Contact';
    contactCancelEditBtn.classList.add('hidden');
    contactFormError.classList.add('hidden');
  }

  function handleContactSubmit(event) {
    event.preventDefault();
    contactFormError.classList.add('hidden');

    const name = contactNameInput.value.trim();
    const rawPhone = contactPhoneInput.value.trim();
    const editIdx = Number(contactEditIndex.value);

    if (!name || !rawPhone) {
      contactFormError.textContent = 'Enter both name and 10-digit +91 mobile number.';
      contactFormError.classList.remove('hidden');
      return;
    }

    const phone = normalizeIndianPhone(rawPhone);
    if (!phone) {
      contactFormError.textContent = 'Enter a valid 10-digit Indian mobile number (+91).';
      contactFormError.classList.remove('hidden');
      return;
    }

    if (editIdx >= 0 && editIdx < state.contacts.length) {
      state.contacts[editIdx] = { name, phone };
    } else {
      if (state.contacts.length >= 3) {
        contactFormError.textContent = 'Maximum 3 trusted contacts allowed.';
        contactFormError.classList.remove('hidden');
        return;
      }
      state.contacts.push({ name, phone });
    }

    writeJson(STORAGE_CONTACTS, state.contacts);
    resetContactForm();
    renderContacts();
  }

  // --- PWA Install Banner ---
  function isStandaloneMode() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function initInstallBanner() {
    if (isStandaloneMode()) {
      installBanner.classList.add('hidden');
      return;
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      installManualHint.classList.add('hidden');
      if (!localStorage.getItem(STORAGE_INSTALL_SEEN)) {
        installBanner.classList.remove('hidden');
      }
    });

    window.addEventListener('appinstalled', () => {
      state.deferredInstallPrompt = null;
      installBanner.classList.add('hidden');
      localStorage.setItem(STORAGE_INSTALL_SEEN, '1');
    });

    if (!localStorage.getItem(STORAGE_INSTALL_SEEN)) {
      installBanner.classList.remove('hidden');
    }

    installConfirmBtn.addEventListener('click', async () => {
      if (state.deferredInstallPrompt) {
        state.deferredInstallPrompt.prompt();
        await state.deferredInstallPrompt.userChoice;
        state.deferredInstallPrompt = null;
        localStorage.setItem(STORAGE_INSTALL_SEEN, '1');
        installBanner.classList.add('hidden');
      } else {
        installManualHint.classList.remove('hidden');
      }
    });

    installDismissBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_INSTALL_SEEN, '1');
      installBanner.classList.add('hidden');
    });
  }

  // --- Status Pills (Mic & GPS) ---
  function updateStatusPills() {
    micStatusPill.className = `status-pill ${state.micOk ? 'status-ok' : 'status-bad'}`;
    gpsStatusPill.className = `status-pill ${state.gpsOk ? 'status-ok' : 'status-bad'}`;
  }

  async function probePermissionsOnLoad() {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const geoPerm = await navigator.permissions.query({ name: 'geolocation' });
        state.gpsOk = geoPerm.state === 'granted';
        geoPerm.onchange = () => {
          state.gpsOk = geoPerm.state === 'granted';
          updateStatusPills();
        };
      } catch {
        state.gpsOk = 'geolocation' in navigator;
      }

      try {
        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        if (micPerm.state === 'denied') {
          state.micOk = false;
          showMicDeniedOverlay();
        }
        micPerm.onchange = () => {
          if (micPerm.state === 'granted') {
            state.micOk = true;
            micDeniedOverlay.classList.add('hidden');
          } else if (micPerm.state === 'denied') {
            state.micOk = false;
          }
          updateStatusPills();
        };
      } catch {
        // Ignore unsupported permission query
      }
    } else {
      state.gpsOk = 'geolocation' in navigator;
    }
    updateStatusPills();
  }

  function showMicDeniedOverlay() {
    if (!state.micDeniedDismissed) {
      micDeniedOverlay.classList.remove('hidden');
    }
  }

  // --- Text-to-Speech (en-IN) ---
  function speak(text, onDone) {
    if (state.runSilent || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 0.98;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang && v.lang.toLowerCase() === 'en-in') ||
        voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (onDone) onDone();
      };
      utterance.onerror = () => {
        if (onDone) onDone();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      if (onDone) onDone();
    }
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  // --- Loud SOS Siren (Dual-Tone Sawtooth Wave, 40% Gain) ---
  function startSiren() {
    if (state.runSilent || !state.settings.sirenEnabled) {
      return;
    }
    stopSiren();

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(780, ctx.currentTime);
      osc2.frequency.setValueAtTime(980, ctx.currentTime);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      osc1.start();
      osc2.start();

      let high = true;
      const interval = setInterval(() => {
        if (!state.sirenCtx) return;
        high = !high;
        const now = ctx.currentTime;
        osc1.frequency.setValueAtTime(high ? 780 : 560, now);
        osc2.frequency.setValueAtTime(high ? 980 : 720, now);
      }, 360);

      state.sirenCtx = ctx;
      state.sirenOsc1 = osc1;
      state.sirenOsc2 = osc2;
      state.sirenInterval = interval;
    } catch {
      // Ignore audio autoplay block
    }
  }

  function stopSiren() {
    clearInterval(state.sirenInterval);
    state.sirenInterval = null;
    try {
      if (state.sirenOsc1) state.sirenOsc1.stop();
      if (state.sirenOsc2) state.sirenOsc2.stop();
      if (state.sirenCtx) state.sirenCtx.close();
    } catch {
      // Ignore
    }
    state.sirenOsc1 = null;
    state.sirenOsc2 = null;
    state.sirenCtx = null;
  }

  // --- Web Speech API Wake Word Listener (en-IN) ---
  const WAKE_REGEX = /(?:^|\s)(a+w+a+z|a+w+a+s|a+w+a+j|a+v+a+z|a+v+a+s|आवाज़|आवाज)\s+help\s+me(?:\s|$)/;
  const SAFE_REGEX = /(?:^|\s)(a+w+a+z|a+w+a+s|a+w+a+j|a+v+a+z|a+v+a+s|आवाज़|आवाज)\s+(i'?m|im|i\s+am)\s+safe(?:\s|$)/;

  function normalizeTranscript(raw) {
    return raw
      .toLowerCase()
      .replace(/[.,!?;:"()\-]/g, ' ')
      .replace(/[’`]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matchWakeOrSafe(resultList, startIndex) {
    let display = '';
    for (let i = startIndex; i < resultList.length; i++) {
      const result = resultList[i];
      for (let altIdx = 0; altIdx < result.length; altIdx++) {
        const alt = result[altIdx];
        const raw = (alt.transcript || '').trim();
        if (altIdx === 0 && raw) display = raw;

        const norm = normalizeTranscript(raw);
        if (!norm) continue;

        const conf = typeof alt.confidence === 'number' ? alt.confidence : 0;
        const okConf = result.isFinal ? (conf === 0 || conf >= 0.4) : (conf === 0 || conf >= 0.55);
        if (!okConf) continue;

        if (WAKE_REGEX.test(norm)) return { command: 'wake', display };
        if (SAFE_REGEX.test(norm)) return { command: 'safe', display };
      }
    }
    return { command: null, display };
  }

  function startSpeechRecognition() {
    if (!state.settings.voiceEnabled) {
      stopSpeechRecognition();
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      state.micOk = false;
      updateStatusPills();
      liveTranscriptEl.textContent = 'Heard: Speech recognition requires Chrome on Android/Desktop.';
      return;
    }

    if (state.isListening && state.recognition) return;

    if (!state.recognition) {
      const rec = new SpeechRec();
      rec.lang = 'en-IN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        state.isListening = true;
        state.micOk = true;
        state.micBlocked = false;
        updateStatusPills();
      };

      rec.onresult = (event) => {
        const { command, display } = matchWakeOrSafe(event.results, event.resultIndex);
        if (display) {
          liveTranscriptEl.textContent = `Heard: ${display}`;
        }

        const now = Date.now();
        if (now - state.lastVoiceTriggerAt < 2500) return;

        if (command === 'wake' && state.mode === 'idle') {
          state.lastVoiceTriggerAt = now;
          activateSOS({ isDemo: false, forceSilent: false, source: 'Voice ("Awaaz help me")' });
        } else if (command === 'safe' && (state.mode === 'countdown' || state.mode === 'active')) {
          state.lastVoiceTriggerAt = now;
          deactivateSOS('Voice ("Awaaz I\'m safe")');
        }
      };

      rec.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          state.micOk = false;
          state.micBlocked = true;
          state.isListening = false;
          updateStatusPills();
          showMicDeniedOverlay();
        }
      };

      rec.onend = () => {
        state.isListening = false;
        if (state.settings.voiceEnabled && !state.micBlocked) {
          setTimeout(() => {
            if (state.settings.voiceEnabled && !state.isListening && !state.micBlocked) {
              try {
                state.recognition.start();
              } catch {
                // Ignore restart errors
              }
            }
          }, 300);
        } else {
          updateStatusPills();
        }
      };

      state.recognition = rec;
    }

    try {
      state.recognition.start();
    } catch {
      // Ignore if already starting
    }
  }

  function stopSpeechRecognition() {
    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch {
        // Ignore
      }
    }
    state.isListening = false;
    state.micOk = false;
    updateStatusPills();
    liveTranscriptEl.textContent = state.settings.voiceEnabled
      ? 'Heard: Tap Mic to start voice guard.'
      : 'Heard: Voice Wake Word Listener is OFF.';
  }

  async function requestMicAndStart() {
    if (!state.settings.voiceEnabled) return;
    state.micBlocked = false;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        state.micOk = true;
        state.micBlocked = false;
        micDeniedOverlay.classList.add('hidden');
        updateStatusPills();
        startSpeechRecognition();
      } catch (err) {
        if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          state.micOk = false;
          state.micBlocked = true;
          updateStatusPills();
          showMicDeniedOverlay();
          return;
        }
        startSpeechRecognition();
      }
    } else {
      startSpeechRecognition();
    }
  }

  // --- Geolocation (8s Timeout + Network Fallback + Live Watch + Nominatim Reverse Geocode) ---
  function getPositionOnce(options) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async function captureInitialLocationWithFallback() {
    if (!('geolocation' in navigator)) {
      state.gpsOk = false;
      updateStatusPills();
      return { ok: false, reason: 'Geolocation unavailable' };
    }

    const deadline = Date.now() + GPS_TOTAL_TIMEOUT_MS;

    // Try high-accuracy GPS first (up to 5s), then network fallback with remaining budget
    try {
      const pos = await getPositionOnce({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000
      });
      state.gpsOk = true;
      updateStatusPills();
      return {
        ok: true,
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6),
        source: 'GPS'
      };
    } catch {
      const remaining = Math.max(1200, deadline - Date.now());
      try {
        const pos = await getPositionOnce({
          enableHighAccuracy: false,
          timeout: remaining,
          maximumAge: 60000
        });
        state.gpsOk = true;
        updateStatusPills();
        return {
          ok: true,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          source: 'Network fallback'
        };
      } catch (err) {
        state.gpsOk = false;
        updateStatusPills();
        return { ok: false, reason: err && err.message ? err.message : 'Location unavailable' };
      }
    }
  }

  async function reverseGeocodeNominatim(lat, lng) {
    const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
    if (state.lastGeocodeKey === key && state.currentLocation && state.currentLocation.address) {
      return state.currentLocation.address;
    }
    state.lastGeocodeKey = key;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return '';
      const data = await res.json();
      return data && data.display_name ? data.display_name : '';
    } catch {
      clearTimeout(timer);
      return '';
    }
  }

  function updateLiveTelemetryUI(lat, lng, address, sourceLabel) {
    sosCoordsEl.textContent = `${lat}, ${lng}`;
    sosGpsBadge.textContent = sourceLabel || 'Live';
    sosGpsBadge.className = 'sos-pill ok';

    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    sosMapsLink.href = mapsUrl;
    sosMapsLink.classList.remove('hidden');

    if (address) {
      sosAddressEl.textContent = address;
    } else {
      sosAddressEl.textContent = 'Street address unavailable (offline or geocoder timeout)';
    }
  }

  function startLiveGpsWatch(token) {
    if (!('geolocation' in navigator)) return;
    stopLiveGpsWatch();

    state.gpsWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (state.dispatchToken !== token || state.mode !== 'active') return;
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        state.gpsOk = true;
        updateStatusPills();

        const currentAddr = state.currentLocation ? state.currentLocation.address : '';
        state.currentLocation = { lat, lng, address: currentAddr };
        updateLiveTelemetryUI(lat, lng, currentAddr, 'Live');

        const addr = await reverseGeocodeNominatim(lat, lng);
        if (state.dispatchToken !== token || state.mode !== 'active') return;
        if (addr) {
          state.currentLocation.address = addr;
          updateLiveTelemetryUI(lat, lng, addr, 'Live');
        }
      },
      () => {
        // Keep last known coordinates if watch experiences temporary signal drop
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }

  function stopLiveGpsWatch() {
    if (state.gpsWatchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(state.gpsWatchId);
      state.gpsWatchId = null;
    }
  }

  // --- Audio Recording (MediaRecorder -> .webm + Vault + Download) ---
  function getAudioMimeType() {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  }

  async function startAudioRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      sosRecStatus.textContent = 'Recording unsupported';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (state.mode !== 'active') {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      state.mediaStream = stream;
      state.audioChunks = [];
      const mimeType = getAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) state.audioChunks.push(e.data);
      };

      recorder.start(1000);
      state.mediaRecorder = recorder;
      state.recordingStartedAt = Date.now();
      sosRecStatus.textContent = 'Recording 00:00';

      clearInterval(state.recordingTimer);
      state.recordingTimer = setInterval(() => {
        if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
          const sec = (Date.now() - state.recordingStartedAt) / 1000;
          sosRecStatus.textContent = `Recording ${formatDuration(sec)}`;
        }
      }, 1000);
    } catch {
      sosRecStatus.textContent = 'Mic permission denied';
      state.micOk = false;
      updateStatusPills();
    }
  }

  function stopAndSaveRecording() {
    clearInterval(state.recordingTimer);
    state.recordingTimer = null;

    return new Promise((resolve) => {
      const recorder = state.mediaRecorder;
      const stream = state.mediaStream;
      state.mediaRecorder = null;
      state.mediaStream = null;

      const stopTracks = () => {
        if (stream) stream.getTracks().forEach((t) => t.stop());
      };

      if (!recorder || recorder.state === 'inactive') {
        stopTracks();
        resolve(null);
        return;
      }

      const durationSec = Math.max(1, Math.round((Date.now() - state.recordingStartedAt) / 1000));

      recorder.onstop = async () => {
        stopTracks();
        if (!state.audioChunks.length) {
          resolve(null);
          return;
        }

        const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
        state.audioChunks = [];

        const now = Date.now();
        const stamp = new Date(now).toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `awaaz-sos-${stamp}.webm`;
        const url = URL.createObjectURL(blob);

        // Trigger direct device download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Save to Audio Evidence Vault (IndexedDB + UI)
        const clip = {
          id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
          filename,
          timestamp: now,
          durationSec,
          blob,
          _url: url
        };
        state.clips.unshift(clip);
        await saveClipToDB({
          id: clip.id,
          filename: clip.filename,
          timestamp: clip.timestamp,
          durationSec: clip.durationSec,
          blob: clip.blob
        });
        renderVault();
        resolve(filename);
      };

      try {
        recorder.stop();
      } catch {
        stopTracks();
        resolve(null);
      }
    });
  }

  // --- Alert Formatting & Dispatch (Advanced Webhook/Cloud API or wa.me + Direct tel:) ---
  function buildEmergencyMessage(loc) {
    if (loc && loc.ok) {
      const mapsUrl = `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
      const addrPart = loc.address ? ` Address: ${loc.address}.` : '';
      return `EMERGENCY ALERT - AWAAZ SOS. I need help immediately.${addrPart} Map: ${mapsUrl}. Please call me or contact emergency services (112/181) now.`;
    }
    return 'EMERGENCY ALERT - AWAAZ SOS. I need help immediately. Location unavailable. Please call me or contact emergency services (112/181) now.';
  }

  function renderSosContactsPanel(message, noteText, showDemoPreview) {
    sosContactsActions.innerHTML = '';

    if (state.contacts.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted-small';
      empty.textContent = 'No trusted contacts saved. Call 112 or 181 immediately if needed.';
      sosContactsActions.appendChild(empty);
    } else {
      state.contacts.forEach((contact) => {
        const digits = contact.phone.replace(/\D/g, '');
        const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

        const row = document.createElement('div');
        row.className = 'sos-contact-row';

        const meta = document.createElement('div');
        meta.className = 'sos-contact-meta';
        const n = document.createElement('strong');
        n.textContent = contact.name;
        const p = document.createElement('span');
        p.textContent = formatDisplayPhone(contact.phone);
        meta.append(n, p);

        const btns = document.createElement('div');
        btns.className = 'sos-contact-btns';

        const callBtn = document.createElement('a');
        callBtn.className = 'btn btn-safe btn-xs';
        callBtn.href = `tel:${contact.phone}`;
        callBtn.textContent = 'Call';

        const waBtn = document.createElement('a');
        waBtn.className = 'btn btn-secondary btn-xs';
        waBtn.href = state.isDemo ? '#' : waHref;
        if (!state.isDemo) {
          waBtn.target = '_blank';
          waBtn.rel = 'noopener';
        } else {
          waBtn.addEventListener('click', (e) => e.preventDefault());
        }
        waBtn.textContent = state.isDemo ? 'WhatsApp (Demo)' : 'WhatsApp';

        btns.append(callBtn, waBtn);
        row.append(meta, btns);
        sosContactsActions.appendChild(row);
      });
    }

    sosFallbackNote.textContent = noteText;
    if (showDemoPreview) {
      sosDemoPreview.textContent = message;
      sosDemoPreview.classList.remove('hidden');
    } else {
      sosDemoPreview.classList.add('hidden');
    }
    sosContactsPanel.classList.remove('hidden');
  }

  async function tryAutomatedDispatch(message, loc) {
    const { webhookUrl, waPhoneId, waToken } = state.advanced;
    let sentAutomated = false;

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app: 'AWAAZ SOS',
            timestamp: new Date().toISOString(),
            message,
            location: loc,
            contacts: state.contacts
          })
        });
        if (res.ok) sentAutomated = true;
      } catch {
        // Silently fall back to wa.me
      }
    }

    if (waPhoneId && waToken && state.contacts.length > 0) {
      try {
        const results = await Promise.all(
          state.contacts.map((c) =>
            fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(waPhoneId)}/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${waToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: c.phone.replace(/\D/g, ''),
                type: 'text',
                text: { body: message }
              })
            })
          )
        );
        if (results.some((r) => r.ok)) sentAutomated = true;
      } catch {
        // Silently fall back to wa.me
      }
    }

    return sentAutomated;
  }

  async function dispatchAlerts(message, loc, token) {
    if (state.isDemo) {
      sosWaStatus.textContent = 'Demo — nothing sent';
      renderSosContactsPanel(
        message,
        'DEMO MODE: WhatsApp was NOT opened and nothing was sent. Preview below:',
        true
      );
      return;
    }

    if (state.contacts.length === 0) {
      sosWaStatus.textContent = 'No saved contacts';
      renderSosContactsPanel(message, 'No contacts saved. Dial 112 or 181 directly.', false);
      return;
    }

    // Attempt optional Advanced automated dispatch first if configured
    const hasAdvanced = Boolean(
      state.advanced.webhookUrl || (state.advanced.waPhoneId && state.advanced.waToken)
    );
    if (hasAdvanced) {
      sosWaStatus.textContent = 'Sending automated alert…';
      const okAuto = await tryAutomatedDispatch(message, loc);
      if (state.dispatchToken !== token || state.mode !== 'active') return;
      if (okAuto) {
        sosWaStatus.textContent = `Automated alert sent (${state.contacts.length})`;
        renderSosContactsPanel(
          message,
          'Automated alert dispatched. Direct Call & WhatsApp buttons remain ready below:',
          false
        );
        return;
      }
    }

    // Default wa.me method
    sosWaStatus.textContent = 'Opening WhatsApp…';
    let opened = 0;
    let blocked = false;

    state.contacts.forEach((contact, idx) => {
      setTimeout(() => {
        if (state.dispatchToken !== token || state.mode !== 'active') return;
        const digits = contact.phone.replace(/\D/g, '');
        const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
        const win = window.open(waUrl, '_blank', 'noopener');
        if (win) opened += 1;
        else blocked = true;

        if (idx === state.contacts.length - 1) {
          if (opened === 0 && blocked) {
            sosWaStatus.textContent = 'WhatsApp blocked — call below';
            renderSosContactsPanel(
              message,
              'WhatsApp could not open automatically. Tap Call or WhatsApp below immediately:',
              false
            );
          } else if (blocked) {
            sosWaStatus.textContent = `Opened ${opened}/${state.contacts.length} — call below`;
            renderSosContactsPanel(
              message,
              'Some WhatsApp windows were blocked. Direct Call & WhatsApp buttons below:',
              false
            );
          } else {
            sosWaStatus.textContent = `WhatsApp opened (${opened})`;
            renderSosContactsPanel(
              message,
              'If WhatsApp is not installed, tap Call below to dial directly:',
              false
            );
          }
        }
      }, idx * 450);
    });
  }

  // --- SOS Activation & Deactivation Sequence ---
  function activateSOS({ isDemo = false, forceSilent = false, source = 'Manual SOS Button' }) {
    if (state.mode === 'countdown' || state.mode === 'active') {
      return;
    }

    const silent = forceSilent || state.settings.silentMode;
    state.mode = 'countdown';
    state.isDemo = isDemo;
    state.runSilent = silent;
    state.dispatchToken += 1;
    const token = state.dispatchToken;

    addIncidentLog(
      isDemo ? 'DEMO SOS Triggered' : silent ? 'SILENT SOS Triggered' : 'SOS Triggered',
      `Source: ${source}`
    );

    // Reset SOS view UI
    countdownBox.classList.remove('hidden');
    sosContactsPanel.classList.add('hidden');
    sosDemoPreview.classList.add('hidden');
    sosMapsLink.classList.add('hidden');

    sosSilentBadge.classList.toggle('hidden', !silent);
    sosDemoBadge.classList.toggle('hidden', !isDemo);

    state.countdownRemaining = COUNTDOWN_SECONDS;
    countdownNumber.textContent = String(COUNTDOWN_SECONDS);
    sosPhaseText.textContent = isDemo
      ? 'DEMO MODE: Sending simulated alert in 5 seconds…'
      : 'Stay calm. Sending alert in 5 seconds…';

    sosGpsBadge.textContent = 'Standby';
    sosGpsBadge.className = 'sos-pill';
    sosCoordsEl.textContent = 'Waiting for countdown…';
    sosAddressEl.textContent = 'Will resolve address after countdown';
    sosRecStatus.textContent = 'Standby';
    sosWaStatus.textContent = 'Standby';

    // Step 1: Instant full screen red takeover
    sosView.classList.remove('hidden');

    // Step 2: Speak + Start Siren (unless Silent Mode)
    startSiren();
    speak('AWAAZ SOS activated. Stay calm. Sending alert in 5 seconds.', () => {
      if (state.settings.voiceEnabled && (state.mode === 'countdown' || state.mode === 'active')) {
        startSpeechRecognition();
      }
    });

    // Step 3: 5-second countdown
    clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(() => {
      if (state.dispatchToken !== token || state.mode !== 'countdown') {
        clearInterval(state.countdownTimer);
        return;
      }

      state.countdownRemaining -= 1;
      countdownNumber.textContent = String(Math.max(0, state.countdownRemaining));

      if (state.countdownRemaining <= 0) {
        clearInterval(state.countdownTimer);
        executeEmergencyDispatch(token);
      }
    }, 1000);
  }

  async function executeEmergencyDispatch(token) {
    if (state.dispatchToken !== token || state.mode !== 'countdown') return;

    state.mode = 'active';
    countdownBox.classList.add('hidden');
    sosPhaseText.textContent = state.isDemo
      ? 'DEMO MODE active — live GPS & recording verified'
      : 'Alerting your contacts now. Stay calm.';

    sosGpsBadge.textContent = 'Locating';
    sosGpsBadge.className = 'sos-pill';
    sosCoordsEl.textContent = 'Capturing GPS (8s max)…';
    sosAddressEl.textContent = 'Resolving street address…';
    sosWaStatus.textContent = 'Waiting for GPS…';

    // Step 4: Start MediaRecorder immediately
    startAudioRecording();

    // Step 6: Speak alerting confirmation (unless Silent Mode)
    speak('Alerting your contacts now. Stay calm.', () => {
      if (state.settings.voiceEnabled && state.mode === 'active') {
        startSpeechRecognition();
      }
    });

    // Step 4: GPS capture (8s timeout + network fallback) + Nominatim reverse geocode
    const loc = await captureInitialLocationWithFallback();
    if (state.dispatchToken !== token || state.mode !== 'active') return;

    if (loc.ok) {
      state.currentLocation = { lat: loc.lat, lng: loc.lng, address: '' };
      updateLiveTelemetryUI(loc.lat, loc.lng, '', loc.source);

      // Start continuous watch for Live GPS Telemetry
      startLiveGpsWatch(token);

      const addr = await reverseGeocodeNominatim(loc.lat, loc.lng);
      if (state.dispatchToken !== token || state.mode !== 'active') return;
      if (addr) {
        loc.address = addr;
        state.currentLocation.address = addr;
        updateLiveTelemetryUI(loc.lat, loc.lng, addr, loc.source);
      }
    } else {
      sosGpsBadge.textContent = 'Unavailable';
      sosGpsBadge.className = 'sos-pill err';
      sosCoordsEl.textContent = 'Location unavailable';
      sosAddressEl.textContent = loc.reason || 'Could not determine coordinates';
    }

    const message = buildEmergencyMessage(loc);
    dispatchAlerts(message, loc, token);
  }

  async function deactivateSOS(reason = 'Button') {
    if (state.mode !== 'countdown' && state.mode !== 'active') return;

    const wasActive = state.mode === 'active';
    const wasDemo = state.isDemo;
    const wasSilent = state.runSilent;

    state.dispatchToken += 1;
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
    state.mode = 'idle';
    state.isDemo = false;

    stopSiren();
    stopLiveGpsWatch();
    stopSpeech();

    if (wasActive) {
      const savedName = await stopAndSaveRecording();
      addIncidentLog(
        wasDemo ? 'DEMO SOS Deactivated' : 'SOS Deactivated',
        `By: ${reason}${savedName ? ` • Saved ${savedName}` : ''}`
      );
      if (!wasSilent) {
        state.runSilent = false;
        speak('AWAAZ SOS deactivated. You are safe now.', () => {
          if (state.settings.voiceEnabled) startSpeechRecognition();
        });
      }
    } else {
      addIncidentLog(
        wasDemo ? 'DEMO SOS Cancelled' : 'SOS Cancelled',
        `Aborted during 5s countdown (${reason})`
      );
      if (reason.startsWith('Voice') && !wasSilent) {
        state.runSilent = false;
        speak('AWAAZ SOS deactivated. You are safe now.', () => {
          if (state.settings.voiceEnabled) startSpeechRecognition();
        });
      } else if (state.settings.voiceEnabled) {
        startSpeechRecognition();
      }
    }

    state.runSilent = false;
    sosView.classList.add('hidden');
  }

  // --- Silent Secret Triggers: 3x Power/Visibility Press & 3s App Icon Hold ---
  function initSilentTriggers() {
    // Long-press 3 seconds on app icon area
    const startHold = () => {
      if (state.mode !== 'idle') return;
      appIconTrigger.classList.add('holding');
      clearTimeout(state.holdTimer);
      state.holdTimer = setTimeout(() => {
        appIconTrigger.classList.remove('holding');
        activateSOS({
          isDemo: false,
          forceSilent: true,
          source: 'Long-press app icon (3s Silent SOS)'
        });
      }, 3000);
    };

    const cancelHold = () => {
      clearTimeout(state.holdTimer);
      state.holdTimer = null;
      appIconTrigger.classList.remove('holding');
    };

    appIconTrigger.addEventListener('pointerdown', startHold);
    appIconTrigger.addEventListener('pointerup', cancelHold);
    appIconTrigger.addEventListener('pointercancel', cancelHold);
    appIconTrigger.addEventListener('pointerleave', cancelHold);

    // 3 rapid power button presses via visibilitychange (screen lock/unlock) or hardware keydown
    document.addEventListener('visibilitychange', () => {
      if (state.mode === 'idle') {
        const now = Date.now();
        state.visibilityTimestamps = state.visibilityTimestamps.filter(
          (t) => now - t <= POWER_WINDOW_MS
        );
        state.visibilityTimestamps.push(now);

        if (state.visibilityTimestamps.length >= 3) {
          state.visibilityTimestamps = [];
          activateSOS({
            isDemo: false,
            forceSilent: true,
            source: '3x rapid power/visibility trigger (Silent SOS)'
          });
          return;
        }
      }

      if (!document.hidden && state.settings.voiceEnabled) {
        startSpeechRecognition();
      }
    });

    window.addEventListener('keydown', (event) => {
      const powerKeys = ['Power', 'WakeUp', 'AudioVolumeDown', 'VolumeDown'];
      if (!powerKeys.includes(event.key)) return;
      if (state.mode !== 'idle') return;

      const now = Date.now();
      state.powerTimestamps = state.powerTimestamps.filter((t) => now - t <= POWER_WINDOW_MS);
      state.powerTimestamps.push(now);

      if (state.powerTimestamps.length >= 3) {
        state.powerTimestamps = [];
        activateSOS({
          isDemo: false,
          forceSilent: true,
          source: `3x rapid ${event.key} key (Silent SOS)`
        });
      }
    });
  }

  // --- Shake to SOS (DeviceMotionEvent: 3 strong shakes within 1.5s) ---
  function handleDeviceMotion(event) {
    if (!state.settings.shakeEnabled || state.mode !== 'idle') return;

    const acc = event.acceleration && event.acceleration.x !== null
      ? event.acceleration
      : event.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    let strength = 0;
    if (event.acceleration && event.acceleration.x !== null) {
      strength = Math.sqrt(x * x + y * y + z * z);
    } else if (state.lastAccel) {
      const dx = x - state.lastAccel.x;
      const dy = y - state.lastAccel.y;
      const dz = z - state.lastAccel.z;
      strength = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    state.lastAccel = { x, y, z };

    const now = Date.now();
    if (strength >= SHAKE_THRESHOLD && now - state.lastShakeAt >= SHAKE_COOLDOWN_MS) {
      state.lastShakeAt = now;
      state.shakeTimestamps = state.shakeTimestamps.filter((t) => now - t <= SHAKE_WINDOW_MS);
      state.shakeTimestamps.push(now);

      if (state.shakeTimestamps.length >= 3) {
        state.shakeTimestamps = [];
        activateSOS({
          isDemo: false,
          forceSilent: false,
          source: 'Shake to SOS (3 shakes)'
        });
      }
    }
  }

  async function initShakeListener() {
    if (typeof DeviceMotionEvent === 'undefined') return;
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') return;
      } catch {
        return;
      }
    }
    window.removeEventListener('devicemotion', handleDeviceMotion);
    window.addEventListener('devicemotion', handleDeviceMotion);
  }

  // --- Fake Incoming Call Feature ---
  function startRingtone() {
    stopRingtone();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      state.ringCtx = ctx;

      const playRingBurst = () => {
        if (!state.ringCtx) return;
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.setValueAtTime(0.25, now + 1.1);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.2);
        gain.connect(ctx.destination);

        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        o1.type = 'sine';
        o2.type = 'sine';
        o1.frequency.setValueAtTime(440, now);
        o2.frequency.setValueAtTime(480, now);
        o1.connect(gain);
        o2.connect(gain);
        o1.start(now);
        o2.start(now);
        o1.stop(now + 1.25);
        o2.stop(now + 1.25);
      };

      playRingBurst();
      state.ringInterval = setInterval(playRingBurst, 2400);
    } catch {
      // Ignore ringtone error
    }
  }

  function stopRingtone() {
    clearInterval(state.ringInterval);
    state.ringInterval = null;
    try {
      if (state.ringCtx) state.ringCtx.close();
    } catch {
      // Ignore
    }
    state.ringCtx = null;
  }

  function openFakeCallScreen() {
    fakeCallNameEl.textContent = state.fakeCaller;
    fakeCallSubEl.textContent =
      state.fakeCaller === '112 Control Room' ? 'Emergency Dispatch • India' : 'Mobile • India';
    fakeCallTimerEl.textContent = 'Ringing…';
    fakeCallRingActions.classList.remove('hidden');
    fakeCallActiveActions.classList.add('hidden');
    fakeCallScreen.classList.remove('hidden');
    startRingtone();
  }

  function closeFakeCallScreen() {
    clearTimeout(state.fakeCallTimeout);
    clearInterval(state.fakeCallTimerInterval);
    stopRingtone();
    fakeCallScreen.classList.add('hidden');
  }

  function initFakeCallUI() {
    fakeCallOpenBtn.addEventListener('click', () => {
      fakeCallModal.classList.remove('hidden');
    });

    fakeCallCloseBtn.addEventListener('click', () => {
      fakeCallModal.classList.add('hidden');
    });

    fakeCallerChoices.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-caller]');
      if (!btn) return;
      state.fakeCaller = btn.dataset.caller;
      fakeCallerChoices.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });

    fakeDelayChoices.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delay]');
      if (!btn) return;
      state.fakeDelaySec = Number(btn.dataset.delay);
      fakeDelayChoices.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });

    fakeCallStartBtn.addEventListener('click', () => {
      fakeCallModal.classList.add('hidden');
      clearTimeout(state.fakeCallTimeout);
      state.fakeCallTimeout = setTimeout(openFakeCallScreen, state.fakeDelaySec * 1000);
    });

    fakeCallAcceptBtn.addEventListener('click', () => {
      stopRingtone();
      fakeCallRingActions.classList.add('hidden');
      fakeCallActiveActions.classList.remove('hidden');
      state.fakeCallStartedAt = Date.now();
      fakeCallTimerEl.textContent = '00:00';
      clearInterval(state.fakeCallTimerInterval);
      state.fakeCallTimerInterval = setInterval(() => {
        const sec = (Date.now() - state.fakeCallStartedAt) / 1000;
        fakeCallTimerEl.textContent = formatDuration(sec);
      }, 1000);
    });

    fakeCallDeclineBtn.addEventListener('click', closeFakeCallScreen);
    fakeCallEndBtn.addEventListener('click', closeFakeCallScreen);
  }

  // --- Advanced WhatsApp Automation Settings ---
  function renderAdvancedSettings() {
    advWebhookUrl.value = state.advanced.webhookUrl || '';
    advWaPhoneId.value = state.advanced.waPhoneId || '';
    advWaToken.value = state.advanced.waToken || '';
    const configured = Boolean(
      state.advanced.webhookUrl || (state.advanced.waPhoneId && state.advanced.waToken)
    );
    advancedStatusBadge.textContent = configured ? 'Automated + Fallback' : 'Default wa.me';
  }

  // --- Settings Toggles ---
  function syncSettingsUI() {
    toggleVoice.checked = state.settings.voiceEnabled;
    toggleSilent.checked = state.settings.silentMode;
    toggleSiren.checked = state.settings.sirenEnabled;
    toggleShake.checked = state.settings.shakeEnabled;
  }

  function saveSettings() {
    writeJson(STORAGE_SETTINGS, state.settings);
  }

  function bindEvents() {
    sosMainBtn.addEventListener('click', () => {
      activateSOS({ isDemo: false, forceSilent: false, source: 'SOS Tap Button' });
    });

    testSosBtn.addEventListener('click', () => {
      activateSOS({ isDemo: true, forceSilent: false, source: 'Test SOS (Demo)' });
    });

    cancelSosBtn.addEventListener('click', () => {
      deactivateSOS('Cancel Button');
    });

    jumpContactsBtn.addEventListener('click', () => {
      contactsSection.open = true;
      contactsSection.scrollIntoView({ behavior: 'auto', block: 'start' });
      contactNameInput.focus();
    });

    micStatusPill.addEventListener('click', () => {
      state.micDeniedDismissed = false;
      state.settings.voiceEnabled = true;
      toggleVoice.checked = true;
      saveSettings();
      requestMicAndStart();
    });

    gpsStatusPill.addEventListener('click', async () => {
      const res = await captureInitialLocationWithFallback();
      if (res.ok) {
        liveTranscriptEl.textContent = `GPS Ready: ${res.lat}, ${res.lng} (${res.source})`;
      }
    });

    toggleVoice.addEventListener('change', () => {
      state.settings.voiceEnabled = toggleVoice.checked;
      saveSettings();
      if (state.settings.voiceEnabled) {
        requestMicAndStart();
      } else {
        stopSpeechRecognition();
      }
    });

    toggleSilent.addEventListener('change', () => {
      state.settings.silentMode = toggleSilent.checked;
      saveSettings();
    });

    toggleSiren.addEventListener('change', () => {
      state.settings.sirenEnabled = toggleSiren.checked;
      saveSettings();
    });

    toggleShake.addEventListener('change', () => {
      state.settings.shakeEnabled = toggleShake.checked;
      saveSettings();
      if (state.settings.shakeEnabled) {
        initShakeListener();
      }
    });

    contactForm.addEventListener('submit', handleContactSubmit);
    contactCancelEditBtn.addEventListener('click', resetContactForm);

    clearLogBtn.addEventListener('click', () => {
      state.logs = [];
      writeJson(STORAGE_LOG, []);
      renderIncidentLog();
    });

    advancedForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.advanced = {
        webhookUrl: advWebhookUrl.value.trim(),
        waPhoneId: advWaPhoneId.value.trim(),
        waToken: advWaToken.value.trim()
      };
      writeJson(STORAGE_ADVANCED, state.advanced);
      renderAdvancedSettings();
      advSaveStatus.textContent = 'Advanced settings saved.';
      advSaveStatus.classList.remove('hidden');
      setTimeout(() => advSaveStatus.classList.add('hidden'), 2500);
    });

    advClearBtn.addEventListener('click', () => {
      state.advanced = { webhookUrl: '', waPhoneId: '', waToken: '' };
      writeJson(STORAGE_ADVANCED, state.advanced);
      renderAdvancedSettings();
      advSaveStatus.textContent = 'Reset to default wa.me links.';
      advSaveStatus.classList.remove('hidden');
      setTimeout(() => advSaveStatus.classList.add('hidden'), 2500);
    });

    micRetryOverlayBtn.addEventListener('click', () => {
      state.micDeniedDismissed = false;
      requestMicAndStart();
    });

    micContinueWithoutBtn.addEventListener('click', () => {
      state.micDeniedDismissed = true;
      micDeniedOverlay.classList.add('hidden');
    });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  // --- Bootstrap ---
  async function init() {
    state.contacts = readJson(STORAGE_CONTACTS, []);
    if (!Array.isArray(state.contacts)) state.contacts = [];
    state.contacts = state.contacts.slice(0, 3);

    const savedSettings = readJson(STORAGE_SETTINGS, {});
    state.settings = { ...state.settings, ...savedSettings };

    const savedAdvanced = readJson(STORAGE_ADVANCED, {});
    state.advanced = { ...state.advanced, ...savedAdvanced };

    state.logs = readJson(STORAGE_LOG, []);
    if (!Array.isArray(state.logs)) state.logs = [];

    syncSettingsUI();
    renderContacts();
    renderIncidentLog();
    renderAdvancedSettings();

    initInstallBanner();
    initFakeCallUI();
    initSilentTriggers();
    bindEvents();

    if (state.contacts.length === 0) {
      contactsSection.open = true;
    }

    state.clips = await loadClipsFromDB();
    renderVault();

    await probePermissionsOnLoad();

    if (state.settings.shakeEnabled) {
      initShakeListener();
    }
    if (state.settings.voiceEnabled) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
  }

  init();
})();
