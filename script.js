let socketConnected = false;
let currentSpeedKmH = 0;
let currentLatitude = null;
let currentLongitude = null;

const userId = "20250001";

// 권한 요청 후 시작
document.getElementById("requestPermissionButton").addEventListener("click", async () => {
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== 'granted') {
        alert("🚫 센서 권한 거부됨");
        return;
      }
    }

    startTracking();
  } catch (err) {
    alert("🚨 권한 요청 오류");
    console.error(err);
  }
});

function startTracking() {
  console.log("📡 트래킹 시작");

  document.getElementById("requestPermissionButton").style.display = "none";
  document.getElementById("speedInfo").style.display = "block";
  document.getElementById("gpsInfo").style.display = "block";
  document.getElementById("radarAnimation").style.display = "block";

  startLocationTracking();
  tryConnectToServer();
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    alert("❌ 위치 정보 미지원");
    return;
  }

  navigator.geolocation.watchPosition(
    (position) => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;

      console.log("📍 위치 갱신:", currentLatitude, currentLongitude);
      document.getElementById("lat").textContent = currentLatitude.toFixed(6);
      document.getElementById("lon").textContent = currentLongitude.toFixed(6);
    },
    (error) => {
      console.warn("🚫 위치 실패:", error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000
    }
  );
}

function tryConnectToServer() {
  const socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:3000/");

  socket.onopen = () => {
    console.log("✅ 서버 연결 완료");
    socket.send(JSON.stringify({ type: "register", id: userId }));
    window.mySocket = socket;

    document.getElementById("radarAnimation").style.display = "none";
    document.getElementById("trafficLightIllustration").style.display = "block";

    startSpeedUploadLoop(); // 연결 후 바로 데이터 전송 루프 시작
  };

  socket.onerror = (err) => {
    console.error("❌ WebSocket 연결 실패:", err.message);
  };

  socket.onmessage = (event) => {
    console.log("📨 서버 메시지:", event.data);
  };
}

function startSpeedUploadLoop() {
  console.log("🚀 전송 루프 시작");

  setInterval(() => {
    console.log("🕒 전송 조건 검사:", currentLatitude, currentLongitude);

    if (
      currentLatitude === null || currentLongitude === null ||
      isNaN(currentLatitude) || isNaN(currentLongitude)
    ) {
      console.warn("📍 위치 유효하지 않아 전송 생략");
      return;
    }

    const payload = {
      type: "web_data",
      id: userId,
      speed: currentSpeedKmH,
      location: {
        latitude: currentLatitude,
        longitude: currentLongitude
      }
    };

    console.log("📤 전송 데이터:", payload);
    console.log("📡 소켓 상태:", window.mySocket?.readyState);

    if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
      window.mySocket.send(JSON.stringify(payload));
      console.log("✅ 데이터 전송 완료");
    } else {
      console.warn("❌ WebSocket 열려있지 않음");
    }
  }, 3000); // 3초 주기
}
