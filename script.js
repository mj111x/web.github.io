// 페이지 전환
document.getElementById("homeButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.add("active");
    document.getElementById("myPage").classList.remove("active");
  });
  
  document.getElementById("myPageButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("myPage").classList.add("active");
  });
  
  // 가속도 권한 요청
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
  
  // 가속도 감지
  function startTracking() {
    if (window.DeviceMotionEvent) {
      console.log("📌 가속도 감지 시작!");
      window.addEventListener("devicemotion", handleDeviceMotion, true);
    } else {
      alert("🚨 이 기기는 가속도 센서를 지원하지 않습니다.");
    }
  }
  
  let stepCount = 0;
  let distance = 0;
  let lastStepTime = Date.now();
  let lastUpdateTime = Date.now();
  const avgStrideLength = 0.7;
  const STEP_THRESHOLD = 1.5;
  const STEP_INTERVAL = 500;
  
  function handleDeviceMotion(event) {
    const accX = event.acceleration.x || 0;
    const accY = event.acceleration.y || 0;
    const accZ = event.acceleration.z || 0;
    const currentTime = Date.now();
  
    if (Math.abs(accX) < 0.5 && Math.abs(accY) < 0.5 && Math.abs(accZ) < 0.5) return;
  
    if (Math.abs(accY) > STEP_THRESHOLD && Math.abs(accX) < 2 && Math.abs(accZ) < 2 &&
        (currentTime - lastStepTime) > STEP_INTERVAL) {
      let stepTime = (currentTime - lastStepTime) / 1000;
      stepCount++;
      distance += avgStrideLength;
      lastStepTime = currentTime;
  
      let speed = stepTime > 0 ? avgStrideLength / stepTime : 0;
      let speedKmH = (speed * 3.6).toFixed(2);
      lastUpdateTime = currentTime;
  
      updateSpeedInfo(speed, speedKmH);
    }
  
    if (currentTime - lastUpdateTime > 2000) {
      updateSpeedInfo(0, 0);
    }
  }
  
  function updateSpeedInfo(speed, speedKmH) {
    const speedInfo = document.getElementById("speedInfo");
    speedInfo.innerHTML = `
      <strong>걸음 수:</strong> ${stepCount} 걸음<br>
      <strong>이동 거리:</strong> ${distance.toFixed(2)} m<br>
      <strong>현재 속도:</strong> ${speed.toFixed(2)} m/s (${speedKmH} km/h)
    `;
  }
  
  // ✅ WebSocket 연결 (등록 메시지 포함)
  const trafficLight = document.getElementById("trafficLightIllustration");
  const socket = new WebSocket("wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/");
  
  socket.onopen = () => {
    console.log("✅ 중앙 서버에 WebSocket 연결됨");
  
    // 📡 register 메시지 전송
    socket.send(JSON.stringify({
      type: "register",
      id: "web-client"
    }));
  
    // 연결되면 신호등 표시
    trafficLight.style.display = "block";
  };
  
  socket.onerror = (error) => {
    console.error("❌ WebSocket 오류:", error);
  };
  
  socket.onmessage = (event) => {
    console.log("📨 서버로부터 메시지:", event.data);
  };
  