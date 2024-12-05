const socketUrl = 'wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080';
let socket = null;

document.getElementById('connectButton').addEventListener('click', () => {
    if (socket) {
        console.log('이미 연결 중입니다.');
        return;
    }

    socket = new WebSocket(socketUrl);

    const statusElement = document.getElementById('status');

    socket.onopen = () => {
        console.log('서버에 연결되었습니다.');
        statusElement.textContent = '서버와 연결됨';
        statusElement.className = 'connected';
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('서버로부터 받은 메시지:', data);

        if (data.type === 'register') {
            displayRaspberryPiData(data);
        } else if (data.type === 'offer') {
            displayRaspberryPiInfo(data);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket 에러:', error);
        statusElement.textContent = '연결 오류 발생';
        statusElement.className = 'disconnected';
    };

    socket.onclose = () => {
        console.log('WebSocket 연결이 종료되었습니다.');
        statusElement.textContent = '서버와 연결 끊김';
        statusElement.className = 'disconnected';
        socket = null;
    };
});

// 라즈베리 파이 데이터를 화면에 출력하는 함수
function displayRaspberryPiData(data) {
    const dataElement = document.getElementById('raspberryPiData');

    dataElement.innerHTML = `
        <h3>라즈베리 파이 등록 데이터</h3>
        <p><strong>라즈베리 파이 ID:</strong> ${data.id || '정보 없음'}</p>
        <p><strong>신호 강도:</strong> ${data.signalStrength ? data.signalStrength.toFixed(2) : '정보 없음'}</p>
        <p><strong>입력 데이터:</strong> ${data.inputData || '정보 없음'}</p>
    `;
}

// Raspberry Pi 정보 화면에 출력하는 함수
function displayRaspberryPiInfo(data) {
    const infoElement = document.getElementById('raspberryPiInfo');

    infoElement.innerHTML = `
        <h3>가장 가까운 Raspberry Pi 정보</h3>
        <p><strong>Raspberry Pi ID:</strong> ${data.piId || '정보 없음'}</p>
        <p><strong>신호 강도:</strong> ${data.signalStrength ? data.signalStrength.toFixed(2) : '정보 없음'}</p>
        <p><strong>연결 시간:</strong> ${new Date(data.pingTime).toLocaleString() || '정보 없음'}</p>
    `;
}

socket.onerror = (error) => {
    console.log('WebSocket 에러:', error);
};

socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};
