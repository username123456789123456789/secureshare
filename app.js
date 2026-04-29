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
let pc          = null;   // RTCPeerConnection
let dc          = null;   // RTCDataChannel
let isHost      = false;
let selected    = null;   // File to send

// Receive state
let recvMeta    = null;   // { name, size, key }
let recvChunks  = [];     // ArrayBuffer[]
let recvBytes   = 0;

// ─────────────────────────────────────────────
// ICE servers (STUN — free, no server needed)
// ─────────────────────────────────────────────
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Chunk size — 16 KB is safe for WebRTC DataChannel
const CHUNK_SIZE = 16 * 1024;

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function setStatus(msg) {
  statusText.textContent = msg;
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 ** 2) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 ** 2).toFixed(2) + ' MB';
}

// ─────────────────────────────────────────────
// AES-GCM helpers
// ─────────────────────────────────────────────
async function generateKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export CryptoKey → plain number array (for JSON transfer)
async function exportKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(raw));
}

// Import number array → CryptoKey
async function importKey(arr) {
  return crypto.subtle.importKey(
    'raw',
    new Uint8Array(arr),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

// Encrypt one chunk → ArrayBuffer with packed [IV (12 B) | ciphertext]
async function encryptChunk(buffer, key) {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    buffer
  );
  // Pack IV + ciphertext into single buffer
  const out = new Uint8Array(12 + encrypted.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(encrypted), 12);
  return out.buffer;
}

// Decrypt packed [IV | ciphertext] → ArrayBuffer
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
// WebRTC — создание соединения
// ─────────────────────────────────────────────
function createPeerConnection() {
  if (pc) {
    pc.close();
    dc = null;
  }

  pc = new RTCPeerConnection(RTC_CONFIG);

  // Собираем ICE-кандидатов прямо в SDP (Trickle ICE отключён —
  // ждём полного SDP перед показом пользователю)
  pc.onicecandidate = (e) => {
    if (e.candidate) return; // ещё идёт сбор

    // ICE сбор завершён — показываем финальный SDP
    const sdp = JSON.stringify(pc.localDescription);

    if (isHost) {
      showSdp('📋 Скопируйте OFFER и отправьте гостю:', sdp, 'offer-ready');
    } else {
      showSdp('📋 Скопируйте ANSWER и отправьте хосту:', sdp, 'answer-ready');
    }
  };

  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    const labels = {
      connecting:    '🔄 Connecting…',
      connected:     '✅ Connected!',
      disconnected:  '⚠️ Disconnected',
      failed:        '❌ Connection failed',
      closed:        '🔒 Closed'
    };
    setStatus(labels[state] || state);

    if (state === 'connected') {
      sdpBox.style.display = 'none';
      sendBtn.disabled = !selected;
    }
  };

  // Гость получает DataChannel от хоста
  pc.ondatachannel = (e) => {
    setupDataChannel(e.channel);
  };
}

// ─────────────────────────────────────────────
// DataChannel setup
// ─────────────────────────────────────────────
function setupDataChannel(channel) {
  dc = channel;
  dc.binaryType = 'arraybuffer';

  dc.onopen  = () => {
    setStatus('✅ Connected! Ready to transfer.');
    sendBtn.disabled = !selected;
  };

  dc.onclose = () => {
    setStatus('Connection closed');
    sendBtn.disabled = true;
  };

  dc.onerror = (e) => setStatus('❌ DataChannel error: ' + e.error?.message);

  dc.onmessage = (e) => handleIncoming(e.data);
}

// ─────────────────────────────────────────────
// SDP UI helpers
// ─────────────────────────────────────────────
// mode: 'offer-ready' | 'paste-answer' | 'answer-ready' | 'paste-offer'
let sdpMode = null;

function showSdp(label, value, mode) {
  sdpMode            = mode;
  sdpLabel.textContent = label;
  sdpOutput.value    = value || '';
  sdpOutput.readOnly = !!value;    // readonly когда показываем, редактируемый когда ждём вставки
  sdpBox.style.display = 'block';

  // Кнопка Submit нужна только когда пользователь вставляет SDP
  submitSdpBtn.style.display = (mode === 'paste-offer' || mode === 'paste-answer') ? 'inline-block' : 'none';
}

copySdpBtn.addEventListener('click', async () => {
  if (!sdpOutput.value) return;
  await navigator.clipboard.writeText(sdpOutput.value);
  copySdpBtn.textContent = '✅ Copied!';
  setTimeout(() => (copySdpBtn.textContent = '📋 Copy'), 2000);

  // Хост после копирования Offer → ждёт Answer
  if (sdpMode === 'offer-ready') {
    showSdp('📥 Вставьте ANSWER от гостя сюда:', '', 'paste-answer');
  }
  // Гость после копирования Answer — больше ничего не нужно делать
});

submitSdpBtn.addEventListener('click', async () => {
  const raw = sdpOutput.value.trim();
  if (!raw) return;

  let desc;
  try {
    desc = JSON.parse(raw);
  } catch {
    alert('⚠️ Неверный формат SDP — вставьте текст целиком.');
    return;
  }

  try {
    if (sdpMode === 'paste-offer') {
      // Гость получил Offer → создаёт Answer
      await pc.setRemoteDescription(desc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // ICE сбор завершится → onicecandidate покажет Answer
      setStatus('🔄 Gathering ICE…');
    } else if (sdpMode === 'paste-answer') {
      // Хост получил Answer
      await pc.setRemoteDescription(desc);
      setStatus('🔄 Establishing connection…');
      sdpBox.style.display = 'none';
    }
  } catch (err) {
    alert('❌ Ошибка SDP: ' + err.message);
  }
});

// ─────────────────────────────────────────────
// Create Room (Host)
// ─────────────────────────────────────────────
createRoomBtn.addEventListener('click', async () => {
  isHost = true;
  createPeerConnection();

  // Хост создаёт DataChannel
  dc = pc.createDataChannel('file-transfer', { ordered: true });
  setupDataChannel(dc);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  setStatus('🔄 Gathering ICE candidates…');
  // onicecandidate покажет SDP когда сбор завершён
});

// ─────────────────────────────────────────────
// Join Room (Guest)
// ─────────────────────────────────────────────
joinRoomBtn.addEventListener('click', () => {
  isHost = false;
  createPeerConnection();
  showSdp('📥 Вставьте OFFER от хоста сюда:', '', 'paste-offer');
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
// Send File
// ─────────────────────────────────────────────
sendBtn.addEventListener('click', async () => {
  if (!selected || !dc || dc.readyState !== 'open') return;

  sendBtn.disabled = true;
  progressBar.style.width = '0%';
  downloadArea.innerHTML  = '';

  // 1. Generate key
  const key        = await generateKey();
  const exportedKey = await exportKey(key);
  const buffer     = await selected.arrayBuffer();
  const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

  // 2. Send metadata + key
  dc.send(JSON.stringify({
    type:   'file-meta',
    name:   selected.name,
    size:   buffer.byteLength,
    chunks: totalChunks,
    key:    exportedKey
  }));

  // 3. Send encrypted chunks one by one
  let chunkIndex = 0;
  let offset     = 0;

  async function sendNextChunk() {
    if (offset >= buffer.byteLength) {
      // All chunks sent
      dc.send(JSON.stringify({ type: 'file-end' }));
      progressBar.style.width = '100%';
      transferInfo.textContent = `✅ Sent ${formatBytes(buffer.byteLength)}`;
      sendBtn.disabled = false;
      return;
    }

    // Respect DataChannel buffer — avoid flooding
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
    transferInfo.textContent = `📤 Sending… ${chunkIndex}/${totalChunks} chunks (${formatBytes(Math.min(offset, buffer.byteLength))} / ${formatBytes(buffer.byteLength)})`;

    // Yield to keep UI responsive
    setTimeout(sendNextChunk, 0);
  }

  sendNextChunk();
});

// ─────────────────────────────────────────────
// Receive File
// ─────────────────────────────────────────────
async function handleIncoming(data) {
  // JSON control messages
  if (typeof data === 'string') {
    const msg = JSON.parse(data);

    if (msg.type === 'file-meta') {
      recvMeta   = msg;
      recvChunks = [];
      recvBytes  = 0;
      progressBar.style.width  = '0%';
      transferInfo.textContent = `📥 Receiving: ${msg.name} (${formatBytes(msg.size)})`;
      downloadArea.innerHTML   = '';

      // Import decryption key
      recvMeta.cryptoKey = await importKey(msg.key);
      setStatus(`📥 Receiving file…`);
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
  recvBytes += buf.byteLength;

  // Update progress using original file size (before encryption overhead)
  const totalChunks = recvMeta.chunks;
  const pct = Math.min((recvChunks.length / totalChunks) * 100, 99);
  progressBar.style.width  = `${pct}%`;
  transferInfo.textContent = `📥 ${recvChunks.length}/${totalChunks} chunks received`;
}

// ─────────────────────────────────────────────
// Assemble & offer download
// ─────────────────────────────────────────────
async function assembleFile() {
  setStatus('🔓 Decrypting…');
  transferInfo.textContent = 'Decrypting chunks…';

  // Decrypt all chunks sequentially
  const decrypted = [];
  for (const buf of recvChunks) {
    const plain = await decryptChunk(buf, recvMeta.cryptoKey);
    decrypted.push(plain);
  }

  // Merge into single Uint8Array
  const totalBytes = decrypted.reduce((s, b) => s + b.byteLength, 0);
  const merged     = new Uint8Array(totalBytes);
  let offset = 0;
  for (const part of decrypted) {
    merged.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }

  // Create download link
  const blob = new Blob([merged]);
  const url  = URL.createObjectURL(blob);

  downloadArea.innerHTML = `
    <a href="${url}" download="${recvMeta.name}" style="
      display:inline-flex;align-items:center;gap:8px;
      padding:12px 20px;background:#238636;
      color:white;border-radius:10px;text-decoration:none;
      margin-top:10px;font-weight:bold;
    ">⬇ Download ${recvMeta.name} (${formatBytes(totalBytes)})</a>
  `;

  transferInfo.textContent = `✅ Received & decrypted — ${formatBytes(totalBytes)}`;
  setStatus('✅ File received!');

  // Cleanup
  recvMeta   = null;
  recvChunks = [];
  recvBytes  = 0;
}