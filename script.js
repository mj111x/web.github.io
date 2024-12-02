const socket = new WebSocket('ws://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/:8080'); // 서버 URL

socket.onopen = () => {
    console.log('서버에 연결됨');

    // 웹 페이지가 서버에 연결되면 ping 데이터를 보냄
    const pingData = { type: 'ping', id: 'webPageId', signalStrength: Math.random() };  // 임의의 signalStrength 예시
    socket.send(JSON.stringify(pingData));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('서버로부터 받은 메시지:', data);

    if (data.type === 'offer') {
        console.log('가장 가까운 Raspberry Pi로 연결 요청');
        // WebRTC 연결 요청 처리 로직 추가
    }
};

document.getElementById('connectButton').addEventListener('click', () => {
    const message = {
        type: 'connect',
        sdp: '웹 페이지에서의 연결 요청 정보'  // 실제로는 WebRTC 등의 SDP 정보 사용
    };
    socket.send(JSON.stringify(message));
});
