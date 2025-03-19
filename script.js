document.getElementById("homeButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.add("active");
    document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("myPage").classList.add("active");
});

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

function startTracking() {
    if (window.DeviceMotionEvent) {
        console.log("📌 가속도 감지 시작!");
        window.addEventListener("devicemotion", handleDeviceMotion, true);
    } else {
        alert("🚨 이 기기는 가속도 센서를 지원하지 않습니다.");
    }
}

// ✅ 걸음 감지 및 속도 측정
let stepCount = 0;
let distance = 0;
let lastStepTime = new Date().getTime();
let lastUpdateTime = new Date().getTime();
const avgStrideLength = 0.7; // 평균 보폭 (m)
const STEP_THRESHOLD = 1.5; // 더 큰 움직임만 감지
const STEP_INTERVAL = 500; // 걸음 간격 조정

function handleDeviceMotion(event) {
    const accX = event.acceleration.x || 0;
    const accY = event.acceleration.y || 0;
    const accZ = event.acceleration.z || 0;
    const currentTime = new Date().getTime();

    // 📌 너무 작은 움직임은 무시
    if (Math.abs(accX) < 0.5 && Math.abs(accY) < 0.5 && Math.abs(accZ) < 0.5) {
        return;
    }

    // 📌 걸음 감지 기준 강화 (Y축만이 아니라 X, Z축 포함)
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

    // 📌 2초 동안 걸음이 없으면 속도를 0으로 설정
    if (currentTime - lastUpdateTime > 2000) {
        updateSpeedInfo(0, 0);
    }
}

function updateSpeedInfo(speed, speedKmH) {
    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>걸음 수:</strong> ${stepCount} 걸음<br>
            <strong>이동 거리:</strong> ${distance.toFixed(2)} m<br>
            <strong>현재 속도:</strong> ${speed.toFixed(2)} m/s (${speedKmH} km/h)
        `;
    }
}
