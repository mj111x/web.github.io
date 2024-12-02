// 서버의 WebSocket URL
const socket = new WebSocket('ws://localhost:8080');  // 서버 주소를 맞게 수정하세요.

// WebSocket 연결 시 처리
socket.onopen = () => {
    console.log('서버에 연결됨');
};

// WebSocket 메시지 처리
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('받은 데이터:', data);

    // Raspberry Pi에서 WebRTC offer를 받았을 때 처리
    if (data.type === 'offer') {
        console.log('Raspberry Pi에서 offer를 받음:', data.sdp);
        // 여기에서 WebRTC 연결을 설정하는 로직을 추가하세요.
    }

    // 오류 처리
    if (data.type === 'error') {
        console.log('오류:', data.message);
    }
};

// Raspberry Pi와 연결 요청 시 처리
document.getElementById('connectButton').addEventListener('click', () => {
    // WebRTC 연결을 위한 메시지 생성
    const message = {
        type: 'connect',
        sdp: '웹 페이지에서의 SDP 정보'  // 실제로는 WebRTC 관련 SDP 정보를 사용합니다.
    };

    // 서버에 연결 요청 메시지 전송
    socket.send(JSON.stringify(message));
});

// Raspberry Pi 등록 버튼 클릭 시 처리 (Raspberry Pi가 먼저 서버에 등록해야 함)
document.getElementById('registerButton').addEventListener('click', () => {
    const message = {
        type: 'register',
        id: 'raspberry-pi-id',  // Raspberry Pi의 고유 ID를 설정합니다.
        signalStrength: 50  // 예시로 신호 강도 설정 (신호 강도 값은 실제 값으로 대체)
    };

    socket.send(JSON.stringify(message));
});
