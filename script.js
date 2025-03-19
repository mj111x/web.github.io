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

// 페이지 전환 기능
document.getElementById("homeButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.add("active");
    document.getElementById("myPage").classList.remove("active");
});

document.getElementById("myPageButton").addEventListener("click", () => {
    document.getElementById("homePage").classList.remove("active");
    document.getElementById("myPage").classList.add("active");
});

// WebSocket 연결 설정
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

// 권한 요청
document.getElementById("requestPermissionButton").addEventListener("click", () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then((response) => {
                if (response === 'granted') {
                    console.log("가속도계 권한 허용됨!");
                    resetTest();
                    initDeviceMotionListener();
                } else {
                    console.error("가속도계 권한 거부됨!");
                    alert("가속도계 권한이 필요합니다.");
                }
            })
            .catch((error) => console.error("권한 요청 실패:", error));
    } else {
        console.error("DeviceMotion 권한 요청 필요 없음.");
        resetTest();
        initDeviceMotionListener();
    }
});

// DeviceMotion 리스너 설정
function initDeviceMotionListener() {
    if (window.DeviceMotionEvent) {
        console.log("DeviceMotion API 지원됨.");
        window.addEventListener("devicemotion", handleDeviceMotion);
    } else {
        console.error("DeviceMotion API 미지원 브라우저입니다.");
    }
}

// 초기화 함수
function resetTest() {
    distance = 0;
    stepCount = 0;
    avgStrideLength = 0;
    totalTime = 0;
    filteredAccY = 0;
}

// DeviceMotion 이벤트 핸들러
function handleDeviceMotion(event) {
    const currentTime = new Date().getTime();
    const accY = event.acceleration?.y || 0;

    if (Math.abs(accY) > 1.0 && currentTime - lastStepTime > 800) {
        stepCount++;
        lastStepTime = currentTime;
    }
}

// 데이터 출력
function outputStrideData() {
    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>걸음 수:</strong> ${stepCount}
        `;
    }
}
