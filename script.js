// ✅ 페이지 전환
document.getElementById("homeButton").addEventListener("click", () => {
  document.getElementById("homePage").classList.add("active");
  document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
  document.getElementById("homePage").classList.remove("active");
  document.getElementById("myPage").classList.add("active");
});

// ✅ 걸음 감지 및 속도 측정
let lastStepTime = Date.now();
let lastMovementTime = Date.now();
const avgStrideLength = 0.7; // 평균 보폭
const STEP_THRESHOLD = 1.5;
const STEP_INTERVAL = 500;
let currentSpeedKmH = 0;
let hasStartedWalking = false;

function startTracking() {
  if (window.DeviceMotionEvent) {
    window.addEventListener("devicemotion", handleDeviceMotion, true);
    console.log("📌 가속도 감지 시작됨!");
  } else {
    alert("🚨 이 기기는 가속도 센서를 지원하지 않습니다.");
  }
}

function handleDeviceMotion(event) {
  const accX = event.acceleration.x || 0;
  const accY = event.acceleration.y || 0;
  const accZ = event.acceleration.z || 0;
  const currentTime = Date.now();

  // 작은 움직임 무시
  if (Math.abs(accX) < 0.5 && Math.abs(accY) < 0.5 && Math.abs(accZ) < 0.5) return;

  // 걸음 감지
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

    if (!hasStartedWalking) {
      hasStartedWalking = true;
      startSpeedUpdateLoop();
    }
  }
}

// ✅ 속도 표시 위치 업데이트
function updateSpeedDisplay(speed) {
  const speedInfo = document.getElementById("speedInfo");
  speedInfo.innerHTML = `<strong>현재 속도:</strong> ${speed} km/h`;
}

// ✅ 1분 간격 속도 전송, 2분 이상 움직임 없으면 중단
function startSpeedUpdateLoop() {
  setInterval(() => {
    const now = Date.now();
    const idleTime = now - lastMovementTime;

    if (idleTime > 2 * 60 * 1000) {
      console.log("⏸️ 2분 이상 움직임 없음 - 속도 업데이트 중단");
      return;
    }

    if (socket.readyState === WebSocket.OPEN) {
      console.log("🚀 중앙 서버에 속도 전송:", currentSpeedKmH);
      socket.send(JSON.stringify({
        type: "speed_data",
        id: "20250001",
        speed: currentSpeedKmH
      }));
    }
  }, 60 * 1000); // 1분 간격
}

// ✅ WebSocket 연결 및 등록
const radar = document.getElementById("radarAnimation");
const trafficLight = document.getElementById("trafficLightIllustration");

const socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/");

socket.onopen = () => {
  console.log("✅ 중앙 서버에 연결됨");

  // 파동 제거하고 신호등 표시
  if (radar) radar.style.display = "none";
  if (trafficLight) trafficLight.style.display = "block";

  // ID 등록
  socket.send(JSON.stringify({
    type: "register",
    id: "20250001"
  }));
};

socket.onerror = (error) => {
  console.error("❌ WebSocket 오류:", error);
};

socket.onmessage = (event) => {
  console.log("📨 서버 메시지:", event.data);
};

// ✅ 페이지 로드시 자동으로 측정 시작
window.addEventListener("load", () => {
  startTracking(); // 권한 없이 자동 측정
});
