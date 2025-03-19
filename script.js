// 페이지 전환 기능
document.getElementById("homeButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.add("active");
    document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("myPage").classList.add("active");
});

// WebSocket 연결
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
    const pingData = {
        type: 'ping',
        id: '웹페이지-001',
        signalStrength: Math.random() * 100
    };
    socket.send(JSON.stringify(pingData));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('서버로부터 받은 메시지:', data);
    if (data.type === 'offer') {
        displayRaspberryPiInfo(data);
    }
};

// Raspberry Pi 정보 표시
function displayRaspberryPiInfo(data) {
    const infoElement = document.getElementById('raspberryPiInfo');
    if (infoElement) {
        const connectionTime = new Date(data.pingTime);
        const formattedTime = connectionTime.toLocaleString();
        infoElement.innerHTML = `
            <p><strong>Raspberry Pi ID:</strong> ${data.piId || '정보 없음'}</p>
            <p><strong>신호 강도:</strong> ${data.signalStrength ? data.signalStrength.toFixed(2) : '정보 없음'}</p>
            <p><strong>연결 시간:</strong> ${formattedTime || '정보 없음'}</p>
            <p><strong>파일 데이터:</strong> ${data.inputData || '파일 정보 없음'}</p>
        `;
    }
}

// --- ✅ 걸음 속도 측정 기능 추가 ✅ ---

// 걸음 및 속도 관련 변수
let stepCount = 0;
let distance = 0;
let lastStepTime = new Date().getTime();
const avgStrideLength = 0.7;  // 평균 보폭 (m)
const STEP_THRESHOLD = 1.0;
const STEP_INTERVAL = 800;

// 걸음 속도 측정 시작 (권한 요청)
document.getElementById("requestPermissionButton").addEventListener("click", () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    console.log("가속도계 권한 허용됨!");
                    window.addEventListener("devicemotion", handleDeviceMotion);
                } else {
                    alert("가속도계 권한이 필요합니다.");
                }
            })
            .catch(error => console.error("권한 요청 실패:", error));
    } else {
        window.addEventListener("devicemotion", handleDeviceMotion);
    }
});

// 걸음 감지 및 속도 계산
function handleDeviceMotion(event) {
    const accY = event.accelerationIncludingGravity?.y || 0;
    const currentTime = new Date().getTime();
    const timeElapsed = (currentTime - lastStepTime) / 1000;  // 초 단위 변환

    if (Math.abs(accY) > STEP_THRESHOLD && currentTime - lastStepTime > STEP_INTERVAL) {
        stepCount++;
        distance += avgStrideLength;  // 거리 계산
        lastStepTime = currentTime;

        updateSpeedInfo(timeElapsed);
    }
}

// 속도 정보 업데이트
function updateSpeedInfo(timeElapsed) {
    const speed = distance / timeElapsed;  // 속도 (m/s)
    const speedKmH = (speed * 3.6).toFixed(2);  // km/h 변환

    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>걸음 수:</strong> ${stepCount} 걸음<br>
            <strong>이동 거리:</strong> ${distance.toFixed(2)} m<br>
            <strong>현재 속도:</strong> ${speed.toFixed(2)} m/s (${speedKmH} km/h)
        `;
    }
}
