let socket = null;
let currentSpeedKmH = 0;
let lastStepTime = Date.now();
let lastMovementTime = Date.now();
let startedWalking = false;
const STEP_THRESHOLD = 1.5;
const STEP_INTERVAL = 500;
const avgStrideLength = 0.7;

document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    const response = await DeviceMotionEvent.requestPermission();
    if (response === "granted") startTracking();
    else alert("🚫 센서 권한이 거부되었습니다.");
  } else startTracking();
});

function startTracking() {
  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  connectWebSocket();
  window.addEventListener("devicemotion", handleDeviceMotion, true);
  setInterval(sendSpeedAndLocation, 5000); // 5초마다
}

function connectWebSocket() {
  socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    console.log("✅ 서버 연결됨");
    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";

    socket.send(JSON.stringify({
      type: "register",
      device: "web",
      id: "20250001"
    }));
  };

  socket.onerror = (err) => console.error("❌ WebSocket 오류:", err);
  socket.onmessage = (msg) => console.log("📨 서버 메시지:", msg.data);
}

function handleDeviceMotion(event) {
  const accX = event.acceleration.x || 0;
  const accY = event.acceleration.y || 0;
  const accZ = event.acceleration.z || 0;
  const currentTime = Date.now();

  if (Math.abs(accY) > STEP_THRESHOLD && currentTime - lastStepTime > STEP_INTERVAL) {
    const stepTime = (currentTime - lastStepTime) / 1000;
    lastStepTime = currentTime;
    lastMovementTime = currentTime;

    const speed = avgStrideLength / stepTime;
    currentSpeedKmH = parseFloat((speed * 3.6).toFixed(2));
    document.getElementById("speedInfo").innerText = `현재 속도: ${currentSpeedKmH} km/h`;

    startedWalking = true;
  }
}

function sendSpeedAndLocation() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const location = { lat: latitude, lng: longitude };

    socket.send(JSON.stringify({
      type: "speed_data",
      id: "20250001",
      speed: currentSpeedKmH,
      location
    }));
  }, (err) => {
    console.warn("❗ 위치 정보 오류:", err);
  });
}
