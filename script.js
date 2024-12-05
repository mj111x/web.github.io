// WebSocket 연결 및 메시지 처리
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/');

socket.onopen = () => {
    console.log("서버에 연결되었습니다.");
    
    // WebSocket 연결이 성공적으로 이루어진 후 클라이언트로부터 'ping' 메시지를 전송합니다.
    const pingData = {
        type: 'ping',
        id: '웹페이지-001', // 웹 페이지의 고유 ID
        signalStrength: Math.random() * 100 // 임의의 신호 강도 값
    };
    console.log('전송할 메시지:', pingData);
    socket.send(JSON.stringify(pingData));
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data); // 받은 메시지를 JSON 객체로 변환
        console.log('서버로부터 받은 메시지:', data);

        // 서버로부터 받은 'register' 메시지 처리
        if (data.type === 'register') {
            displayRaspberryPiInfo(data); // Raspberry Pi 정보를 화면에 표시
        } else {
            console.warn("처리할 수 없는 메시지 유형:", data.type);
        }
    } catch (error) {
        console.error("WebSocket 메시지 처리 중 오류:", error);
    }
};

// Raspberry Pi 정보 화면에 출력하는 함수
function displayRaspberryPiInfo(data) {
    const infoElement = document.getElementById('raspberryPiInfo');
    
    // HTML 요소가 존재하지 않는 경우 오류 출력
    if (!infoElement) {
        console.error('HTML 요소를 찾을 수 없습니다: #raspberryPiInfo');
        return;
    }

    // 데이터 추출 및 기본값 설정
    const piId = data.id || "정보 없음"; // 서버의 'id' 필드 사용
    const signalStrength = data.signalStrength ? data.signalStrength.toFixed(2) : "정보 없음"; // 신호 강도
    const signalPeriod = data.signalperiod || "데이터 없음"; // 텍스트 파일 내용

    // Raspberry Pi 정보 출력
    infoElement.innerHTML = `
        <p><strong>Raspberry Pi ID:</strong> ${piId}</p>
        <p><strong>신호 강도:</strong> ${signalStrength}</p>
        <p><strong>수집된 데이터:</strong> ${signalPeriod}</p>
    `;
}

// WebSocket 오류 처리
socket.onerror = (error) => {
    console.error('WebSocket 에러:', error);
};

// WebSocket 연결 종료 처리
socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};
