const ws = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080');  // WebSocket 서버 주소
const pingButton = document.getElementById('pingButton');
const raspberryPiInfo = document.getElementById('raspberryPiInfo');

// WebSocket 연결 성공 시
ws.onopen = function () {
    console.log("서버에 연결되었습니다.");
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
    const message = {
        type: 'ping',
        id: 'webPage1',  // 웹 페이지의 고유 ID
        signalStrength: Math.random() * 100  // 예시로 임의의 신호 강도 값
    };
    ws.send(JSON.stringify(message));  // 서버로 메시지 전송
    console.log("Ping 전송:", message);
});
