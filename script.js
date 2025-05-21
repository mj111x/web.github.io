document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});

document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});

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
let countdownTimer = null;

function updateDisplay(state, remaining, result) {
  const icon = document.getElementById("signalIcon");
  icon.src = state === "green" ? "walk-icon.png" : "stop-icon.png";
  icon.alt = state === "green" ? "걷기 가능" : "정지";

  document.getElementById("signalDisplay").style.display = "block";
  document.getElementById("countdownText").textContent = `잔여 시간: ${remaining.toFixed(1)}초`;

  document.getElementById("infoBox").style.display = "block";
  document.getElementById("info").textContent =
    `속도: ${lastSpeed} km/h | 위도: ${currentLatitude.toFixed(6)} | 경도: ${currentLongitude.toFixed(6)}`;

  document.getElementById("resultText").textContent = `판단 결과: ${result}`;
}

function connectToServer() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId, clientType: "web" }));
    startUploadLoop();

    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("signalDisplay").style.display = "block";
    document.getElementById("infoBox").style.display = "block";
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "crossing_result" && data.webUserId === userId) {
        updateDisplay(data.signalState, data.remainingGreenTime, data.result);

        clearInterval(countdownTimer);
        let timeLeft = data.remainingGreenTime;
        countdownTimer = setInterval(() => {
          timeLeft -= 1;
          document.getElementById("countdownText").textContent = `잔여 시간: ${timeLeft.toFixed(1)}초`;
          if (timeLeft <= 0) clearInterval(countdownTimer);
        }, 1000);
      }
    } catch (e) {
      console.warn("메시지 처리 오류:", e);
    }
  };
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!currentLatitude || !currentLongitude) return;

    const lat = +currentLatitude.toFixed(6);
    const lon = +currentLongitude.toFixed(6);
    const now = Date.now();
    const isStale = now - lastSpeedUpdateTime > 1000;
    const finalSpeed = (isStale || lastSpeed < SPEED_CUTOFF) ? 0.0 : lastSpeed;
    const avgSpeed = speedSamples.length > 0
      ? +(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length).toFixed(2)
      : 0.0;

    const hasChanged = finalSpeed !== lastSentSpeed || lat !== lastSentLat || lon !== lastSentLon;

    if (hasChanged) {
      const payload = {
        type: "web_data",
        id: userId,
        speed: finalSpeed,
        averageSpeed: avgSpeed,
        location: { latitude: lat, longitude: lon }
      };
      socket.send(JSON.stringify(payload));
      lastSentSpeed = finalSpeed;
      lastSentLat = lat;
      lastSentLon = lon;
    }
  }, 3000);
}

function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const now = Date.now();
  if (Math.abs(accY) > STEP_THRESHOLD && now - lastStepTime > STEP_INTERVAL) {
    const stepTime = (now - lastStepTime) / 1000;
    lastStepTime = now;
    let speed = avgStrideLength / stepTime;
    speed = Math.min(speed * 3.6, MAX_SPEED_KMH);
    lastSpeed = +speed.toFixed(2);
    lastSpeedUpdateTime = now;
    if (lastSpeed >= SPEED_CUTOFF) speedSamples.push(lastSpeed);
  }
}

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (typeof DeviceMotionEvent?.requestPermission === "function") {
      const motionPermission = await DeviceMotionEvent.requestPermission();
      if (motionPermission !== "granted") {
        alert("센서 권한이 필요합니다.");
        return;
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          currentLatitude = pos.coords.latitude;
          currentLongitude = pos.coords.longitude;
          document.getElementById("lat")?.textContent = currentLatitude.toFixed(6);
          document.getElementById("lon")?.textContent = currentLongitude.toFixed(6);
          connectToServer();
        },
        (err) => {
          alert("위치 권한이 필요합니다.");
          console.warn("위치 권한 거부:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        currentLatitude = pos.coords.latitude;
        currentLongitude = pos.coords.longitude;
      },
      (err) => console.warn("❌ 위치 추적 실패:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    document.getElementById("requestPermissionButton").style.display = "none";
    document.getElementById("radarAnimation").style.display = "block";

    window.addEventListener("devicemotion", handleDeviceMotion, true);
  } catch (e) {
    alert("권한 요청 중 오류 발생");
    console.error(e);
  }
});
