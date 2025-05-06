let socketConnected = false;
let currentSpeedKmH = 0;
let lastStepTime = Date.now();
let lastMovementTime = Date.now();
let currentLatitude = null;
let currentLongitude = null;

const avgStrideLength = 0.7;
const STEP_THRESHOLD = 1.5;
const STEP_INTERVAL = 500;
const userId = "20250001";
let startedWalking = false;

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== 'granted') {
        alert("🚫 센서 권한 거부됨");
        return;
      }
    }

    startTracking();
  } catch (err) {
    alert("🚨 권한 요청 오류");
    console.error(err);
  }
});

function startTracking() {
  console.log("📡 트래킹 시작");

  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("gpsInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  startLocationTracking();
  window.addEventListener("devicemotion", handleDeviceMotion, true);
  tryConnectToServer();
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    alert("❌ 위치 정보 미지원");
    return;
  }

  navigator.geolocation.watchPosition(
    (position) => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;

      console.log("📍 위치:", currentLatitude, currentLongitude);
      document.getElementById("lat").textContent = currentLatitude.toFixed(6);
      document.getElementById("lon").textContent = currentLongitude.toFixed(6);
    },
    (error) => {
      console.warn("🚫 위치 실패:", error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000
    }
  );
}

function handleDeviceMotion(event) {
  const accX = event.acceleration.x || 0;
  const accY = event.acceleration.y || 0;
  const accZ = event.acceleration.z || 0;
  const currentTime = Date.now();

  if (
    Math.abs(accY) > STEP_THRESHOLD &&
    Math.abs(accX) < 2 && Math.abs(accZ) < 2 &&
    currentTime - lastStepTime > STEP_INTERVAL
  ) {
    const stepTime = (currentTime - lastStepTime) / 1000;
    lastStepTime = currentTime;
    lastMovementTime = currentTime;

    const speed = avgStrideLength / stepTime;
    currentSpeedKmH = parseFloat((speed * 3.6).toFixed(2));
    updateSpeedDisplay(currentSpeedKmH);

    if (!startedWalking) {
      startedWalking = true;
      startSpeedUploadLoop();
    }
  }
}

function updateSpeedDisplay(speed) {
  document.getElementById("speedInfo").innerHTML = `<strong>현재 속도:</strong> ${speed} km/h`;
}

function tryConnectToServer() {
  const socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    console.log("✅ 서버 연결 완료");
    socketConnected = true;
    socket.send(JSON.stringify({ type: "register", id: userId }));
    window.mySocket = socket;

    // 연결 성공 시 UI 전환
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";

    startSpeedUploadLoop(); // 주기적 전송 시작
  };

  socket.onerror = (err) => {
    console.error("❌ 서버 연결 실패:", err.message);
  };

  socket.onmessage = (event) => {
    console.log("📨 서버 메시지:", event.data);
  };
}

function startSpeedUploadLoop() {
  setInterval(() => {
    if (
      currentLatitude === null || currentLongitude === null ||
      isNaN(currentLatitude) || isNaN(currentLongitude)
    ) {
      console.warn("📍 유효한 위치 없음, 전송 생략");
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

    console.log("📤 전송 데이터:", payload);

    if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
      window.mySocket.send(JSON.stringify(payload));
      console.log("✅ 전송 완료!");
    } else {
      console.warn("⚠️ WebSocket 연결 안 됨");
    }
  }, 3000); // 3초 주기
}
