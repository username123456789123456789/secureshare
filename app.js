'use strict';

// ─────────────────────────────────────────────
// DOM
// ─────────────────────────────────────────────
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn   = document.getElementById('joinRoomBtn');
const statusText    = document.getElementById('statusText');
const sdpBox        = document.getElementById('sdpBox');
const sdpLabel      = document.getElementById('sdpLabel');
const sdpOutput     = document.getElementById('sdpOutput');
const copySdpBtn    = document.getElementById('copySdpBtn');
const submitSdpBtn  = document.getElementById('submitSdpBtn');
const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const selectedFile  = document.getElementById('selectedFile');
const sendBtn       = document.getElementById('sendBtn');
const progressBar   = document.getElementById('progressBar');
const transferInfo  = document.getElementById('transferInfo');
const downloadArea  = document.getElementById('downloadArea');

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let pc             = null;
let dc             = null;
let isHost         = false;
let selected       = null;
let recvMeta       = null;
let recvChunks     = [];
let recvBytes      = 0;

// ─────────────────────────────────────────────
// ICE Config — STUN + TURN (пробивает любой NAT)
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

const CHUNK_SIZE = 16 * 1024;

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function setStatus(msg) {
  statusText.textContent = msg;
}

function formatBytes(b) {
  if (b < 1024)       return b + ' B';
  if (b < 1024 ** 2)  return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 ** 2).toFixed(2) + ' MB';
}

// ─────────────────────────────────────────────
// AES-GCM
// ─────────────────────────────────────────────
async function generateKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(raw));
}

async function importKey(arr) {
  return crypto.subtle.importKey(
    'raw',
    new Uint8Array(arr),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

async function encryptChunk(buffer, key) {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    buffer
  );
  const out = new Uint8Array(12 + encrypted.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(encrypted), 12);
  return out.buffer;
}

async function decryptChunk(buffer, key) {
  const iv        = buffer.slice(0, 12);
  const encrypted = buffer.slice(12);
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encrypted
  );
}

// ─────────────────────────────────────────────
// WebRTC
// ─────────────────────────────────────────────
function createPeerConnection() {
  if (pc) { pc.close(); dc = null; }

  pc = new RTCPeerConnection(RTC_CONFIG);

  pc.onicecandidate = (e) => {
    if (e.candidate) return; // ждём конца сбора

    const sdp = JSON.stringify(pc.localDescription);
    if (isHost) {
      showSdp('📋 Скопируйте OFFER и отправьте гостю:', sdp, 'offer-ready');
    } else {
      showSdp('📋 Скопируйте ANSWER и отправьте хосту:', sdp, 'answer-ready');
    }
  };

  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    const labels = {
      checking:     '🔄 Проверка соединения…',
      connected:    '✅ Connected!',
      completed:    '✅ Connected!',
      disconnected: '⚠️ Disconnected',
      failed:       '❌ Connection failed — попробуйте снова',
      closed:       '🔒 Closed'
    };
    if (labels[state]) setStatus(labels[state]);

    if (state === 'connected' || state === 'completed') {
      sdpBox.style.display = 'none';
      sendBtn.disabled = !selected;
    }

    // Автоперезапуск ICE при сбое
    if (state === 'failed') {
      pc.restartIce();
      setStatus('🔄 Перезапуск ICE…');
    }
  };

  pc.ondatachannel = (e) => setupDataChannel(e.channel);
}

function setupDataChannel(channel) {
  dc = channel;
  dc.binaryType = 'arraybuffer';

  dc.onopen  = () => {
    setStatus('✅ Connected! Готов к передаче.');
    sendBtn.disabled = !selected;
  };
  dc.onclose = () => {
    setStatus('Соединение закрыто');
    sendBtn.disabled = true;
  };
  dc.onerror = (e) => setStatus('❌ Ошибка: ' + (e.error?.message || e));
  dc.onmessage = (e) => handleIncoming(e.data);
}

// ─────────────────────────────────────────────
// SDP UI
// ─────────────────────────────────────────────
let sdpMode = null;

function showSdp(label, value, mode) {
  sdpMode              = mode;
  sdpLabel.textContent = label;
  sdpOutput.value      = value || '';
  sdpOutput.readOnly   = !!value;
  sdpBox.style.display = 'block';
  submitSdpBtn.style.display =
    (mode === 'paste-offer' || mode === 'paste-answer') ? 'inline-block' : 'none';
}

copySdpBtn.addEventListener('click', async () => {
  if (!sdpOutput.value) return;
  await navigator.clipboard.writeText(sdpOutput.value);
  copySdpBtn.textContent = '✅ Copied!';
  setTimeout(() => (copySdpBtn.textContent = '📋 Copy'), 2000);

  if (sdpMode === 'offer-ready') {
    showSdp('📥 Вставьте ANSWER от гостя:', '', 'paste-answer');
  }
});

submitSdpBtn.addEventListener('click', async () => {
  const raw = sdpOutput.value.trim();
  if (!raw) return;

  let desc;
  try {
    desc = JSON.parse(raw);
  } catch {
    alert('⚠️ Неверный формат — вставьте текст целиком.');
    return;
  }

  try {
    if (sdpMode === 'paste-offer') {
      await pc.setRemoteDescription(desc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setStatus('🔄 Сбор ICE кандидатов…');
    } else if (sdpMode === 'paste-answer') {
      await pc.setRemoteDescription(desc);
      setStatus('🔄 Установка соединения…');
      sdpBox.style.display = 'none';
    }
  } catch (err) {
    alert('❌ Ошибка SDP: ' + err.message);
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
  await pc.setLocalDescription(offer);
  setStatus('🔄 Сбор ICE кандидатов…');
});

joinRoomBtn.addEventListener('click', () => {
  isHost = false;
  createPeerConnection();
  showSdp('📥 Вставьте OFFER от хоста:', '', 'paste-offer');
});

// ─────────────────────────────────────────────
// File Selection
// ─────────────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) pickFile(fileInput.files[0]);
});

function pickFile(file) {
  selected = file;
  selectedFile.textContent = `📄 ${file.name} — ${formatBytes(file.size)}`;
  sendBtn.disabled = !(dc && dc.readyState === 'open');
}

// ─────────────────────────────────────────────
// Send
// ─────────────────────────────────────────────
sendBtn.addEventListener('click', async () => {
  if (!selected || !dc || dc.readyState !== 'open') return;

  sendBtn.disabled = true;
  progressBar.style.width = '0%';
  downloadArea.innerHTML  = '';

  const key         = await generateKey();
  const exportedKey = await exportKey(key);
  const buffer      = await selected.arrayBuffer();
  const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

  dc.send(JSON.stringify({
    type:   'file-meta',
    name:   selected.name,
    size:   buffer.byteLength,
    chunks: totalChunks,
    key:    exportedKey
  }));

  let chunkIndex = 0;
  let offset     = 0;

  async function sendNextChunk() {
    if (offset >= buffer.byteLength) {
      dc.send(JSON.stringify({ type: 'file-end' }));
      progressBar.style.width  = '100%';
      transferInfo.textContent = `✅ Отправлено ${formatBytes(buffer.byteLength)}`;
      sendBtn.disabled = false;
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

    const pct = Math.min((offset / buffer.byteLength) * 100, 100);
    progressBar.style.width  = `${pct}%`;
    transferInfo.textContent =
      `📤 ${chunkIndex}/${totalChunks} чанков (${formatBytes(Math.min(offset, buffer.byteLength))} / ${formatBytes(buffer.byteLength)})`;

    setTimeout(sendNextChunk, 0);
  }

  sendNextChunk();
});

// ─────────────────────────────────────────────
// Receive
// ─────────────────────────────────────────────
async function handleIncoming(data) {
  if (typeof data === 'string') {
    const msg = JSON.parse(data);

    if (msg.type === 'file-meta') {
      recvMeta             = msg;
      recvMeta.cryptoKey   = await importKey(msg.key);
      recvChunks           = [];
      recvBytes            = 0;
      progressBar.style.width  = '0%';
      downloadArea.innerHTML   = '';
      transferInfo.textContent = `📥 Получение: ${msg.name} (${formatBytes(msg.size)})`;
      setStatus('📥 Получение файла…');
    }

    if (msg.type === 'file-end') {
      progressBar.style.width = '100%';
      await assembleFile();
    }
    return;
  }

  if (!recvMeta) return;
  const buf = (data instanceof ArrayBuffer) ? data : await data.arrayBuffer();
  recvChunks.push(buf);
  recvBytes += buf.byteLength;

  const pct = Math.min((recvChunks.length / recvMeta.chunks) * 100, 99);
  progressBar.style.width  = `${pct}%`;
  transferInfo.textContent =
    `📥 ${recvChunks.length}/${recvMeta.chunks} чанков получено`;
}

async function assembleFile() {
  setStatus('🔓 Расшифровка…');
  transferInfo.textContent = 'Расшифровка чанков…';

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

  const url = URL.createObjectURL(new Blob([merged]));
  downloadArea.innerHTML = `
    <a href="${url}" download="${recvMeta.name}" style="
      display:inline-flex;align-items:center;gap:8px;
      padding:12px 20px;background:#238636;
      color:white;border-radius:10px;text-decoration:none;
      margin-top:10px;font-weight:bold;
    ">⬇ Download ${recvMeta.name} (${formatBytes(totalBytes)})</a>
  `;

  transferInfo.textContent = `✅ Получено и расшифровано — ${formatBytes(totalBytes)}`;
  setStatus('✅ Файл получен!');

  recvMeta   = null;
  recvChunks = [];
  recvBytes  = 0;
}
