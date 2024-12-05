const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data); // 받은 메시지를 JSON 객체로 변환
    console.log('서버로부터 받은 메시지:', data);

    if (data.type === 'register') {
        // 라즈베리 파이의 등록 메시지를 처리
        displayRaspberryPiData(data);
    } else if (data.type === 'offer') {
        // Raspberry Pi의 정보 (ID, 신호 강도, 연결 시간)을 화면에 표시
        displayRaspberryPiInfo(data);
    }
};

// 라즈베리 파이 데이터를 화면에 출력하는 함수
function displayRaspberryPiData(data) {
    const dataElement = document.getElementById('raspberryPiData');

    if (dataElement) {
        dataElement.innerHTML = `
            <h3>라즈베리 파이 등록 데이터</h3>
            <p><strong>라즈베리 파이 ID:</strong> ${data.id || '정보 없음'}</p>
            <p><strong>신호 강도:</strong> ${data.signalStrength ? data.signalStrength.toFixed(2) : '정보 없음'}</p>
            <p><strong>입력 데이터:</strong> ${data.inputData || '정보 없음'}</p>
        `;
    }
}

// Raspberry Pi 정보 화면에 출력하는 함수
function displayRaspberryPiInfo(data) {
    const infoElement = document.getElementById('raspberryPiInfo');

    if (infoElement) {
        const connectionTime = new Date(data.pingTime);  // 서버에서 받은 pingTime을 Date 객체로 변환
        const formattedTime = connectionTime.toLocaleString();  // 로컬 시간 형식으로 변환
        infoElement.innerHTML = `
            <h3>가장 가까운 Raspberry Pi 정보</h3>
            <p><strong>Raspberry Pi ID:</strong> ${data.piId || '정보 없음'}</p>
            <p><strong>신호 강도:</strong> ${data.signalStrength ? data.signalStrength.toFixed(2) : '정보 없음'}</p>
            <p><strong>연결 시간:</strong> ${formattedTime || '정보 없음'}</p>
        `;
    }
}

socket.onerror = (error) => {
    console.log('WebSocket 에러:', error);
};

socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};
