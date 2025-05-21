let lastStepTime = Date.now();
let lastSpeed = 0;
let lastSpeedUpdateTime = 0;
let speedSamples = [];
let currentLatitude = null;
let currentLongitude = null;
let socket = null;

const userId = "20250001";
const avgStrideLength = 0.45;
const STEP_INTERVAL = 800;
const STEP_THRESHOLD = 2.5;
const MAX_SPEED_KMH = 3;
const SPEED_CUTOFF = 0.5;

let lastSentSpeed = -1;
let lastSentLat = null;
let lastSentLon = null;

let lastLat = null;
let lastLon = null;
let lastGPSTime = null;
let gpsSpeed = 0;

function calculateDistance(lat1, lon1, lat2, lon2) {
  const dx = (lat2 - lat1) * 111000;
  const dy = (lon2 - lon1) * 88000;
  return Math.sqrt(dx * dx + dy * dy);
}

// ⛳ GPS 위치 기반 속도 계산
navigator.geolocation.watchPosition(
  (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const now = Date.now();

    currentLatitude = lat;
    currentLongitude = lon;

    if (lastLat !== null && lastLon !== null && lastGPSTime !== null) {
      const dist = calculateDistance(lat, lon, lastLat, lastLon); // m
      const dt = (now - lastGPSTime) / 1000; // sec
      if (dt > 0 && dist < 20) gpsSpeed = dist / dt; // m/s
    }

    lastLat = lat;
    lastLon = lon;
    lastGPSTime = now;
  },
  (err) => console.warn("GPS 오류:", err.message),
  { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
);

// 🏃 가속도 기반 걸음 감지 속도 계산
function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const now = Date.now();

  if (Math.abs(accY) > STEP_THRESHOLD && now - lastStepTime > STEP_INTERVAL) {
    const stepTime = (now - lastStepTime) / 1000;
    lastStepTime = now;
    let accSpeed = avgStrideLength / stepTime; // m/s
    accSpeed = Math.min(accSpeed, MAX_SPEED_KMH / 3.6);
    lastSpeed = +accSpeed.toFixed(2);
    lastSpeedUpdateTime = now;
    if (lastSpeed >= SPEED_CUTOFF) speedSamples.push(lastSpeed);
  }
}

// 🌐 서버 연결
function connectToServer() {
  socket = new WebSocket("wss://your-server-address:3000/");
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId, clientType: "web" }));
    startUploadLoop();
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "crossing_result" && data.webUserId === userId) {
      // 신호등 UI 등 업데이트...
    }
  };
}

// 🚀 서버로 1초마다 하이브리드 속도 전송
function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!currentLatitude || !currentLongitude) return;

    const now = Date.now();
    const isStale = now - lastSpeedUpdateTime > 1500;

    const accComponent = isStale ? 0 : lastSpeed;
    const finalSpeed = +(0.6 * accComponent + 0.4 * gpsSpeed).toFixed(2); // hybrid m/s
    const avgSpeed = speedSamples.length > 0
      ? +(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length).toFixed(2)
      : 0.0;

    const payload = {
      type: "web_data",
      id: userId,
      speed: finalSpeed,
      averageSpeed: avgSpeed,
      location: { latitude: +currentLatitude.toFixed(6), longitude: +currentLongitude.toFixed(6) }
    };

    socket.send(JSON.stringify(payload));
    lastSentSpeed = finalSpeed;
    lastSentLat = currentLatitude;
    lastSentLon = currentLongitude;
  }, 1000);
}

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (typeof DeviceMotionEvent?.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        alert("센서 권한이 필요합니다.");
        return;
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLatitude = pos.coords.latitude;
        currentLongitude = pos.coords.longitude;
        connectToServer();
      },
      (err) => {
        alert("위치 권한이 필요합니다.");
        console.warn("위치 권한 거부:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    window.addEventListener("devicemotion", handleDeviceMotion, true);
    document.getElementById("requestPermissionButton").style.display = "none";
  } catch (e) {
    alert("권한 요청 중 오류 발생");
    console.error(e);
  }
});
