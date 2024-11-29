// WebSocket 서버와 연결
const socket = new WebSocket('ws://<서버-IP>:<포트>'); // WebSocket 서버의 주소

// WebSocket이 연결되면 호출
socket.onopen = () => {
    console.log('WebSocket 연결 성공');
};

// 서버에서 메시지를 받으면 상태 업데이트
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);  // 서버에서 보낸 메시지(JSON 형식으로)
    const statusElement = document.getElementById('status');

    // 상태에 따라 클래스 변경
    if (data.status === 'success') {
        statusElement.textContent = data.message;
        statusElement.classList.remove('error');
        statusElement.classList.add('success');
    } else {
        statusElement.textContent = data.message;
        statusElement.classList.remove('success');
        statusElement.classList.add('error');
    }
};

// WebSocket 연결 오류 처리
socket.onerror = (error) => {
    console.error('WebSocket 오류:', error);
};

// WebSocket 연결 종료 처리
socket.onclose = () => {
    console.log('WebSocket 연결 종료');
    document.getElementById('status').textContent = '서버와 연결이 종료되었습니다.';
};
