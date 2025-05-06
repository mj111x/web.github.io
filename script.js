let currentSpeedKmH = 0;
let lastStepTime = Date.now();
let currentLatitude = null;
let currentLongitude = null;
let socket = null;

const userId = "20250001";
const avgStrideLength = 0.7;
const STEP_INTERVAL = 300;
const STEP_THRESHOLD = 0.5;

window.addEventListener("load", async () => {
  console.log("🔄 페이지 로드됨 → 권한 요청 시도");

  // 위치 권한
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLatitude = pos.coords.latitude;
        currentLongitude = pos.coords.longitude;
        console.log("📍 초기 위치:", currentLatitude, currentLongitude);
        document.getElementById("lat").textContent = currentLatitude.toFixed(6);
        document.getElementById("lon").textContent = currentLongitude.toFixed(6);
      },
      (err) => console.warn("❌ 위치 권한 거부:", err.message)
    );
  }

  // 센서 권한
  if (typeof DeviceMotionEvent?.requestPermission === "function") {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      if (result === "granted") {
        console.log("✅ 센서 권한 허용됨");
        startTracking();
      } else {
        alert("❌ 센서 권한이 거부되었습니다.");
      }
    } catch (err) {
      alert("🚨 센서 권한 요청 중 오류 발생");
      console.error(err);
    }
  } else {
    console.log("📱 센서 권한 불필요한 환경");
    startTracking(); // Android, 데스크탑 등
  }
});

function startTracking() {
  console.log("📡 트래킹 시작됨");

  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("gpsInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  // 위치 추적
  navigator.geolocation.watchPosition(
    (pos) => {
      currentLatitude = pos.coords.latitude;
      currentLongitude = pos.coords.longitude;
      document.getElementById("lat").textContent = currentLatitude.toFixed(6);
      document.getElementById("lon").textContent = currentLongitude.toFixed(6);
    },
    (err) => console.warn("❌ 위치 추적 실패:", err.message),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
  );

  // 센서 이벤트
  window.addEventListener("devicemotion", handleDeviceMotion, true);
  console.log("📡 devicemotion 이벤트 등록됨");

  connectToServer();
}

function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const now = Date.now();

  if (Math.abs(accY) > STEP_THRESHOLD && now - lastStepTime > STEP_INTERVAL) {
    const stepTime = (now - lastStepTime) / 1000;
    lastStepTime = now;
    const speed = avgStrideLength / stepTime;
    currentSpeedKmH = +(speed * 3.6).toFixed(2);
    updateSpeedDisplay(currentSpeedKmH);
    console.log("🚶‍♂️ 속도 측정:", currentSpeedKmH, "km/h");
  }
}

function updateSpeedDisplay(speed) {
  document.getElementById("speedInfo").innerHTML = `현재 속도: ${speed} km/h`;
}

function connectToServer() {c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    console.log("✅ WebSocket 연결됨");
    socket.send(JSON.stringify({ type: "register", id: userId }));
    startUploadLoop();

    // ✅ 연결 성공 시 UI 전환
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";
  };

  socket.onmessage = (e) => console.log("📨 서버 메시지:", e.data);
  socket.onerror = (e) => console.error("❌ WebSocket 오류:", e);
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("🛑 WebSocket 연결 아님");
      return;
    }

    if (!currentLatitude || !currentLongitude) {
      console.warn("📍 위치 없음 → 전송 생략");
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
