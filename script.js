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
let lastLat = null;
let lastLon = null;
let lastGPSTime = null;
let gpsSpeed = 0;

let lastSpokenMessage = "";
let countdownSpoken = false;

// ✅ 음성 안내 출력
function speakText(text) {
  if ('speechSynthesis' in window && lastSpokenMessage !== text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
    lastSpokenMessage = text;
  }
}

// ✅ 10초 카운트다운 음성
function speakCountdown(seconds) {
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(`${seconds}초`);
    utter.lang = "ko-KR";
    speechSynthesis.speak(utter);
  }
}

// ✅ 거리 계산 함수 (m 단위)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const dx = (lat2 - lat1) * 111000;
  const dy = (lon2 - lon1) * 88000;
  return Math.sqrt(dx * dx + dy * dy);
}

// ✅ 신호등 UI 갱신
function updateSignalUI(state, remainingTime) {
  document.getElementById("signalBox").style.display = "block";
  const red = document.getElementById("lightRed");
  const green = document.getElementById("lightGreen");
  const counter = document.getElementById("countdownNumber");

  red.classList.remove("on");
  green.classList.remove("on");
  if (state === "red") red.classList.add("on");
  else green.classList.add("on");

  counter.textContent = Math.max(0, Math.floor(remainingTime));
}

// ✅ 안내 멘트 및 음성 출력
function updateStatusMessage(state, remaining, result) {
  let msg = "";
  const sec = Math.floor(remaining);

  if (state === "green") {
    msg = result.includes("가능")
      ? `현재 녹색 신호이며, ${sec}초 남았습니다. 건너가세요.`
      : `현재 녹색 신호이며, ${sec}초 남았습니다. 다음 신호를 기다리세요.`;
  } else {
    msg = `현재 적색신호입니다. 녹색으로 전환까지 ${sec}초 남았습니다.`;
  }

  document.getElementById("resultText").textContent = msg;
  speakText(msg);

  if (sec === 10 && !countdownSpoken) {
    countdownSpoken = true;
    for (let i = 10; i >= 1; i--) {
      setTimeout(() => speakCountdown(i), (10 - i) * 1000);
    }
  }
  if (sec > 10) countdownSpoken = false;
}

// ✅ 속도 및 위치 정보 표시
function updateInfoDisplay() {
  const avg = speedSamples.length > 0
    ? Math.floor(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length)
    : 0;
  document.getElementById("infoBox").style.display = "block";
  document.getElementById("info").innerHTML =
    `현재 속도: ${Math.floor(lastSpeed)} km/h<br>` +
    `누적 평균 속도: ${avg} km/h<br>` +
    `위도: ${currentLatitude.toFixed(6)}<br>` +
    `경도: ${currentLongitude.toFixed(6)}`;
}

// ✅ 서버 연결
function connectToServer() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId, clientType: "web" }));
    startUploadLoop();

    // 연결 후 파동 제거
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("signalBox").style.display = "block";
    speakText("보행자 지원 시스템에 연결되었습니다. 신호 상태를 분석 중입니다.");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "crossing_result" && data.webUserId === userId) {
      updateSignalUI(data.signalState, data.remainingGreenTime);
      updateStatusMessage(data.signalState, data.remainingGreenTime, data.result);
      updateInfoDisplay();
    }
  };
}

// ✅ 1초마다 서버로 정보 전송
function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!currentLatitude || !currentLongitude) return;

    const now = Date.now();
    const isStale = now - lastSpeedUpdateTime > 1500;
    const accComponent = isStale ? 0 : lastSpeed;
    const finalSpeed = +(0.6 * accComponent + 0.4 * gpsSpeed).toFixed(2);
    const avgSpeed = speedSamples.length > 0
      ? +(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length).toFixed(2)
      : 0.0;

    socket.send(JSON.stringify({
      type: "web_data",
      id: userId,
      speed: finalSpeed,
      averageSpeed: avgSpeed,
      location: { latitude: +currentLatitude.toFixed(6), longitude: +currentLongitude.toFixed(6) }
    }));

    lastSentSpeed = finalSpeed;
  }, 1000);
}

// ✅ 걷기 감지 (가속도 기반)
function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const now = Date.now();
  if (Math.abs(accY) > STEP_THRESHOLD && now - lastStepTime > STEP_INTERVAL) {
    const stepTime = (now - lastStepTime) / 1000;
    lastStepTime = now;
    let accSpeed = avgStrideLength / stepTime;
    accSpeed = Math.min(accSpeed, MAX_SPEED_KMH / 3.6);
    lastSpeed = +accSpeed.toFixed(2);
    lastSpeedUpdateTime = now;
    if (lastSpeed >= SPEED_CUTOFF) speedSamples.push(lastSpeed);
  }
}

// ✅ GPS 기반 속도 보정
navigator.geolocation.watchPosition(
  (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const now = Date.now();
    currentLatitude = lat;
    currentLongitude = lon;

    if (lastLat !== null && lastLon !== null && lastGPSTime !== null) {
      const dist = calculateDistance(lat, lon, lastLat, lastLon);
      const dt = (now - lastGPSTime) / 1000;
      if (dt > 0 && dist < 20) gpsSpeed = dist / dt;
    }

    lastLat = lat;
    lastLon = lon;
    lastGPSTime = now;
  },
  (err) => console.warn("GPS 오류:", err.message),
  { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
);

// ✅ 권한 허용 및 시작 버튼
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
        document.getElementById("radarAnimation").style.display = "none";
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
    document.getElementById("radarAnimation").style.display = "block";
  } catch (e) {
    alert("권한 요청 실패");
    console.error(e);
  }
});

// ✅ 페이지 전환
document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});

document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});
