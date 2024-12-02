// 서버의 WebSocket URL
const serverUrl = 'ws://your-server-ip-or-url:8080';  // 여기에 서버의 URL을 입력하세요.
const socket = new WebSocket(serverUrl);  // WebSocket 객체 생성

// WebSocket 연결이 열리면
socket.onopen = () => {
    console.log('서버에 연결됨');
    document.getElementById('status').textContent = '서버와 연결됨. ping을 보냄.';
    document.getElementById('status').classList.remove('waiting', 'disconnected');
    document.getElementById('status').classList.add('connected');

    // 서버에 ping 데이터 전송
    const pingData = {
        type: 'ping',
        id: 'webPageId',  // 고유한 웹 페이지 ID
        signalStrength: Math.random()  // 임의의 신호 강도 값 (실제 데이터에 맞게 수정 가능)
    };
    socket.send(JSON.stringify(pingData));
};

// WebSocket 연결이 오류가 발생했을 때
socket.onerror = (error) => {
    console.error('WebSocket 오류:', error);
    document.getElementById('status').textContent = '서버와 연결 실패.';
    document.getElementById('status').classList.remove('waiting', 'connected');
    document.getElementById('status').classList.add('disconnected');
};

// 서버로부터 메시지가 오면
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);  // 받은 메시지를 JSON 객체로 변환
    console.log('서버로부터 받은 메시지:', data);

    // 서버가 Raspberry Pi의 offer를 보낸 경우
    if (data.type === 'offer') {
        console.log('가장 가까운 Raspberry Pi로 연결 요청');
        // 실제로는 WebRTC 연결을 위한 처리 로직을 여기에 작성
        document.getElementById('status').textContent = 'Raspberry Pi와 연결 요청!';
    }
};

// WebSocket 연결이 종료되었을 때
socket.onclose = () => {
    console.log('서버와의 연결이 종료됨');
    document.getElementById('status').textContent = '서버와 연결 종료됨.';
    document.getElementById('status').classList.remove('waiting', 'connected');
    document.getElementById('status').classList.add('disconnected');
};

// 연결 요청 버튼 클릭 시 처리
document.getElementById('connectButton').addEventListener('click', () => {
    // 서버로 연결 요청 메시지 전송 (SDP 정보는 실제 WebRTC 연결을 위해 사용)
    const connectMessage = {
        type: 'connect',  // 'connect' 타입의 메시지
        sdp: '웹 페이지에서 보낸 SDP 정보'  // WebRTC의 실제 SDP 정보 사용 필요
    };
    socket.send(JSON.stringify(connectMessage));
    console.log('서버로 연결 요청 메시지 전송');
});
