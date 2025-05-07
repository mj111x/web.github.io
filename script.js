let allSpeedSamples = [];
let lastStepTime = Date.now();
let currentLatitude = null;
let currentLongitude = null;
let socket = null;

const userId = "20250001";
const avgStrideLength = 0.45;
const STEP_INTERVAL = 800;
const STEP_THRESHOLD = 2.5;
const MAX_SPEED_KMH = 3;
const MIN_VALID_SPEED = 0.5;

let lastSentAverage = 0;
let lastSentLat = null;
let lastSentLon = null;

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  if (typeof DeviceMotionEvent?.requestPermission === "function") {
    try {
      const motionPermission = await DeviceMotionEvent.requestPermission();
      if (motionPermission !== "granted") {
        alert("센서 권한이 필요합니다.");
        return;
      }
    } catch (err) {
      alert("센서 권한 요청 실패");
      return;
    }
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLatitude = pos.coords.latitude;
        currentLongitude = pos.coords.longitude;
        document.getElementById("lat").textContent = currentLatitude.toFixed(6);
        document.getElementById("lon").textContent = currentLongitude.toFixed(6);
        startTracking();
      },
      (err) => {
        alert("위치 권한이 필요합니다.");
        console.warn("위치 권한 거부:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }
});

function startTracking() {
  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("radarAnimation").style.display = "block";
  document.getElementById("gpsInfo").style.display = "block";

  navigator.geolocation.watchPosition(
    (pos) => {
      currentLatitude = pos.coords.latitude;
      currentLongitude = pos.coords.longitude;
      document.getElementById("lat").textContent = currentLatitude.toFixed(6);
      document.getElementById("lon").textContent = currentLongitude.toFixed(6);
    },
    (err) => console.warn("❌ 위치 추적 실패:", err.message),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
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

    let speed = avgStrideLength / stepTime;
    speed = Math.min(speed * 3.6, MAX_SPEED_KMH);

    if (speed >= MIN_VALID_SPEED) {
      allSpeedSamples.push(+speed.toFixed(2));
    } else {
      allSpeedSamples = [];
      allSpeedSamples.push(0);
    }
  }
}

function connectToServer() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId }));
    startUploadLoop();
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";
    document.getElementById("speedInfo").style.display = "block";
  };

  socket.onerror = (e) => console.error("WebSocket 오류:", e);
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!currentLatitude || !currentLongitude || allSpeedSamples.length === 0) return;

    const latestSpeed = allSpeedSamples[allSpeedSamples.length - 1];

    const validSamples = allSpeedSamples.filter(v => v >= MIN_VALID_SPEED);
    const avg = validSamples.length > 0
      ? +(validSamples.reduce((a, b) => a + b, 0) / validSamples.length).toFixed(2)
      : 0.0;

    const lat = +currentLatitude.toFixed(6);
    const lon = +currentLongitude.toFixed(6);

    document.getElementById("speedInfo").innerHTML =
      `평균 속도: ${avg} km/h<br>위도: ${lat}<br>경도: ${lon}`;

    const hasChanged = avg !== lastSentAverage || lat !== lastSentLat || lon !== lastSentLon;

    if (hasChanged) {
      const payload = {
        type: "web_data",
        id: userId,
        speed: avg,
        location: { latitude: lat, longitude: lon }
      };
      socket.send(JSON.stringify(payload));
      lastSentAverage = avg;
      lastSentLat = lat;
      lastSentLon = lon;
    }
  }, 3000);
}

document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});
document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});
