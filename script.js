/*
// WebSocket 연결 및 메시지 처리
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
    // WebSocket 연결이 성공적으로 이루어진 후 클라이언트로부터 'ping' 메시지를 전송합니다.
    const pingData = {
        type: 'ping',
        id: '웹페이지-001',  // 웹 페이지의 고유 ID 설정
        signalStrength: Math.random() * 100  // 임의의 신호 강도 값 설정
    };
    socket.send(JSON.stringify(pingData));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);  // 받은 메시지를 JSON 객체로 변환
    console.log('서버로부터 받은 메시지:', data);

    // 서버로부터 받은 가장 가까운 Raspberry Pi 정보 처리
    if (data.type === 'offer') {
        // Raspberry Pi의 정보 (ID, 신호 강도, 연결 시간)을 화면에 표시
        displayRaspberryPiInfo(data);
    }
};

// Raspberry Pi 정보 화면에 출력하는 함수
function displayRaspberryPiInfo(data) {
    const infoElement = document.getElementById('raspberryPiInfo');

    // Raspberry Pi 정보 출력
    if (infoElement) {

        const connectionTime = new Date(data.pingTime);  // 서버에서 받은 pingTime을 Date 객체로 변환
        const formattedTime = connectionTime.toLocaleString();  // 로컬 시간 형식으로 변환

        infoElement.innerHTML = `
            <p><strong>Raspberry Pi ID:</strong> ${data.piId || '정보 없음'}</p>
            <p><strong>신호 강도:</strong> ${data.signalStrength ? data.signalStrength.toFixed(2) : '정보 없음'}</p>
            <p><strong>연결 시간:</strong> ${formattedTime || '정보 없음'}</p>
            <p><strong>파일 데이터:</strong> ${data.inputData || '파일 정보 없음'}</p>
        `;
    }
}

socket.onerror = (error) => {
    console.log('WebSocket 에러:', error);
};

socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};
*/
// WebSocket 연결 및 메시지 처리
// WebSocket 연결 설정
// WebSocket 연결 설정
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
    const pingData = {
        type: 'ping',
        id: '웹페이지-001',  
        signalStrength: Math.random() * 100  // 임의의 신호 강도 값
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

// Raspberry Pi 정보 화면 출력
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

socket.onerror = (error) => {
    console.log('WebSocket 에러:', error);
};

socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};
// 권한 요청 버튼 클릭 이벤트
document.getElementById("requestPermissionButton").addEventListener("click", () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then((response) => {
                if (response === 'granted') {
                    console.log("가속도계 권한 허용됨!");
                    initDeviceMotionListener();
                } else {
                    console.error("가속도계 권한 거부됨!");
                    alert("가속도계 권한이 필요합니다.");
                }
            })
            .catch((error) => console.error("권한 요청 실패:", error));
    } else {
        console.error("DeviceMotion 권한 요청 필요 없음.");
        initDeviceMotionListener(); // iOS 이외의 브라우저
    }
});

// DeviceMotion 리스너 등록 함수
function initDeviceMotionListener() {
    if (window.DeviceMotionEvent) {
        console.log("DeviceMotion API 지원됨.");
        window.addEventListener("devicemotion", handleDeviceMotion);
    } else {
        console.error("DeviceMotion API 미지원 브라우저입니다.");
    }
}

// 보폭 계산 변수
let lastTime = new Date().getTime();
let speedY = 0, distance = 0, stepCount = 0;

// 가속도 임계값 필터
const NOISE_THRESHOLD = 0.5;  // 노이즈 필터
const STEP_THRESHOLD = 1.5;   // 걸음 검출 기준 가속도 값

// DeviceMotion 이벤트 핸들러
function handleDeviceMotion(event) {
    const currentTime = new Date().getTime();
    const deltaTime = (currentTime - lastTime) / 1000;  // 초 단위 시간 차이

    // Y축 가속도 값 (중력 제거)
    const accY = event.acceleration?.y || 0;

    // 노이즈 필터 적용
    if (Math.abs(accY) < NOISE_THRESHOLD) {
        return;  // 노이즈로 간주하고 무시
    }

    // 속도 계산 (초당)
    speedY += accY * deltaTime;

    // 이동 거리 계산
    const deltaDistance = speedY * deltaTime;
    distance += Math.abs(deltaDistance);

    // 걸음 검출 (Y축 가속도 값이 일정 기준 초과 시)
    if (Math.abs(accY) > STEP_THRESHOLD) {
        stepCount++;
    }

    // 보폭 계산 (걸음 수가 0 이상일 경우)
    const strideLength = stepCount > 0 ? (distance / stepCount).toFixed(2) : 0;

    // 보폭 정보 업데이트
    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>보폭 속도:</strong> ${speedY.toFixed(2)} m/s
            <br><strong>이동 거리:</strong> ${distance.toFixed(2)} m
            <br><strong>걸음 수:</strong> ${stepCount}
            <br><strong>평균 보폭 길이:</strong> ${strideLength} m
        `;
    }

    lastTime = currentTime;  // 마지막 업데이트 시간 갱신
}
