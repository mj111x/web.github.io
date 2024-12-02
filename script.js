// script.js

// WebSocket 연결
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:8080');

// WebSocket 연결 시 처리
socket.addEventListener('open', () => {
    console.log('서버와 연결됨');
    // 연결이 되면 Raspberry Pi 데이터를 요청하거나, 계속해서 데이터를 받도록 설정
});

// 서버에서 메시지를 받을 때 처리
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'raspberryPiData') {
        // Raspberry Pi의 데이터 받아서 화면에 출력
        const raspberryPiList = document.getElementById('raspberryPiList');

        const piElement = document.createElement('div');
        piElement.innerHTML = `
            <p>ID: ${data.id}</p>
            <p>Signal Strength: ${data.signalStrength}</p>
            <p>Ping Time: ${new Date(data.pingTime).toLocaleString()}</p>
            <hr>
        `;
        raspberryPiList.appendChild(piElement);
    }
});

// WebSocket 연결 오류 처리
socket.addEventListener('error', (error) => {
    console.error('WebSocket Error:', error);
});

// WebSocket 연결 종료 처리
socket.addEventListener('close', () => {
    console.log('서버와 연결이 끊어졌습니다');
});
