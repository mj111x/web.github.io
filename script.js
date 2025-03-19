// ✅ 페이지 전환 기능
document.getElementById("homeButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.add("active");
    document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("myPage").classList.add("active");
});

// ✅ 권한 요청 및 걸음 속도 측정 기능
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
        console.error("🚨 권한 요청 실패:", error);
        alert("권한 요청 중 오류 발생!");
    }
});

// ✅ 가속도 데이터 감지 시작
function startTracking() {
    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleDeviceMotion);
    } else {
        alert("🚨 이 기기는 가속도 센서를 지원하지 않습니다.");
    }
}

// ✅ 걸음 감지 및 속도 측정
let stepCount = 0;
let distance = 0;
let lastStepTime = new Date().getTime();
const avgStrideLength = 0.7;
const STEP_THRESHOLD = 1.5; // 더 높은 감지 값으로 변경
const STEP_INTERVAL = 600; // 최소 걸음 간격 증가

function handleDeviceMotion(event) {
    const accY = event.accelerationIncludingGravity?.y || 0;
    const currentTime = new Date().getTime();

    console.log(`📊 가속도 값: Y=${accY.toFixed(3)}`);

    if (Math.abs(accY) > STEP_THRESHOLD && (currentTime - lastStepTime) > STEP_INTERVAL) {
        stepCount++;
        distance += avgStrideLength;
        lastStepTime = currentTime;
        updateSpeedInfo();
    }
}

// ✅ 속도 계산 및 UI 업데이트
function updateSpeedInfo() {
    const currentTime = new Date().getTime();
    const elapsedTime = (currentTime - lastStepTime) / 1000;
    const speed = distance / elapsedTime;
    const speedKmH = (speed * 3.6).toFixed(2);

    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>걸음 수:</strong> ${stepCount} 걸음<br>
            <strong>이동 거리:</strong> ${distance.toFixed(2)} m<br>
            <strong>현재 속도:</strong> ${speed.toFixed(2)} m/s (${speedKmH} km/h)
        `;
    }
}
