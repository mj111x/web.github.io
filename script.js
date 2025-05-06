let currentSpeedKmH = 0;
let lastStepTime = Date.now();
let currentLatitude = null;
let currentLongitude = null;
let socket = null;

const userId = "20250001";
const avgStrideLength = 0.7;
const STEP_INTERVAL = 300;
const STEP_THRESHOLD = 0.5;

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLatitude = pos.coords.latitude;
        currentLongitude = pos.coords.longitude;
        document.getElementById("lat").textContent = currentLatitude.toFixed(6);
        document.getElementById("lon").textContent = currentLongitude.toFixed(6);
      },
      (err) => console.warn("❌ 위치 권한 거부:", err.message)
    );
  }

  if (typeof DeviceMotionEvent?.requestPermission === "function") {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      if (result === "granted") {
        startTracking();
      } else {
        alert("센서 권한이 거부되었습니다.");
      }
    } catch (err) {
      alert("센서 권한 요청 중 오류 발생");
    }
  } else {
    startTracking();
  }
});

function startTracking() {
  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("radarAnimation").style.display = "block";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("gpsInfo").style.display = "block";

  navigator.geolocation.watchPosition(
    (pos) => {
      currentLatitude = pos.coords.latitude;
      currentLongitude = pos.coords.longitude;
      document.getElementById("lat").textContent = currentLatitude.toFixed(6);
      document.getElementById("lon").textContent = currentLongitude.toFixed(6);
    },
    (err) => console.warn("❌ 위치 추적 실패:", err.message),
    { enableHighAccuracy: true }
  );

  window.addEventListener("devicemotion", handleDeviceMotion, true);
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
  }
}

function updateSpeedDisplay(speed) {
  document.getElementById("speedInfo").innerHTML = `현재 속도: ${speed} km/h`;
}

function connectToServer() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId }));
    startUploadLoop();

    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";
  };

  socket.onerror = (e) => console.error("WebSocket 오류:", e);
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!currentLatitude || !currentLongitude) return;

    const payload = {
      type: "web_data",
      id: userId,
      speed: currentSpeedKmH,
      location: {
        latitude: currentLatitude,
        longitude: currentLongitude
      }
    };

    socket.send(JSON.stringify(payload));
  }, 3000);
}

// 🧭 하단 탭 전환
document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});

document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});
