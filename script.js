function fetchTime() {
    // 서버 상태를 '요청 중'으로 표시
    document.getElementById('status').textContent = '서버 연결 상태: 요청 중...';
    document.getElementById('status').classList.remove('status-success', 'status-error');
    
    // polling 방식으로 Flask 서버에서 시간 데이터를 요청
    fetch('http://<your_server_ip>:8081/poll')  // <your_server_ip>을 실제 서버 IP로 변경
        .then(response => response.json())
        .then(data => {
            // 서버 응답을 성공적으로 받았을 경우
            document.getElementById('time').innerText = '현재 시간: ' + data.time;
            document.getElementById('status').textContent = '서버 연결 상태: 성공';
            document.getElementById('status').classList.add('status-success');
        })
        .catch(error => {
            // 서버 요청 중 오류 발생 시
            console.error('서버 요청 오류:', error);
            document.getElementById('status').textContent = '서버 연결 상태: 오류 발생';
            document.getElementById('status').classList.add('status-error');
        });
}

// 5초마다 서버에서 데이터를 요청하는 polling 시작
setInterval(fetchTime, 8081);
