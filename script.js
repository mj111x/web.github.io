// app.js
const socket = new WebSocket('https://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/'); // 서버 URL

socket.onopen = () => {
    console.log('서버에 연결됨');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

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

// Raspberry Pi와 연결 요청
document.getElementById('connectButton').addEventListener('click', () => {
    const message = {
        type: 'connect',
        sdp: '웹 페이지에서의 연결 요청 정보'  // 실제로는 WebRTC 등의 SDP 정보 사용
    };

    socket.send(JSON.stringify(message));
});
