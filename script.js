let socket;
let currentLatitude = 0;
let currentLongitude = 0;

let lastSpeed = 0;                  // 최종 보정된 속도 (전송용)
let lastSpeedUpdateTime = 0;       // 마지막 속도 업데이트 시각
let speedSamples = [];             // 누적 평균 속도 계산용

const userId = "20250001";
const SPEED_CUTOFF = 0.3;

// 신호 관련 변수
let signalRemainingTime = 0;
let signalState = "red";
let allowedTime = 999;
let countdownInterval = null;
let previousSignal = null;
let justConnected = true;
let twelveSecondAnnounced = false;
let alreadyAnnouncedChange = false;
let initialSpoken = false;
let initialMessageSpoken = false;
let lastCountdownSecond = null;

// 음성 관련
let lastSpoken = "";
let isSpeaking = false;

// 신호 주기 (기본값)
let greenDuration = 30;
let redDuration = 30;

// GPS 위치 및 보정용
let lastGPSUpdateTime = 0;
let lastGPSLatitude = null;
let lastGPSLongitude = null;
let previousGpsSpeed = null;
let sameSpeedCount = 0;

// 걸음 기반 속도 측정용 변수
let accelSpeed = 0;                // EMA 보정된 속도 (걸음 기반)
let smoothedSpeed = 0;            // EMA 중간 결과
let alpha = 0.3;                   // EMA 계수
let lastStepTime = 0;             // 마지막 걸음 시각

// 보폭 보정용 변수
let dynamicStride = 0.45;         // 실시간 보폭
let stepCount = 0;                // 보폭 계산용 걸음 수
let gpsDistance = 0;              // 누적 GPS 이동 거리
let gpsStart = null;              // 보폭 계산 시작 위치

function speak(text) {
  if ('speechSynthesis' in window && text !== lastSpoken && !isSpeaking) {
    isSpeaking = true;
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 1.1;
    utter.onend = () => { isSpeaking = false; };
    synth.cancel();
    setTimeout(() => synth.speak(utter), 100);
    lastSpoken = text;
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const now = Date.now();

  if (Math.abs(accY) > 2.5 && now - lastStepTime > 800) {
    const stepTime = (now - lastStepTime) / 1000;
    lastStepTime = now;

    const stepSpeed = dynamicStride / stepTime;
    smoothedSpeed = alpha * stepSpeed + (1 - alpha) * smoothedSpeed;

    accelSpeed = smoothedSpeed;
    lastSpeedUpdateTime = now;
    stepCount++;

    console.log(`걸음 감지: ${stepSpeed.toFixed(2)} m/s → EMA: ${smoothedSpeed.toFixed(2)} m/s`);
  }
}

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const now = Date.now();

    // 2초 이상 걸음 없으면 속도 0 처리
    if (now - lastStepTime > 2000) {
      accelSpeed = 0;
    }

    // 현재 속도: 걸음 기반 속도
    const rawSpeed = accelSpeed;
    lastSpeed = rawSpeed < SPEED_CUTOFF ? 0 : rawSpeed;

    // 평균 속도는 0 이상인 값만 누적
    if (rawSpeed >= SPEED_CUTOFF) {
      speedSamples.push(rawSpeed);
    }

    const avgSpeed = speedSamples.length > 0
      ? +(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length).toFixed(2)
      : 0.0;

    socket.send(JSON.stringify({
      type: "web_data",
      id: userId,
      speed: lastSpeed,
      averageSpeed: avgSpeed,
      location: {
        latitude: +currentLatitude.toFixed(6),
        longitude: +currentLongitude.toFixed(6)
      }
    }));

    console.log("전송됨:", lastSpeed.toFixed(2), "m/s | 평균:", avgSpeed.toFixed(2), "m/s");
  }, 2000);
}

navigator.geolocation.watchPosition(
  (pos) => {
    const now = Date.now();
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    if (!gpsStart) {
      gpsStart = { lat, lon, time: now };
    } else {
      const d = calculateDistance(gpsStart.lat, gpsStart.lon, lat, lon);
      gpsDistance = d;
    }

    // 보폭 보정: 10초마다
    if (now - gpsStart.time > 10000 && stepCount > 2) {
      const newStride = gpsDistance / stepCount;
      if (newStride >= 0.3 && newStride <= 1.2) {
        dynamicStride = newStride;
        console.log(`보폭 보정: ${dynamicStride.toFixed(2)} m`);
      }
      gpsStart = null;
      gpsDistance = 0;
      stepCount = 0;
    }

    currentLatitude = lat;
    currentLongitude = lon;
    document.getElementById("lat").textContent = currentLatitude.toFixed(6);
    document.getElementById("lon").textContent = currentLongitude.toFixed(6);
  },
  (err) => console.warn("위치 추적 실패:", err.message),
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
);

function getSignalStateByClock() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const seconds = (now.getMinutes() * 60 + now.getSeconds()) % (greenDuration + redDuration);
  const current = signalState;
  if (seconds < redDuration) {
    signalState = "red";
    signalRemainingTime = redDuration - seconds;
  } else {
    signalState = "green";
    signalRemainingTime = greenDuration - (seconds - redDuration);
  }
  if (current !== signalState) alreadyAnnouncedChange = false;
}

function updateSignalUI() {
  const red = document.getElementById("lightRed");
  const green = document.getElementById("lightGreen");
  red.classList.remove("on");
  green.classList.remove("on");
  if (signalState === "green") green.classList.add("on");
  else red.classList.add("on");
  document.getElementById("countdownNumber").textContent = Math.max(0, Math.floor(signalRemainingTime));
}

function updateMent() {
  const messageEl = document.getElementById("resultText");
  const sec = Math.floor(signalRemainingTime);
  let message = "";
  let spoken = "";

  if (signalState === "red") {
    message = `현재 적색신호,\n 신호 전환까지 ${sec}초 남았습니다.`;
    spoken = `현재 적색신호, 신호 전환까지 ${sec - 2}초 남았습니다.`;
  } else {
    message = `현재 녹색신호,  ${sec}초 남았습니다.`;
    spoken = `현재 녹색신호,  ${sec - 2}초 남았습니다.`;
    if (signalRemainingTime >= allowedTime) {
      message += `\n횡단 가능합니다.`;
      spoken += ` 횡단 가능합니다.`;
    } else {
      message += `\n횡단 불가능합니다.`;
      spoken += ` 횡단 불가능합니다.`;
    }
  }

  messageEl.innerText = message;

  if (justConnected && !initialMessageSpoken && !isSpeaking) {
    speak(spoken);
    initialMessageSpoken = true;
    initialSpoken = true;
    previousSignal = signalState;
    alreadyAnnouncedChange = true;
    twelveSecondAnnounced = (sec <= 12);
    lastCountdownSecond = sec <= 10 ? sec : null;
    justConnected = false;
    return;
  }

  if (!initialSpoken || isSpeaking) return;

  if (signalState !== previousSignal && !alreadyAnnouncedChange) {
    speak(signalState === "green"
      ? "녹색 신호로 변경되었습니다. 건너가십시오."
      : "적색 신호로 변경되었습니다."
    );
    alreadyAnnouncedChange = true;
    previousSignal = signalState;
    twelveSecondAnnounced = false;
    lastCountdownSecond = null;
    return;
  }

  if (sec === 12 && !twelveSecondAnnounced) {
    speak(signalState === "red"
      ? "녹색 신호로 전환됩니다."
      : "적색 신호로 전환됩니다.");
    twelveSecondAnnounced = true;
    return;
  }

  if (sec <= 10 && lastCountdownSecond !== sec) {
    speak(`${sec}초`);
    lastCountdownSecond = sec;
    return;
  }

  if (sec > 10) lastCountdownSecond = null;
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    getSignalStateByClock();
    updateSignalUI();
    updateMent();
  }, 1000);
}


function connect() {
  socket = new WebSocket("wss://041ba76b-1866-418b-8526-3bb61ab0c719-00-2dvb0ldaplvu2.sisko.replit.dev/");
  socket.onopen = () => {
    console.log("WebSocket 연결 완료");
    socket.send(JSON.stringify({ type: "register", id: userId, clientType: "web" }));
    startUploadLoop();
  };
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "crossing_result" && data.webUserId === userId) {
      connected = true;
      justConnected = true;
      initialSpoken = false;
      initialMessageSpoken = false;
      allowedTime = data.allowedTime;
      greenDuration = data.greenDuration || greenDuration;
      redDuration = data.redDuration || redDuration;

      document.getElementById("radarAnimation").style.display = "none";
      document.getElementById("signalBox").style.display = "block";

      startCountdown();
      updateInfoDisplay();  
    }
  };
  
  socket.onerror = (err) => {
    console.error("WebSocket 오류:", err);
  };
}

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  if (typeof DeviceMotionEvent?.requestPermission === "function") {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        alert("센서 권한이 필요합니다.");
        return;
      }
    } catch {
      alert("센서 권한 요청 실패");
      return;
    }
  }
  if (!navigator.geolocation) {
    alert("위치 권한이 필요합니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLatitude = pos.coords.latitude;
      currentLongitude = pos.coords.longitude;
      document.getElementById("lat").textContent = currentLatitude.toFixed(6);
      document.getElementById("lon").textContent = currentLongitude.toFixed(6);
      document.getElementById("requestPermissionButton").style.display = "none";
      document.getElementById("radarAnimation").style.display = "block";
      connect();
      window.addEventListener("devicemotion", handleDeviceMotion, true);
    },
    (err) => {
      alert("위치 권한이 필요합니다.");
      console.warn("위치 권한 거부:", err.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

function updateInfoDisplay() {
  const avg = speedSamples.length > 0
    ? (speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length).toFixed(2)
    : "0.00";

  document.getElementById("infoBox").style.display = "block";

  document.getElementById("info").innerHTML =
    `현재 속도: ${lastSpeed.toFixed(2)} m/s<br>` +
    `평균 속도: ${avg} m/s<br>` +
    `위도: ${currentLatitude.toFixed(6)}<br>` +
    `경도: ${currentLongitude.toFixed(6)}`;
}

document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});
document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});

