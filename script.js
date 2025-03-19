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

// ✅ Raspberry Pi 정보 표시
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

// ✅ 걸음 속도 측정 기능 (최적화된 버전)
let stepCount = 0;
let distance = 0;
let lastStepTime = 0;
let lastUpdateTime = 0;
const avgStrideLength = 0.7; // 평균 보폭 (m)
const STEP_THRESHOLD = 1.2; // 걸음 감지 임계값
const STEP_INTERVAL = 400; // 최소 걸음 간격 (ms)

// 권한 요청 후 가속도 감지 시작
document.getElementById("requestPermissionButton").addEventListener("click", () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    console.log("가속도계 권한 허용됨!");
                    startTracking();
                } else {
                    alert("가속도계 권한이 필요합니다.");
                }
            })
            .catch(error => console.error("권한 요청 실패:", error));
    } else {
        startTracking();
    }
});

// 걸음 감지 시작
function startTracking() {
    if (window.DeviceMotionEvent) {
        console.log("DeviceMotion 이벤트 등록됨.");
        window.addEventListener("devicemotion", handleDeviceMotion);
        lastUpdateTime = new Date().getTime();
    } else {
        console.error("이 브라우저는 가속도 센서를 지원하지 않습니다.");
    }
}

// 걸음 감지 & 속도 측정
function handleDeviceMotion(event) {
    const accY = event.accelerationIncludingGravity?.y || 0;
    const currentTime = new Date().getTime();
    
    // 🏃‍♂️ 걸음 감지 로직 (걸음 발생)
    if (Math.abs(accY) > STEP_THRESHOLD && (currentTime - lastStepTime) > STEP_INTERVAL) {
        stepCount++;
        distance += avgStrideLength; // 보폭을 이용해 거리 계산
        lastStepTime = currentTime;
    }

    // ⏱ 속도 계산 (일정 시간마다 업데이트)
    if (currentTime - lastUpdateTime > 1000) { // 1초마다 업데이트
        updateSpeedInfo(currentTime);
        lastUpdateTime = currentTime;
    }
}

// 🚀 속도 정보 UI 업데이트
function updateSpeedInfo(currentTime) {
    const elapsedTime = (currentTime - lastStepTime) / 1000; // 마지막 걸음 이후 경과 시간(초)
    const speed = elapsedTime > 0 ? (distance / elapsedTime) : 0; // 속도 (m/s)
    const speedKmH = (speed * 3.6).toFixed(2); // 속도를 km/h로 변환

    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>걸음 수:</strong> ${stepCount} 걸음<br>
            <strong>이동 거리:</strong> ${distance.toFixed(2)} m<br>
            <strong>현재 속도:</strong> ${speed.toFixed(2)} m/s (${speedKmH} km/h)
        `;
    }
}
