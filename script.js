// 5초마다 서버에 폴링 요청 보내기
const pollingInterval = 5000;  // 5초마다 폴링
const statusElement = document.getElementById('status');

// 폴링 함수
const fetchStatus = async () => {
    try {
        // 폴링 데이터 받기 (여기서는 GitHub Pages에 대한 요청 예시)
        const response = await fetch('/path_to_polling_data'); // 실제 라즈베리 파이가 데이터를 보내는 API URL로 교체
        const data = await response.json();  // JSON 응답 파싱

        // 서버에서 받은 데이터에 따라 상태 업데이트
        if (data.status === 'success') {
            statusElement.textContent = data.message;
            statusElement.classList.remove('error');
            statusElement.classList.add('success');
        } else {
            statusElement.textContent = data.message;
            statusElement.classList.remove('success');
            statusElement.classList.add('error');
        }
    } catch (error) {
        console.error('폴링 요청 오류:', error);
        statusElement.textContent = '서버와의 연결에 오류가 발생했습니다.';
    }
};

// 폴링 시작
setInterval(fetchStatus, pollingInterval);  // 일정 시간 간격으로 데이터 받아오기
