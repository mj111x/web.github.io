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

let connectionInterval = null;
let speedInterval = null;
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
        startTracking();
      } else {
        alert("🚫 센서 권한이 거부되었습니다.");
      }
    } else {
      startTracking();
    }
  } catch (err) {
    alert("🚨 센서 권한 요청 중 오류 발생");
    console.error(err);
  }
});

function startTracking() {
  console.log("📌 측정 시작!");
  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  window.addEventListener("devicemotion", handleDeviceMotion, true);
  navigator.geolocation.watchPosition(position => {
    currentLatitude = position.coords.latitude;
    currentLongitude = position.coords.longitude;
  });

  connectionInterval = setInterval(tryConnectToServer, 3000);
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
    let stepTime = (currentTime - lastStepTime) / 1000;
    lastStepTime = currentTime;
    lastMovementTime = currentTime;

    let speed = avgStrideLength / stepTime;
    currentSpeedKmH = parseFloat((speed * 3.6).toFixed(2));
    updateSpeedDisplay(currentSpeedKmH);

    if (!startedWalking) {
      startedWalking = true;
      startSpeedUploadLoop();
    }
  }
}

function updateSpeedDisplay(speed) {
  const speedInfo = document.getElementById("speedInfo");
  speedInfo.innerHTML = `<strong>현재 속도:</strong> ${speed} km/h`;
}

function tryConnectToServer() {
  if (socketConnected) return;

  console.log("🔄 중앙 서버 연결 시도 중...");
  const socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    console.log("✅ 중앙 서버 연결 완료!");
    socketConnected = true;

    clearInterval(connectionInterval);
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";

    socket.send(JSON.stringify({ type: "register", id: userId }));
    window.mySocket = socket;
  };

  socket.onerror = (err) => {
    console.warn("❌ 서버 연결 실패. 재시도 대기 중...");
  };

  socket.onmessage = (event) => {
    console.log("📨 서버 메시지:", event.data);
  };
}

function startSpeedUploadLoop() {
  speedInterval = setInterval(() => {
    const now = Date.now();
    const idleTime = now - lastMovementTime;

    if (idleTime > 2 * 60 * 1000) return;

    if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
      window.mySocket.send(JSON.stringify({
        type: "web_data",
        id: userId,
        speed: currentSpeedKmH,
        location: {
          latitude: currentLatitude,
          longitude: currentLongitude
        }
      }));
    }
  }, 5000); // 5초마다
}
