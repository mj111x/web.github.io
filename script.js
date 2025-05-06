let socket = null;
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

let sendInterval = null;
let gpsInterval = null;
let startedWalking = false;

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        currentLatitude = position.coords.latitude;
        currentLongitude = position.coords.longitude;
      });
    }

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === 'granted') {
        initConnection();
      } else {
        alert("🚫 센서 권한이 거부되었습니다.");
      }
    } else {
      initConnection();
    }
  } catch (err) {
    alert("🚨 센서 권한 요청 중 오류 발생");
    console.error(err);
  }
});

function initConnection() {
  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  connectToServer();
  startGPSUpdates();
  window.addEventListener("devicemotion", handleDeviceMotion, true);
}

function connectToServer() {
  socket = new WebSocket("ws://localhost:8000"); // 🔥 포트 8000 사용

  socket.onopen = () => {
    socketConnected = true;
    console.log("✅ 중앙 서버에 연결됨");
    socket.send(JSON.stringify({ type: "register", id: userId }));

    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";

    startSendingData();
  };

  socket.onerror = (err) => {
    console.error("❌ WebSocket 오류:", err);
  };

  socket.onclose = () => {
    console.warn("🔌 WebSocket 연결 종료됨");
    socketConnected = false;
    clearInterval(sendInterval);
  };
}

function startGPSUpdates() {
  gpsInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(position => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;
    });
  }, 3000);
}

function handleDeviceMotion(event) {
  const accX = event.acceleration.x || 0;
  const accY = event.acceleration.y || 0;
  const accZ = event.acceleration.z || 0;
  const currentTime = Date.now();

  if (Math.abs(accX) < 0.5 && Math.abs(accY) < 0.5 && Math.abs(accZ) < 0.5) return;

  if (
    Math.abs(accY) > STEP_THRESHOLD &&
    Math.abs(accX) < 2 &&
    Math.abs(accZ) < 2 &&
    currentTime - lastStepTime > STEP_INTERVAL
  ) {
    const stepTime = (currentTime - lastStepTime) / 1000;
    lastStepTime = currentTime;
    lastMovementTime = currentTime;

    const speed = avgStrideLength / stepTime;
    currentSpeedKmH = parseFloat((speed * 3.6).toFixed(2));
    updateDisplay();
  }
}

function updateDisplay() {
  document.getElementById("speedInfo").innerHTML = `
    <strong>현재 속도:</strong> ${currentSpeedKmH} km/h<br>
    <strong>위도:</strong> ${currentLatitude}<br>
    <strong>경도:</strong> ${currentLongitude}
  `;
}

function startSendingData() {
  sendInterval = setInterval(() => {
    if (!socketConnected || socket.readyState !== WebSocket.OPEN) return;

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
    console.log("📤 데이터 전송:", payload);
  }, 3000);
}
