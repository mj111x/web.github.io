// 서버의 URL로 변경
const socket = io.connect('https://your-server-url.com');

// 서버에서 메시지를 받으면
socket.on('response', function(data) {
    document.getElementById('status').textContent = data.data;
});

// 서버로 메시지 보내기 (예시)
socket.emit('message', '클라이언트에서 서버로 메시지 전송');
