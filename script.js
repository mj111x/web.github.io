// WebSocket 서버와 연결
const socket = new WebSocket('wss://your-server-address:8080');  // 서버 주소를 변경해야 합니다.

socket.onopen = () => {
    console.log('서버와 연결됨!');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('서버로부터 받은 데이터:', data);

    // Raspberry Pi 연결 성공
    if (data.type === 'connected') {
        console.log('연결 성공:', data.message);
        // WebRTC 연결 설정 등의 로직을 진행할 수 있음
    }

    // 오류 메시지
    if (data.type === 'error') {
        console.log('오류:', data.message);
    }
};

// Web 페이지에서 Raspberry Pi와 연결 요청
document.getElementById('connectButton').addEventListener('click', () => {
    console.log('웹 페이지에서 Raspberry Pi와 연결 요청 중...');
    const message = {
        type: 'connect',
        sdp: '웹 페이지에서의 연결 요청 정보'  // 실제로는 WebRTC 등의 SDP 정보 사용
    };

    socket.send(JSON.stringify(message));
    console.log('연결 요청 메시지 전송됨:', message);
});

// WebSocket 연결 상태 출력
socket.onclose = () => {
    console.log('WebSocket 연결이 종료되었습니다.');
};

socket.onerror = (error) => {
    console.log('WebSocket 오류 발생:', error);
};
