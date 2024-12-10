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
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
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

    if (data.type === 'offer') {
        // 서버로부터 받은 Raspberry Pi 정보 표시
        displayRaspberryPiInfo(data);
    }
};

// Raspberry Pi 정보 화면에 출력하는 함수
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
            <p id="speedInfo"><strong>보폭 속도:</strong> 계산 중...</p>
        `;
    }
}

socket.onerror = (error) => {
    console.log('WebSocket 에러:', error);
};

socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};

// 보폭 속도 계산 (DeviceMotion API 사용)
let speedY = 0; 
let distance = 0; 
let lastTime = new Date().getTime(); 

window.addEventListener("devicemotion", (event) => {
    const currentTime = new Date().getTime();
    const deltaTime = (currentTime - lastTime) / 1000;  // 초 단위 시간 변화
    const accY = event.accelerationIncludingGravity.y || 0;  // Y축 가속도 가져오기

    // 속도 계산 및 거리 업데이트
    speedY += accY * deltaTime;
    const deltaDistance = speedY * deltaTime;
    distance += Math.abs(deltaDistance);

    // 보폭 속도 정보 업데이트
    const speedInfoElement = document.getElementById("speedInfo");
    if (speedInfoElement) {
        speedInfoElement.innerHTML = `
            <strong>보폭 속도:</strong> ${speedY.toFixed(2)} m/s
            <br><strong>이동 거리:</strong> ${distance.toFixed(2)} m
        `;
    }

    lastTime = currentTime;  // 마지막 시간 업데이트
});

// 5초마다 새로고침
setTimeout(() => {
    location.reload();
}, 5000);
