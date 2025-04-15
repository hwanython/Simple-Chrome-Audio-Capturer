let recorder;
let audioChunks = [];

document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('status').textContent = '녹음 중...';
  startCapture();
});

document.getElementById('stopBtn').addEventListener('click', () => {
  document.getElementById('status').textContent = '녹음 중지 중...';
  stopCapture();
});

function startCapture() {
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (!stream) {
      document.getElementById('status').textContent = '오디오 캡처에 실패했습니다.';
      return;
    }

    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'recorded_audio.webm';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      audioChunks = [];
      document.getElementById('status').textContent = '녹음이 중지되었으며 파일이 다운로드되었습니다.';
    };

    recorder.start();

    // 녹음 시작 시 버튼 상태 제어
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
  });
}

function stopCapture() {
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    // 버튼 상태 복원
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  }
}
