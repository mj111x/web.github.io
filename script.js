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
let timeLeft = null;
let signalState = null;
let lastResult = "";

function updateSignalUI(state, remainingTime) {
  document.getElementById("signalBox").style.display = "block";
  const redLight = document.getElementById("lightRed");
  const greenLight = document.getElementById("lightGreen");
  const countdown = document.getElementById("countdownNumber");

  redLight.classList.remove("on");
  greenLight.classList.remove("on");

  if (state === "red") redLight.classList.add("on");
  else greenLight.classList.add("on");

  countdown.textContent = Math.max(0, Math.floor(remainingTime));
}

function updateStatusMessage() {
  let message = "";
  if (signalState === "green") {
    message = lastResult.includes("가능")
      ? `현재 녹색 신호이며, ${Math.floor(timeLeft)}초 남았습니다. 건너가세요.`
      : `현재 녹색 신호이며, ${Math.floor(timeLeft)}초 남았습니다. 다음 신호를 기다리세요.`;
  } else {
    message = `현재 적색신호입니다. 녹색으로 전환까지 ${Math.floor(timeLeft)}초 남았습니다.`;
  }
  document.getElementById("resultText").textContent = message;
}

function updateDisplay(state, remaining, result) {
  signalState = state;
  timeLeft = remaining;
  lastResult = result;
  updateSignalUI(state, timeLeft);
  updateStatusMessage();

  const avgSpeed = speedSamples.length > 0
    ? Math.floor(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length)
    : 0;

  document.getElementById("infoBox").style.display = "block";
  document.getElementById("info").innerHTML =
    `현재 속도: ${Math.floor(lastSpeed)} km/h<br>` +
    `누적 평균 속도: ${avgSpeed} km/h<br>` +
    `위도: ${currentLatitude.toFixed(6)}<br>` +
    `경도: ${currentLongitude.toFixed(6)}`;
}

function startRealtimeCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (timeLeft !== null && signalState) {
      timeLeft--;
      updateSignalUI(signalState, timeLeft);
      updateStatusMessage();
    }
  }, 1000);
}

function connectToServer() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId, clientType: "web" }));
    startUploadLoop();
    document.getElementById("radarAnimation").style.display = "none";
  };
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "crossing_result" && data.webUserId === userId) {
        updateDisplay(data.signalState, data.remainingGreenTime, data.result);
        startRealtimeCountdown();
      }
    } catch (e) {
      console.warn("메시지 처리 오류:", e);
    }
  };
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !currentLatitude || !currentLongitude) return;
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
      socket.send(JSON.stringify({
        type: "web_data",
        id: userId,
        speed: finalSpeed,
        averageSpeed: avgSpeed,
        location: { latitude: lat, longitude: lon }
      }));
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
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        alert("센서 권한이 거부되었습니다.");
        return;
      }
    }

    if (navigator.geolocation) {
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
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        currentLatitude = pos.coords.latitude;
        currentLongitude = pos.coords.longitude;
      },
      (err) => console.warn("위치 추적 실패:", err.message),
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

document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});

document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});
