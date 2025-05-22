// ✅ 웹페이지 script.js (시나리오 기반 최종 개선 버전)
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

function speak(text) {
  if ('speechSynthesis' in window && text !== lastSpoken) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
    lastSpoken = text;
  }
}

function updateSignalUI() {
  document.getElementById("signalBox").style.display = "block";
  const red = document.getElementById("lightRed");
  const green = document.getElementById("lightGreen");
  red.classList.remove("on");
  green.classList.remove("on");

  if (signalState === "red") red.classList.add("on");
  else green.classList.add("on");

  document.getElementById("countdownNumber").textContent = Math.max(0, Math.floor(signalRemainingTime));
}

function updateMent() {
  const messageEl = document.getElementById("resultText");
  const sec = Math.floor(signalRemainingTime);
  let message = "";
  let color = "black";

  if (signalState === "red") {
    message = `현재 적색신호입니다. 녹색으로 전환까지 ${sec}초 남았습니다.`;
    color = "red";
  } else {
    if (signalRemainingTime >= allowedTime) {
      message = `현재 녹색 신호이며, ${sec}초 남았습니다. 건너가세요.`;
      color = "green";
    } else {
      message = `현재 녹색 신호이며, ${sec}초 남았습니다. 다음 신호를 기다리세요.`;
      color = "red";
    }
  }

  messageEl.textContent = message;
  messageEl.style.color = color;

  if (previousSignal !== signalState) {
    speak(message);
    countdownSpoken = false;
    previousSignal = signalState;
  }

  if (sec === 10 && !countdownSpoken) {
    countdownSpoken = true;
    for (let i = 10; i >= 1; i--) {
      setTimeout(() => speak(`${i}초`), (10 - i) * 1000);
    }
  }
}

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (signalRemainingTime > 0) {
      signalRemainingTime--;
      updateSignalUI();
      updateMent();
      console.log("🔁 카운트:", signalRemainingTime, "신호:", signalState);
    } else {
      clearInterval(countdownInterval);
    }
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
      signalRemainingTime = data.remainingGreenTime;
      signalState = data.signalState;
      allowedTime = data.allowedTime;

      document.getElementById("radarAnimation").style.display = "none";
      document.getElementById("signalBox").style.display = "block";

      updateSignalUI();
      updateMent();
      updateInfoDisplay();
      startCountdown();
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
