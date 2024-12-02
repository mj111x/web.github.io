// WebSocket 연결
const socket = new WebSocket('wss://c293c87f-5a1d-4c42-a723-309f413d50e0-00-2ozglj5rcnq8t.pike.replit.dev:8080');

let raspberryPiList = document.getElementById("raspberryPiList");
let connectButton = document.getElementById("connectButton");

socket.onopen = function() {
    console.log("WebSocket 서버에 연결되었습니다.");

    // 웹페이지 핑 보내기 (웹 페이지 고유 ID와 신호 강도 포함)
    socket.send(JSON.stringify({
        type: 'ping',
        id: 'webPage1',
        signalStrength: 80 // 신호 강도 예시 (실제 값은 변경 가능)
    }));
};

// 서버에서 메시지를 받을 때
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log("서버로부터 받은 데이터: ", data);

    if (data.type === 'raspberryPiStatus') {
        updateRaspberryPiList(data.pis);
    }
};

// Raspberry Pi 목록을 화면에 표시
function updateRaspberryPiList(pis) {
    raspberryPiList.innerHTML = ''; // 기존 목록 초기화

    pis.forEach(pi => {
        let piItem = document.createElement('div');
        piItem.classList.add('raspberryPiItem');
        piItem.innerHTML = `
            <p><strong>Raspberry Pi ID:</strong> ${pi.id}</p>
            <p><strong>Signal Strength:</strong> ${pi.signalStrength}</p>
            <p><strong>Ping Time:</strong> ${new Date(pi.pingTime).toLocaleTimeString()}</p>
        `;
        raspberryPiList.appendChild(piItem);
    });
}

// '가장 가까운 Raspberry Pi와 연결' 버튼 클릭 시
connectButton.addEventListener('click', function() {
    socket.send(JSON.stringify({
        type: 'connect',
        id: 'webPage1' // 웹 페이지 ID
    }));
});
