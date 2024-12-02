function fetchTime() {
    // polling 방식으로 Flask 서버에서 시간 데이터를 요청
    fetch('http://<your_server_ip>:5000/poll')
        .then(response => response.json())
        .then(data => {
            document.getElementById('time').innerText = '현재 시간: ' + data.time;
        })
        .catch(error => {
            console.error('서버 요청 오류:', error);
        });
}

// 5초마다 서버에서 데이터를 요청하는 polling 시작
setInterval(fetchTime, 5000);
