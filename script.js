let model;
let stream;
let running = false;
let lastCount = 0;
let historyData = [];
let lastSavedTime = 0;

const SAVE_INTERVAL = 10000;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// =========================
// MASUK KE SISTEM
// =========================
function enterSystem() {
  const landing = document.getElementById('landingPage');

  landing.style.opacity = '0';
  landing.style.transition = '1s';

  setTimeout(() => {
    landing.style.display = 'none';

    document.getElementById('mainApp')
      .classList.remove('hidden');

    document.body.style.overflow = 'auto';
  }, 1000);
}

// =========================
// SUARA
// =========================
function speak(text) {
  if (!window.speechSynthesis) return;

  const msg = new SpeechSynthesisUtterance(text);

  msg.lang = 'id-ID';
  msg.rate = 1;
  msg.pitch = 1;
  msg.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
}

// =========================
// LOAD MODEL
// =========================
async function loadModel() {
  document.getElementById('status').textContent = 'Loading AI...';

  model = await cocoSsd.load();

  document.getElementById('status').textContent = 'AI siap digunakan';

  document.querySelector('button[onclick="start()"]')
    .disabled = false;

  console.log("AI Loaded");
}

// =========================
// START CAMERA
// =========================
async function start() {
  if (!model) {
    alert("AI belum siap");
    return;
  }

  // Aktifkan izin suara di HP
  speak('Sistem siap mendeteksi manusia');

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      facingMode: "environment"
    },
    audio: false
  });

  video.srcObject = stream;

  running = true;

  document.querySelector('button[onclick="start()"]').disabled = true;
  document.querySelector('button[onclick="stop()"]').disabled = false;

  video.onloadedmetadata = () => {
    detect();
  };
}

// =========================
// STOP CAMERA
// =========================
function stop() {
  running = false;

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  video.srcObject = null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById('count').textContent = 0;
  document.getElementById('status').textContent = 'Kamera berhenti';

  document.querySelector('button[onclick="start()"]').disabled = false;
  document.querySelector('button[onclick="stop()"]').disabled = true;
}

// =========================
// DETECT
// =========================
async function detect() {
  if (!running) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const predictions = await model.detect(video);

  const people = predictions.filter(p =>
    p.class === 'person' && p.score > 0.6
  );

  people.forEach(p => {
    const [x, y, w, h] = p.bbox;

    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = 'lime';
    ctx.font = '16px Arial';

    ctx.fillText(
      `Manusia ${(p.score * 100).toFixed(1)}%`,
      x,
      y > 10 ? y - 5 : 10
    );
  });

  const count = people.length;

  if (count !== lastCount) {
    if (count === 1) {
      speak('Terdeteksi satu orang');
    } else if (count > 1) {
      speak(`Terdeteksi ${count} orang`);
    }
  }

  const now = Date.now();

  if (now - lastSavedTime > SAVE_INTERVAL) {
    const time = new Date().toLocaleTimeString();

    historyData.push({
      count,
      time
    });

    renderHistory();
    lastSavedTime = now;
  }

  lastCount = count;

  document.getElementById('count').textContent = count;

  let statusText = 'Ruangan kosong';

  if (count === 1) {
    statusText = '1 orang terdeteksi';
  } else if (count > 1) {
    statusText = `${count} orang terdeteksi`;
  }

  document.getElementById('status').textContent = statusText;

  setTimeout(detect, 700);
}

// =========================
// HISTORY
// =========================
function renderHistory() {
  const list = document.getElementById('logList');

  list.innerHTML = '';

  historyData.slice().reverse().forEach(item => {
    const li = document.createElement('li');

    li.textContent = `${item.time} - ${item.count} orang`;

    list.appendChild(li);
  });
}

function clearHistory() {
  document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
}

function confirmClear() {
  historyData = [];

  renderHistory();
  closeModal();
}

// =========================
// JAM
// =========================
function updateClock() {
  const now = new Date();

  document.getElementById('clock').textContent =
    now.toLocaleString('id-ID');
}

setInterval(updateClock, 1000);
loadModel();