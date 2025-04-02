// ✅ 페이지 전환
document.getElementById("homeButton").addEventListener("click", () => {
  document.getElementById("homePage").classList.add("active");
  document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
  document.getElementById("homePage").classList.remove("active");
  document.getElementById("myPage").classList.add("active");
});

// ✅ 권한 요청 및 걸음 측정 시작
document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === 'granted') {
        alert("📌 가속도계 권한 허용됨! 걸어보세요.");
        startTracking();
      } else {
        alert("🚨 가속도계 권한이 거부되었습니다.");
      }
    } else {
      startTracking();
    }
  } catch (error) {
    alert("권한 요청 중 오류 발생!");
  }
});

// ✅ 걸음 감지 및 속도 계산
let lastStepTime = Date.now();
let lastUpdateTime = Date.now();
const avgStrideLength = 0.7; // 평균 보폭 (m)
const STEP_THRESHOLD = 1.5;
const STEP_INTERVAL = 500;

function startTracking() {
  if (window.DeviceMotionEvent) {
    window.addEventListener("devicemotion", handleDeviceMotion, true);
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
    lastUpdateTime = currentTime;

    let speed = avgStrideLength / stepTime;
    let speedKmH = (speed * 3.6).toFixed(2);

    updateSpeedInfo(speedKmH);
  }

  // 2초간 감지 없으면 속도 0
  if (currentTime - lastUpdateTime > 2000) {
    updateSpeedInfo(0);
  }
}

// ✅ 속도 출력 + 중앙 서버 전송
function updateSpeedInfo(speedKmH) {
  const speedInfo = document.getElementById("speedInfo");
  speedInfo.innerHTML = `<strong>현재 속도:</strong> ${speedKmH} km/h`;

  // 중앙 서버에 전송
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "speed_data",
        id: "20250001",
        speed: parseFloat(speedKmH),
      })
    );
  }
}

// ✅ WebSocket 연결
const radar = document.getElementById("radarAnimation");
const trafficLight = document.getElementById("trafficLightIllustration");

const socket = new WebSocket(
  "wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/"
);

socket.onopen = () => {
  console.log("✅ 중앙 서버에 연결됨");

  // 등록 메시지 전송
  socket.send(
    JSON.stringify({
      type: "register",
      id: "20250001",
    })
  );

  // 파동 숨기고 신호등 표시
  if (radar) radar.style.display = "none";
  if (trafficLight) trafficLight.style.display = "block";
};

socket.onerror = (error) => {
  console.error("❌ WebSocket 연결 오류:", error);
};

socket.onmessage = (event) => {
  console.log("📨 서버로부터 메시지:", event.data);
};
