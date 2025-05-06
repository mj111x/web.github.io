let currentSpeedKmH = 0;
let lastStepTime = Date.now();
let currentLatitude = null;
let currentLongitude = null;
let socket = null;
const userId = "20250001";
const avgStrideLength = 0.7;
const STEP_INTERVAL = 300;
const STEP_THRESHOLD = 1.0;

// 권한 요청 + 트래킹 시작
document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const result = await DeviceMotionEvent.requestPermission();
      if (result !== 'granted') {
        alert("❌ 센서 권한 거부됨");
        return;
      }
    }

    startTracking(); // 센서 + GPS + 서버 연결 시작
  } catch (err) {
    alert("❗ 권한 요청 오류");
    console.error(err);
  }
});

function startTracking() {
  console.log("📡 트래킹 시작됨");
  document.getElementById("requestPermissionButton").style.display = "none";

  // 위치 추적
  navigator.geolocation.watchPosition(
    (pos) => {
      currentLatitude = pos.coords.latitude;
      currentLongitude = pos.coords.longitude;
      console.log("📍 위치 갱신:", currentLatitude, currentLongitude);
    },
    (err) => console.error("❌ 위치 추적 실패:", err),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
  );

  // 센서 리스너
  window.addEventListener("devicemotion", handleDeviceMotion, true);
  console.log("📡 devicemotion 이벤트 등록됨");

  connectToServer();
}

function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const accX = event.acceleration.x || 0;
  const accZ = event.acceleration.z || 0;
  const now = Date.now();

  if (
    Math.abs(accY) > STEP_THRESHOLD &&
    now - lastStepTime > STEP_INTERVAL
  ) {
    const stepTime = (now - lastStepTime) / 1000;
    lastStepTime = now;

    const speed = avgStrideLength / stepTime;
    currentSpeedKmH = +(speed * 3.6).toFixed(2);
    console.log("🚶‍♀️ 속도 측정:", currentSpeedKmH, "km/h");
    updateSpeedDisplay(currentSpeedKmH);
  }
}

function updateSpeedDisplay(speed) {
  document.getElementById("speedInfo").innerHTML = `현재 속도: ${speed} km/h`;
}

function connectToServer() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    console.log("✅ WebSocket 연결됨");
    socket.send(JSON.stringify({ type: "register", id: userId }));
    startUploadLoop();
  };

  socket.onmessage = (event) => {
    console.log("📨 서버 메시지:", event.data);
  };

  socket.onerror = (e) => {
    console.error("❌ WebSocket 오류:", e);
  };
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("🔌 WebSocket 연결 안됨");
      return;
    }

    if (!currentLatitude || !currentLongitude) {
      console.warn("📍 위치 정보 없음");
      return;
    }

    const payload = {
      type: "web_data",
      id: userId,
      speed: currentSpeedKmH,
      location: {
        latitude: currentLatitude,
        longitude: currentLongitude
      }
    };

    console.log("📤 전송:", payload);
    socket.send(JSON.stringify(payload));
  }, 3000);
}
