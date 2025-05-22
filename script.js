// ✅ 웹페이지 script.js (TTS 개선 최종: 최초 연결, 신호 변경, 12초 예고, 10초 카운트다운)
let socket;
let currentLatitude = 0;
let currentLongitude = 0;
let lastSpeed = 0;
let lastSpeedUpdateTime = 0;
let speedSamples = [];

const userId = "20250001";
const SPEED_CUTOFF = 0.3;
let signalRemainingTime = 0;
let signalState = "red";
let allowedTime = 999;
let countdownInterval = null;
let previousSignal = null;
let lastSpoken = "";
let countdownSpoken = false;
let connected = false;
let greenDuration = 30;
let redDuration = 30;
let justConnected = true;
let twelveSecondAnnounced = false;
let alreadyAnnouncedChange = false;
let initialSpoken = false;

function speak(text) {
  if ('speechSynthesis' in window && text !== lastSpoken) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 1.2; // ✅ 말하는 속도 빠르게 설정
    synth.cancel();
    setTimeout(() => synth.speak(utter), 100);
    lastSpoken = text;
  }
}

function getSignalStateByClock() {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // ✅ KST 기준
  const seconds = (now.getMinutes() * 60 + now.getSeconds()) % (greenDuration + redDuration);
  const current = signalState;
  if (seconds < redDuration) {
    signalState = "red";
    signalRemainingTime = redDuration - seconds;
  } else {
    signalState = "green";
    signalRemainingTime = greenDuration - (seconds - redDuration);
  }
  if (current !== signalState) {
    alreadyAnnouncedChange = false;
  }
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
    message = `현재 적색신호입니다.\n녹색 신호로 전환되기까지 ${sec}초 남았습니다.`;
    spoken = `현재 적색신호입니다. 녹색 신호로 전환되기까지 ${sec}초 남았습니다.`;
  } else {
    message = `현재 녹색신호이며, ${sec}초 남았습니다.`;
    spoken = `현재 녹색신호이며, ${sec}초 남았습니다.`;
    if (signalRemainingTime >= allowedTime) {
      message += `\n횡단 가능합니다.`;
      spoken += ` 횡단 가능합니다.`;
    } else {
      message += `\n횡단 불가능합니다.`;
      spoken += ` 횡단 불가능합니다.`;
    }
  }
  messageEl.innerText = message;

  if (justConnected && !initialSpoken) {
    speak(spoken);
    initialSpoken = true;
  }

  if (signalState !== previousSignal && !alreadyAnnouncedChange) {
    speak(signalState === "green" ? "녹색 신호로 변경되었습니다. 건너가십시오." : "적색 신호로 변경되었습니다.");
    previousSignal = signalState;
    alreadyAnnouncedChange = true;
  }

  if (sec === 12 && !twelveSecondAnnounced) {
    speak(signalState === "red" ? "녹색 신호로 전환됩니다." : "적색 신호로 전환됩니다.");
    twelveSecondAnnounced = true;
  }
  if (sec !== 12) twelveSecondAnnounced = false;

  if (sec <= 10 && !countdownSpoken) {
    countdownSpoken = true;
    for (let i = sec; i >= 1; i--) {
      setTimeout(() => speak(`${i}초`), (sec - i) * 1000);
    }
  }
  if (sec > 10) countdownSpoken = false;
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    getSignalStateByClock();
    updateSignalUI();
    updateMent();
  }, 1000);
}

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

function startUploadLoop() {
  setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN || connected) return;
    const now = Date.now();
    const isStale = now - lastSpeedUpdateTime > 1000;
    const finalSpeed = (!isStale && lastSpeed >= SPEED_CUTOFF) ? lastSpeed : 0.0;
    const avgSpeed = speedSamples.length > 0
      ? +(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length).toFixed(2)
      : 0.0;
    socket.send(JSON.stringify({
      type: "web_data",
      id: userId,
      speed: finalSpeed,
      averageSpeed: avgSpeed,
      location: {
        latitude: +currentLatitude.toFixed(6),
        longitude: +currentLongitude.toFixed(6)
      }
    }));
  }, 1000);
}

function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const now = Date.now();
  if (Math.abs(accY) > 2.5 && now - lastSpeedUpdateTime > 800) {
    const stepTime = (now - lastSpeedUpdateTime) / 1000;
    const speed = Math.min(0.45 / stepTime * 3.6, 3);
    lastSpeed = +speed.toFixed(2);
    lastSpeedUpdateTime = now;
    if (lastSpeed >= SPEED_CUTOFF) speedSamples.push(lastSpeed);
  }
}

function connect() {
  socket = new WebSocket("wss://041ba76b-1866-418b-8526-3bb61ab0c719-00-2dvb0ldaplvu2.sisko.replit.dev/");
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "register", id: userId, clientType: "web" }));
    startUploadLoop();
    speak("보행자 시스템에 연결되었습니다.");
  };
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "crossing_result" && data.webUserId === userId) {
      connected = true;
      justConnected = true;
      initialSpoken = false;
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
    console.error("❌ WebSocket 연결 실패:", err);
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
    alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
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
      navigator.geolocation.watchPosition(
        (pos) => {
          currentLatitude = pos.coords.latitude;
          currentLongitude = pos.coords.longitude;
          document.getElementById("lat").textContent = currentLatitude.toFixed(6);
          document.getElementById("lon").textContent = currentLongitude.toFixed(6);
        },
        (err) => console.warn("❌ 위치 추적 실패:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      window.addEventListener("devicemotion", handleDeviceMotion, true);
    },
    (err) => {
      alert("위치 권한이 필요합니다.");
      console.warn("위치 권한 거부:", err.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

document.getElementById("homeBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "block";
  document.getElementById("mypage").style.display = "none";
});
document.getElementById("mypageBtn").addEventListener("click", () => {
  document.getElementById("homePage").style.display = "none";
  document.getElementById("mypage").style.display = "block";
});
