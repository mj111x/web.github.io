const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
    
    // WebSocket 연결이 성공적으로 이루어진 후 'ping' 메시지를 전송
    const pingData = {
        type: 'ping',
        id: '웹페이지-001',
        signalStrength: Math.random() * 100, // 임의의 신호 강도 값
    };
    console.log('전송할 메시지:', pingData);
    socket.send(JSON.stringify(pingData));
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log('서버로부터 받은 메시지:', data);

        if (data.type === 'offer') {
            displayRaspberryPiInfo(data);
        } else {
            console.warn("처리할 수 없는 메시지 유형:", data.type);
        }
    } catch (error) {
        console.error("WebSocket 메시지 처리 중 오류:", error);
    }
};

function displayRaspberryPiInfo(data) {
    const infoElement = document.getElementById('raspberryPiInfo');
    if (!infoElement) {
        console.error('HTML 요소를 찾을 수 없습니다: #raspberryPiInfo');
        return;
    }

    const piId = data.piId || "정보 없음";
    const signalStrength = data.signalStrength ? data.signalStrength.toFixed(2) : "정보 없음";
    const pingTime = data.pingTime || "정보 없음";

    infoElement.innerHTML = `
        <p><strong>Raspberry Pi ID:</strong> ${piId}</p>
        <p><strong>신호 강도:</strong> ${signalStrength}</p>
        <p><strong>연결 시간:</strong> ${pingTime}</p>
    `;
}

socket.onerror = (error) => {
    console.error("WebSocket 에러:", error);
};

socket.onclose = () => {
    console.log("WebSocket 연결이 종료되었습니다.");
};
