'use strict';

// ─────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────
const TRANSLATIONS = {
  ru: {
    tagline:            'Зашифрованная P2P передача файлов',
    connection:         'Соединение',
    file_transfer:      'Передача файлов',
    history:            'История передач',
    stat_session:       'Сессия',
    stat_transferred:   'Передано',
    stat_ping:          'Пинг',
    stat_quality:       'Качество',
    aes256:             'AES-256',
    password_label:     'Пароль (необязательно)',
    password_placeholder: 'Дополнительная защита',
    create_room:        'Создать комнату',
    join_room:          'Войти',
    copy:               'Копировать',
    submit:             'Подтвердить',
    status:             'Статус:',
    connected_for:      'Соединение:',
    multi:              'Несколько файлов',
    drop_text:          'Перетащите файл(ы) сюда',
    drop_sub:           'или нажмите для выбора',
    send:               'Отправить зашифрованно',
    qr_hint:            'Гость сканирует QR вместо copy-paste:',
    no_history:         'История пуста',
    clear:              'Очистить',
    link_expires:       'Ссылка удалится через:',
    offer_label:        '📋 Скопируйте OFFER и отправьте гостю:',
    answer_label:       '📋 Скопируйте ANSWER и отправьте хосту:',
    paste_offer:        '📥 Вставьте OFFER от хоста:',
    paste_answer:       '📥 Вставьте ANSWER от гостя:',
    gathering:          '🔄 Сбор ICE кандидатов…',
    connecting_state:   '🔄 Установка соединения…',
    connected_state:    '✅ Соединение установлено!',
    disconnected_state: '⚠️ Отключено',
    failed_state:       '❌ Ошибка соединения',
    receiving:          '📥 Получение файла…',
    decrypting:         '🔓 Расшифровка…',
    file_received:      '✅ Файл получен!',
    sent_ok:            '✅ Отправлено',
    ready:              '✅ Готов к передаче',
    idle:               'Ожидание',
    wrong_sdp:          '⚠️ Неверный формат SDP',
    wrong_password:     '❌ Неверный пароль!',
    sdp_error:          '❌ Ошибка SDP: ',
    chunk_progress:     'чанков',
    download:           '⬇ Скачать',
    sent_badge:         'Отправлен',
    recv_badge:         'Получен',
    decrypting_chunks:  'Расшифровка чанков…',
    restarting_ice:     '🔄 Перезапуск ICE…',
  },
  en: {
    tagline:            'Encrypted browser-to-browser file transfer',
    connection:         'Connection',
    file_transfer:      'File Transfer',
    history:            'Transfer History',
    stat_session:       'Session',
    stat_transferred:   'Transferred',
    stat_ping:          'Ping',
    stat_quality:       'Quality',
    aes256:             'AES-256',
    password_label:     'Password (optional)',
    password_placeholder: 'Extra protection',
    create_room:        'Create Room',
    join_room:          'Join Room',
    copy:               'Copy',
    submit:             'Submit',
    status:             'Status:',
    connected_for:      'Connected for:',
    multi:              'Multiple files',
    drop_text:          'Drag & Drop file(s) here',
    drop_sub:           'or click to select',
    send:               'Send Encrypted',
    qr_hint:            'Guest can scan QR instead of copy-paste:',
    no_history:         'No history yet',
    clear:              'Clear',
    link_expires:       'Link expires in:',
    offer_label:        '📋 Copy OFFER and send to guest:',
    answer_label:       '📋 Copy ANSWER and send to host:',
    paste_offer:        '📥 Paste OFFER from host:',
    paste_answer:       '📥 Paste ANSWER from guest:',
    gathering:          '🔄 Gathering ICE candidates…',
    connecting_state:   '🔄 Establishing connection…',
    connected_state:    '✅ Connected!',
    disconnected_state: '⚠️ Disconnected',
    failed_state:       '❌ Connection failed',
    receiving:          '📥 Receiving file…',
    decrypting:         '🔓 Decrypting…',
    file_received:      '✅ File received!',
    sent_ok:            '✅ Sent',
    ready:              '✅ Ready to transfer',
    idle:               'Idle',
    wrong_sdp:          '⚠️ Invalid SDP format',
    wrong_password:     '❌ Wrong password!',
    sdp_error:          '❌ SDP error: ',
    chunk_progress:     'chunks',
    download:           '⬇ Download',
    sent_badge:         'Sent',
    recv_badge:         'Received',
    decrypting_chunks:  'Decrypting chunks…',
    restarting_ice:     '🔄 Restarting ICE…',
  }
};

let lang = 'ru';

function t(key) {
  return TRANSLATIONS[lang][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

// ─────────────────────────────────────────────
// DOM
// ─────────────────────────────────────────────
const createRoomBtn   = document.getElementById('createRoomBtn');
const joinRoomBtn     = document.getElementById('joinRoomBtn');
const statusText      = document.getElementById('statusText');
const statusDot       = document.getElementById('statusDot');
const sdpBox          = document.getElementById('sdpBox');
const sdpLabel        = document.getElementById('sdpLabel');
const sdpOutput       = document.getElementById('sdpOutput');
const copySdpBtn      = document.getElementById('copySdpBtn');
const submitSdpBtn    = document.getElementById('submitSdpBtn');
const dropZone        = document.getElementById('dropZone');
const fileInput       = document.getElementById('fileInput');
const fileList        = document.getElementById('fileList');
const sendBtn         = document.getElementById('sendBtn');
const pauseBtn        = document.getElementById('pauseBtn');
const pauseIcon       = document.getElementById('pauseIcon');
const progressSection = document.getElementById('progressSection');
const progressBar     = document.getElementById('progressBar');
const progressLabel   = document.getElementById('progressLabel');
const speedLabel      = document.getElementById('speedLabel');
const etaLabel        = document.getElementById('etaLabel');
const transferInfo    = document.getElementById('transferInfo');
const downloadArea    = document.getElementById('downloadArea');
const autoDeleteRow   = document.getElementById('autoDeleteRow');
const autoDeleteTimer = document.getElementById('autoDeleteTimer');
const historyList     = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const sessionTimeEl   = document.getElementById('sessionTime');
const totalTransEl    = document.getElementById('totalTransferred');
const pingValueEl     = document.getElementById('pingValue');
const connQualityEl   = document.getElementById('connQuality');
const connTimerRow    = document.getElementById('connTimerRow');
const connTimerEl     = document.getElementById('connTimer');
const themeBtn        = document.getElementById('themeBtn');
const themeIcon       = document.getElementById('themeIcon');
const langBtn         = document.getElementById('langBtn');
const langLabel       = document.getElementById('langLabel');
const passwordInput   = document.getElementById('passwordInput');
const togglePwdBtn    = document.getElementById('togglePwdBtn');
const qrSection       = document.getElementById('qrSection');
const qrCodeEl        = document.getElementById('qrCode');

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let pc             = null;
let dc             = null;
let isHost         = false;
let selectedFiles  = [];  // Array of File objects
let recvMeta       = null;
let recvChunks     = [];
let sendPaused     = false;
let sendCancelled  = false;
let sdpMode        = null;

// Stats
let sessionStart   = Date.now();
let connStart      = null;
let totalBytesTransferred = 0;
let sessionTimerID = null;
let connTimerID    = null;
let pingTimerID    = null;
let lastPingTime   = 0;
let autoDeleteID   = null;

// Transfer speed tracking
let speedSamples   = [];
let lastOffset     = 0;
let lastSpeedTime  = 0;

// ─────────────────────────────────────────────
// ICE Config
// ─────────────────────────────────────────────
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls:       'turn:openrelay.metered.ca:80',
      username:   'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls:       'turn:openrelay.metered.ca:443',
      username:   'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls:       'turn:openrelay.metered.ca:443?transport=tcp',
      username:   'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

const CHUNK_SIZE    = 16 * 1024;
const LINK_TTL_SEC  = 300; // 5 minutes

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function setStatus(msg, dotClass = '') {
  statusText.textContent = msg;
  statusDot.className    = 'status-dot ' + dotClass;
}

function formatBytes(b) {
  if (b < 1024)      return b + ' B';
  if (b < 1048576)   return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼',
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵',
    zip: '📦', rar: '📦', '7z': '📦',
    doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    txt: '📃', js: '💻', ts: '💻', html: '💻', css: '💻', py: '💻',
  };
  return map[ext] || '📁';
}

function isImageFile(name) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}

// ─────────────────────────────────────────────
// Toast notifications
// ─────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const icons = { info: 'ℹ️', success: '✅', error: '❌' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ─────────────────────────────────────────────
// Notification + Sound
// ─────────────────────────────────────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🔒' });
  }
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  playBeep();
}

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// ─────────────────────────────────────────────
// Session Timer
// ─────────────────────────────────────────────
function startSessionTimer() {
  sessionStart = Date.now();
  clearInterval(sessionTimerID);
  sessionTimerID = setInterval(() => {
    sessionTimeEl.textContent = formatTime((Date.now() - sessionStart) / 1000);
  }, 1000);
}

function startConnTimer() {
  connStart = Date.now();
  connTimerRow.style.display = 'flex';
  clearInterval(connTimerID);
  connTimerID = setInterval(() => {
    connTimerEl.textContent = formatTime((Date.now() - connStart) / 1000);
  }, 1000);
}

function stopConnTimer() {
  clearInterval(connTimerID);
  connTimerRow.style.display = 'none';
}

// ─────────────────────────────────────────────
// Ping / Connection Quality
// ─────────────────────────────────────────────
function startPingLoop() {
  clearInterval(pingTimerID);
  pingTimerID = setInterval(() => {
    if (dc && dc.readyState === 'open') {
      lastPingTime = Date.now();
      dc.send(JSON.stringify({ type: 'ping', t: lastPingTime }));
    }
  }, 3000);
}

function handlePong(latency) {
  pingValueEl.textContent = latency + 'ms';
  let quality, color;
  if (latency < 80)       { quality = '🟢 Отлично'; }
  else if (latency < 200) { quality = '🟡 Хорошо';  }
  else                    { quality = '🔴 Слабое';  }
  connQualityEl.textContent = quality;
}

// ─────────────────────────────────────────────
// Auto-delete download link
// ─────────────────────────────────────────────
function startAutoDelete(callback) {
  let remaining = LINK_TTL_SEC;
  autoDeleteRow.style.display = 'flex';
  clearInterval(autoDeleteID);
  autoDeleteID = setInterval(() => {
    remaining--;
    autoDeleteTimer.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(autoDeleteID);
      autoDeleteRow.style.display = 'none';
      callback();
    }
  }, 1000);
}

// ─────────────────────────────────────────────
// History
// ─────────────────────────────────────────────
function addHistory(name, size, direction, time) {
  const empty = historyList.querySelector('.empty-hint');
  if (empty) empty.remove();

  const item = document.createElement('div');
  item.className = 'history-item';
  const isSent = direction === 'sent';
  item.innerHTML = `
    <span class="history-icon">${fileIcon(name)}</span>
    <div class="history-info">
      <div class="history-name">${name}</div>
      <div class="history-meta">${formatBytes(size)} · ${time}</div>
    </div>
    <span class="history-badge ${isSent ? 'badge-sent' : 'badge-received'}">
      ${isSent ? t('sent_badge') : t('recv_badge')}
    </span>
  `;
  historyList.prepend(item);
}

clearHistoryBtn.addEventListener('click', () => {
  historyList.innerHTML = `<p class="empty-hint">${t('no_history')}</p>`;
});

// ─────────────────────────────────────────────
// Password helpers
// ─────────────────────────────────────────────
togglePwdBtn.addEventListener('click', () => {
  const isPass = passwordInput.type === 'password';
  passwordInput.type = isPass ? 'text' : 'password';
  togglePwdBtn.textContent = isPass ? '🙈' : '👁';
});

async function hashPassword(pwd) {
  const enc  = new TextEncoder().encode(pwd);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ─────────────────────────────────────────────
// QR Code
// ─────────────────────────────────────────────
function showQR(text) {
  qrCodeEl.innerHTML = '';
  if (typeof QRCode !== 'undefined' && text.length <= 2953) {
    try {
      new QRCode(qrCodeEl, {
        text,
        width:  160,
        height: 160,
        colorDark:  '#000000',
        colorLight: '#ffffff',
      });
      qrSection.style.display = 'block';
    } catch {}
  }
}

// ─────────────────────────────────────────────
// AES-GCM
// ─────────────────────────────────────────────
async function generateKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(raw));
}

async function importKey(arr) {
  return crypto.subtle.importKey('raw', new Uint8Array(arr), { name: 'AES-GCM' }, false, ['decrypt']);
}

async function encryptChunk(buffer, key) {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
  const out = new Uint8Array(12 + encrypted.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(encrypted), 12);
  return out.buffer;
}

async function decryptChunk(buffer, key) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(buffer.slice(0, 12)) },
    key,
    buffer.slice(12)
  );
}

// ─────────────────────────────────────────────
// WebRTC
// ─────────────────────────────────────────────
function createPeerConnection() {
  if (pc) { pc.close(); dc = null; }
  pc = new RTCPeerConnection(RTC_CONFIG);

  pc.onicecandidate = (e) => {
    if (e.candidate) return;
    const sdp = JSON.stringify(pc.localDescription);
    if (isHost) {
      showSdp(t('offer_label'), sdp, 'offer-ready');
      showQR(sdp);
    } else {
      showSdp(t('answer_label'), sdp, 'answer-ready');
    }
  };

  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    if (state === 'checking')     setStatus(t('connecting_state'), 'connecting');
    if (state === 'connected' || state === 'completed') {
      setStatus(t('connected_state'), 'connected');
      sdpBox.style.display = 'none';
      qrSection.style.display = 'none';
      sendBtn.disabled = selectedFiles.length === 0;
      startConnTimer();
      startPingLoop();
      showToast(t('connected_state'), 'success');
    }
    if (state === 'disconnected') { setStatus(t('disconnected_state'), ''); stopConnTimer(); }
    if (state === 'failed') {
      setStatus(t('failed_state'), 'failed');
      stopConnTimer();
      pc.restartIce();
      setStatus(t('restarting_ice'), 'connecting');
    }
    if (state === 'closed') stopConnTimer();
  };

  pc.ondatachannel = (e) => setupDataChannel(e.channel);
}

function setupDataChannel(channel) {
  dc = channel;
  dc.binaryType = 'arraybuffer';
  dc.onopen    = () => {
    setStatus(t('ready'), 'connected');
    sendBtn.disabled = selectedFiles.length === 0;
    requestNotificationPermission();
  };
  dc.onclose   = () => { setStatus(t('idle')); sendBtn.disabled = true; stopConnTimer(); };
  dc.onerror   = (e) => { setStatus('❌ ' + (e.error?.message || 'Error')); showToast('❌ DataChannel error', 'error'); };
  dc.onmessage = (e) => handleIncoming(e.data);
}

// ─────────────────────────────────────────────
// SDP UI
// ─────────────────────────────────────────────
function showSdp(label, value, mode) {
  sdpMode              = mode;
  sdpLabel.textContent = label;
  sdpOutput.value      = value || '';
  sdpOutput.readOnly   = !!value;
  sdpBox.style.display = 'block';
  submitSdpBtn.style.display =
    (mode === 'paste-offer' || mode === 'paste-answer') ? 'inline-flex' : 'none';
}

copySdpBtn.addEventListener('click', async () => {
  if (!sdpOutput.value) return;
  await navigator.clipboard.writeText(sdpOutput.value);
  copySdpBtn.querySelector('span:last-child').textContent = '✅';
  setTimeout(() => copySdpBtn.querySelector('span:last-child').textContent = t('copy'), 2000);
  showToast('SDP скопирован!', 'success');

  if (sdpMode === 'offer-ready') {
    showSdp(t('paste_answer'), '', 'paste-answer');
    qrSection.style.display = 'none';
  }
});

submitSdpBtn.addEventListener('click', async () => {
  const raw = sdpOutput.value.trim();
  if (!raw) return;

  let desc;
  try { desc = JSON.parse(raw); }
  catch { showToast(t('wrong_sdp'), 'error'); return; }

  try {
    if (sdpMode === 'paste-offer') {
      await pc.setRemoteDescription(desc);

      // Password verification if set
      const pwdHash = passwordInput.value ? await hashPassword(passwordInput.value) : '';
      if (desc.pwdHash && desc.pwdHash !== pwdHash) {
        showToast(t('wrong_password'), 'error');
        return;
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setStatus(t('gathering'), 'connecting');
    } else if (sdpMode === 'paste-answer') {
      await pc.setRemoteDescription(desc);
      setStatus(t('connecting_state'), 'connecting');
      sdpBox.style.display = 'none';
    }
  } catch (err) {
    showToast(t('sdp_error') + err.message, 'error');
  }
});

// ─────────────────────────────────────────────
// Create / Join
// ─────────────────────────────────────────────
createRoomBtn.addEventListener('click', async () => {
  isHost = true;
  createPeerConnection();

  dc = pc.createDataChannel('file-transfer', { ordered: true });
  setupDataChannel(dc);

  const offer = await pc.createOffer();

  // Embed password hash into SDP if set
  const pwdHash = passwordInput.value ? await hashPassword(passwordInput.value) : '';
  const sdpWithPwd = { ...offer, pwdHash };

  await pc.setLocalDescription(offer);
  setStatus(t('gathering'), 'connecting');
});

joinRoomBtn.addEventListener('click', () => {
  isHost = false;
  createPeerConnection();
  showSdp(t('paste_offer'), '', 'paste-offer');
});

// ─────────────────────────────────────────────
// File Selection
// ─────────────────────────────────────────────
const multiToggle = document.getElementById('multiToggle');

multiToggle.addEventListener('change', () => {
  fileInput.multiple = multiToggle.checked;
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files);
  if (files.length) addFiles(files);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) addFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

function addFiles(files) {
  files.forEach(f => {
    if (!multiToggle.checked) selectedFiles = [];
    selectedFiles.push(f);
  });
  renderFileList();
  sendBtn.disabled = !(dc && dc.readyState === 'open') || selectedFiles.length === 0;
}

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="file-item-icon">${fileIcon(f.name)}</span>
      <span class="file-item-name">${f.name}</span>
      <span class="file-item-size">${formatBytes(f.size)}</span>
      <button class="file-item-remove" data-idx="${i}">✕</button>
    `;
    fileList.appendChild(item);
  });

  fileList.querySelectorAll('.file-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedFiles.splice(+btn.dataset.idx, 1);
      renderFileList();
      sendBtn.disabled = !(dc && dc.readyState === 'open') || selectedFiles.length === 0;
    });
  });
}

// ─────────────────────────────────────────────
// Pause / Resume
// ─────────────────────────────────────────────
pauseBtn.addEventListener('click', () => {
  sendPaused = !sendPaused;
  pauseIcon.textContent = sendPaused ? '▶️' : '⏸';
  showToast(sendPaused ? 'Пауза' : 'Продолжение...', 'info');
});

// ─────────────────────────────────────────────
// Send Files
// ─────────────────────────────────────────────
sendBtn.addEventListener('click', async () => {
  if (!selectedFiles.length || !dc || dc.readyState !== 'open') return;

  sendBtn.disabled    = true;
  pauseBtn.style.display = 'inline-flex';
  sendPaused          = false;
  sendCancelled       = false;

  for (let fi = 0; fi < selectedFiles.length; fi++) {
    if (sendCancelled) break;
    await sendSingleFile(selectedFiles[fi]);
  }

  pauseBtn.style.display = 'none';
  sendBtn.disabled       = false;
});

async function sendSingleFile(file) {
  const key         = await generateKey();
  const exportedKey = await exportKey(key);
  const buffer      = await file.arrayBuffer();
  const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

  progressSection.style.display = 'block';
  progressBar.style.width       = '0%';
  downloadArea.innerHTML        = '';

  dc.send(JSON.stringify({
    type:   'file-meta',
    name:   file.name,
    size:   buffer.byteLength,
    chunks: totalChunks,
    key:    exportedKey
  }));

  let chunkIndex   = 0;
  let offset       = 0;
  lastOffset       = 0;
  lastSpeedTime    = Date.now();
  speedSamples     = [];

  await new Promise(resolve => {
    async function sendNextChunk() {
      if (sendCancelled) { resolve(); return; }

      if (sendPaused) {
        setTimeout(sendNextChunk, 200);
        return;
      }

      if (offset >= buffer.byteLength) {
        dc.send(JSON.stringify({ type: 'file-end', name: file.name }));
        progressBar.style.width = '100%';
        progressLabel.textContent = '100%';
        transferInfo.textContent  = `${t('sent_ok')} ${formatBytes(buffer.byteLength)}`;
        speedLabel.textContent    = '';
        etaLabel.textContent      = '';
        totalBytesTransferred    += buffer.byteLength;
        totalTransEl.textContent  = formatBytes(totalBytesTransferred);
        addHistory(file.name, file.size, 'sent', new Date().toLocaleTimeString());
        showToast(`${t('sent_ok')}: ${file.name}`, 'success');
        sendNotification('SecureShare', `${t('sent_ok')}: ${file.name}`);
        resolve();
        return;
      }

      if (dc.bufferedAmount > 4 * CHUNK_SIZE) {
        setTimeout(sendNextChunk, 30);
        return;
      }

      const slice     = buffer.slice(offset, offset + CHUNK_SIZE);
      const encrypted = await encryptChunk(slice, key);
      dc.send(encrypted);

      offset     += CHUNK_SIZE;
      chunkIndex += 1;

      // Speed calc
      const now      = Date.now();
      const elapsed  = (now - lastSpeedTime) / 1000;
      if (elapsed >= 0.5) {
        const bytesDelta = offset - lastOffset;
        const speed      = bytesDelta / elapsed;
        speedSamples.push(speed);
        if (speedSamples.length > 5) speedSamples.shift();
        const avgSpeed    = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
        const remaining   = buffer.byteLength - offset;
        const etaSec      = avgSpeed > 0 ? remaining / avgSpeed : 0;
        speedLabel.textContent = formatBytes(avgSpeed) + '/s';
        etaLabel.textContent   = etaSec > 0 ? 'ETA: ' + formatTime(etaSec) : '';
        lastOffset    = offset;
        lastSpeedTime = now;
      }

      const pct = Math.min((offset / buffer.byteLength) * 100, 100);
      progressBar.style.width = `${pct}%`;
      progressLabel.textContent = Math.round(pct) + '%';
      transferInfo.textContent  =
        `📤 ${chunkIndex}/${totalChunks} ${t('chunk_progress')} · ${formatBytes(Math.min(offset, buffer.byteLength))} / ${formatBytes(buffer.byteLength)}`;

      setTimeout(sendNextChunk, 0);
    }

    sendNextChunk();
  });
}

// ─────────────────────────────────────────────
// Receive
// ─────────────────────────────────────────────
async function handleIncoming(data) {
  if (typeof data === 'string') {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    // Ping / Pong
    if (msg.type === 'ping') {
      dc.send(JSON.stringify({ type: 'pong', t: msg.t }));
      return;
    }
    if (msg.type === 'pong') {
      handlePong(Date.now() - msg.t);
      return;
    }

    if (msg.type === 'file-meta') {
      recvMeta             = msg;
      recvMeta.cryptoKey   = await importKey(msg.key);
      recvChunks           = [];
      progressSection.style.display = 'block';
      progressBar.style.width       = '0%';
      downloadArea.innerHTML        = '';
      autoDeleteRow.style.display   = 'none';
      clearInterval(autoDeleteID);
      transferInfo.textContent = `📥 ${msg.name} (${formatBytes(msg.size)})`;
      setStatus(t('receiving'), 'connecting');
    }

    if (msg.type === 'file-end') {
      progressBar.style.width = '100%';
      await assembleFile();
    }
    return;
  }

  // Binary chunk
  if (!recvMeta) return;
  const buf = (data instanceof ArrayBuffer) ? data : await data.arrayBuffer();
  recvChunks.push(buf);

  const pct = Math.min((recvChunks.length / recvMeta.chunks) * 100, 99);
  progressBar.style.width   = `${pct}%`;
  progressLabel.textContent = Math.round(pct) + '%';
  transferInfo.textContent  = `📥 ${recvChunks.length}/${recvMeta.chunks} ${t('chunk_progress')}`;
}

// ─────────────────────────────────────────────
// Assemble & offer download
// ─────────────────────────────────────────────
async function assembleFile() {
  setStatus(t('decrypting'), 'connecting');
  transferInfo.textContent = t('decrypting_chunks');

  const decrypted = [];
  for (const buf of recvChunks) {
    decrypted.push(await decryptChunk(buf, recvMeta.cryptoKey));
  }

  const totalBytes = decrypted.reduce((s, b) => s + b.byteLength, 0);
  const merged     = new Uint8Array(totalBytes);
  let offset = 0;
  for (const part of decrypted) {
    merged.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }

  const blob     = new Blob([merged]);
  const url      = URL.createObjectURL(blob);
  const fileName = recvMeta.name;

  const item = document.createElement('div');
  item.className = 'download-item';

  // Image preview
  if (isImageFile(fileName)) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = fileName;
    item.appendChild(img);
  }

  const link = document.createElement('a');
  link.href      = url;
  link.download  = fileName;
  link.className = 'download-link';
  link.innerHTML = `${t('download')} ${fileIcon(fileName)} ${fileName} (${formatBytes(totalBytes)})`;
  item.appendChild(link);
  downloadArea.appendChild(item);

  totalBytesTransferred   += totalBytes;
  totalTransEl.textContent = formatBytes(totalBytesTransferred);
  transferInfo.textContent = `✅ ${formatBytes(totalBytes)}`;
  progressLabel.textContent = '100%';
  setStatus(t('file_received'), 'connected');

  addHistory(fileName, totalBytes, 'received', new Date().toLocaleTimeString());
  sendNotification('SecureShare P2P', `${t('file_received')} ${fileName}`);
  showToast(`${t('file_received')} ${fileName}`, 'success');

  // Auto-delete link after TTL
  startAutoDelete(() => {
    URL.revokeObjectURL(url);
    item.remove();
    showToast('🗑 Ссылка удалена', 'info');
  });

  recvMeta   = null;
  recvChunks = [];
}

// ─────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Auto theme from system
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const savedTheme  = localStorage.getItem('theme');
applyTheme(savedTheme || (prefersDark.matches ? 'dark' : 'light'));
prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
});

// ─────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────
langBtn.addEventListener('click', () => {
  lang = lang === 'ru' ? 'en' : 'ru';
  langLabel.textContent = lang === 'ru' ? 'EN' : 'RU';
  localStorage.setItem('lang', lang);
  applyTranslations();
});

// Init lang
lang = localStorage.getItem('lang') || 'ru';
langLabel.textContent = lang === 'ru' ? 'EN' : 'RU';

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
applyTranslations();
startSessionTimer();
setStatus(t('idle'));
