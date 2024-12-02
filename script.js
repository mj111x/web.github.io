let socket;

function connectToServer() {
    // 서버와 연결
    socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev/');  // 서버 URL로 수정

    socket.addEventListener('open', () => {
        console.log("서버와 연결됨");
        document.getElementById('connectButton').disabled = true;  // 연결 후 버튼 비활성화
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log("서버로부터 받은 데이터:", data);

        if (data.type === 'raspberryPiData') {
            // Raspberry Pi 데이터를 화면에 표시
            displayRaspberryPiData(data);
        }
    });

    socket.addEventListener('close', () => {
        console.log("서버와의 연결이 끊어졌습니다.");
    });

    socket.addEventListener('error', (error) => {
        console.error("WebSocket 오류:", error);
    });
}

function displayRaspberryPiData(data) {
    const raspberryPiList = document.getElementById('raspberryPiList');

    // 기존에 표시된 내용을 지우고 새 데이터만 표시
    const piElement = document.createElement('div');
    piElement.classList.add('raspberryPiItem');
    piElement.innerHTML = `
        <p><strong>ID:</strong> ${data.id}</p>
        <p><strong>Signal Strength:</strong> ${data.signalStrength}</p>
        <p><strong>Ping Time:</strong> ${new Date(data.pingTime).toLocaleString()}</p>
    `;

    // 새 데이터 추가
    raspberryPiList.appendChild(piElement);
}
