const ws = new WebSocket('ws://localhost:8080');  // WebSocket 서버 주소
const pingButton = document.getElementById('pingButton');
const raspberryPiInfo = document.getElementById('raspberryPiInfo');

// WebSocket 연결 성공 시
ws.onopen = function () {
    console.log("서버에 연결되었습니다.");
};

// WebSocket 연결이 닫히거나 문제가 생기면 재연결 시도
ws.onclose = function () {
    console.log("서버 연결이 끊어졌습니다. 재연결을 시도합니다...");
    reconnectWebSocket();
};

// 서버에서 메시지를 받을 때
ws.onmessage = function (event) {
    const message = JSON.parse(event.data);  // 받은 메시지를 JSON 객체로 변환

    // 가장 가까운 Raspberry Pi 정보를 서버로부터 받았을 때
    if (message.type === 'closestPi') {
        console.log("가장 가까운 Raspberry Pi 정보:", message);
        raspberryPiInfo.innerHTML = `
            <p>Raspberry Pi ID: ${message.closestPiId}</p>
            <p>Signal Strength: ${message.signalStrength}</p>
            <p>Ping Time: ${new Date(message.pingTime).toLocaleString()}</p>
        `;
    }
};

// Ping 버튼 클릭 시 서버로 ping 메시지 전송
pingButton.addEventListener('click', function () {
    if (ws.readyState === WebSocket.OPEN) {
        const message = {
            type: 'ping',
            id: 'webPage1',  // 웹 페이지의 고유 ID
            signalStrength: Math.random() * 100  // 예시로 임의의 신호 강도 값
        };
        ws.send(JSON.stringify(message));  // 서버로 메시지 전송
        console.log("Ping 전송:", message);
    } else {
        console.log("WebSocket 연결이 열려 있지 않습니다.");
    }
});

// WebSocket 연결이 끊어지면 다시 연결 시도
function reconnectWebSocket() {
    setTimeout(function () {
        console.log("WebSocket 재연결 시도...");
        ws = new WebSocket('ws://localhost:8080');  // 서버 주소에 맞게 설정
    }, 2000);  // 2초 후 재연결 시도
}
