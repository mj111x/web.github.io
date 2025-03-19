// ✅ 페이지 전환 기능
document.getElementById("homeButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.add("active");
    document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("myPage").classList.add("active");
});

// ✅ WebSocket 연결
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
};

// ✅ 걸음 속도 측정 기능
let stepCount = 0;
let distance = 0;
const avgStrideLength = 0.7;
const STEP_THRESHOLD = 1.2;
const STEP_INTERVAL = 400;

// 🚀 **권한 요청 버튼 클릭 이벤트**
document.getElementById("requestPermissionButton").addEventListener("click", async () => {
    try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            const response = await DeviceMotionEvent.requestPermission();
            if (response === 'granted') {
                console.log("📌 가속도계 권한 허용됨!");
                alert("권한이 허용되었습니다! 걸어보세요.");
                startTracking();
            } else {
                alert("🚨 가속도계 권한이 거부되었습니다.");
            }
        } else {
            console.log("📌 권한 요청 불필요 (이전 브라우저)");
            startTracking();
        }
    } catch (error) {
        console.error("🚨 권한 요청 실패:", error);
        alert("권한 요청 중 오류 발생!");
    }
});

// 🚀 **가속도 데이터 감지 시작**
function startTracking() {
    if (window.DeviceMotionEvent) {
        console.log("📌 DeviceMotion 감지 시작!");
        window.addEventListener("devicemotion", handleDeviceMotion);
    } else {
        alert("🚨 이 기기는 가속도 센서를 지원하지 않습니다.");
    }
}

// 🚀 **걸음 감지 및 속도 측정**
function handleDeviceMotion(event) {
    const accY = event.accelerationIncludingGravity?.y || 0;
    const currentTime = new Date().getTime();
    console.log(`📊 가속도 값: Y=${accY.toFixed(3)}`);

    if (Math.abs(accY) > STEP_THRESHOLD && currentTime - lastStepTime > STEP_INTERVAL) {
        stepCount++;
        distance += avgStrideLength;
        lastStepTime = currentTime;
        updateSpeedInfo();
    }
}

// 🚀 **속도 정보 업데이트**
function updateSpeedInfo() {
    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>걸음 수:</strong> ${stepCount} 걸음<br>
            <strong>이동 거리:</strong> ${distance.toFixed(2)} m
        `;
    }
}
