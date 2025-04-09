let socketConnected = false;
let currentSpeedKmH = 0;
let lastStepTime = Date.now();
let lastMovementTime = Date.now();
let currentLat = null;
let currentLng = null;

const avgStrideLength = 0.7;
const STEP_THRESHOLD = 1.5;
const STEP_INTERVAL = 500;
const userId = "20250001";

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    // 위치 권한 요청
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;
        startTracking();
      },
      (err) => {
        alert("위치 권한 필요: " + err.message);
      }
    );

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== 'granted') {
        alert("센서 권한 거부됨");
        return;
      }
    }
  } catch (err) {
    alert("센서 권한 요청 오류");
    console.error(err);
  }
});

function startTracking() {
  console.log("📌 측정 시작!");
  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  navigator.geolocation.watchPosition((pos) => {
    currentLat = pos.coords.latitude;
    currentLng = pos.coords.longitude;
  });

  window.addEventListener("devicemotion", handleDeviceMotion, true);
  setInterval(tryConnectToServer, 3000);
}

function handleDeviceMotion(event) {
  const accY = event.acceleration.y || 0;
  const accX = event.acceleration.x || 0;
  const accZ = event.acceleration.z || 0;
  const currentTime = Date.now();

  if (Math.abs(accY) > STEP_THRESHOLD &&
      Math.abs(accX) < 2 &&
      Math.abs(accZ) < 2 &&
      currentTime - lastStepTime > STEP_INTERVAL) {
    
    let stepTime = (currentTime - lastStepTime) / 1000;
    lastStepTime = currentTime;
    lastMovementTime = currentTime;

    let speed = avgStrideLength / stepTime;
    currentSpeedKmH = parseFloat((speed * 3.6).toFixed(2));
    updateSpeedDisplay(currentSpeedKmH);
  }
}

function updateSpeedDisplay(speed) {
  const speedInfo = document.getElementById("speedInfo");
  speedInfo.innerHTML = `<strong>현재 속도:</strong> ${speed} km/h`;
}

function tryConnectToServer() {
  if (socketConnected) return;

  const socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    socketConnected = true;
    console.log("✅ 서버 연결됨");
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";

    socket.send(JSON.stringify({ type: "register", id: userId }));

    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN && currentLat && currentLng) {
        socket.send(JSON.stringify({
          type: "web_data",
          id: userId,
          speed: currentSpeedKmH,
          latitude: currentLat,
          longitude: currentLng
        }));
        console.log("🚀 웹 데이터 전송됨");
      }
    }, 5000);
  };

  socket.onerror = (err) => {
    console.warn("서버 연결 실패", err);
  };

  window.mySocket = socket;
}
