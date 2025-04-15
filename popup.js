let recorder;
let audioChunks = [];
let audioContext;
let capturedStream;
let timerInterval;
let recordingSeconds = 0;

document.addEventListener('DOMContentLoaded', function() {
  // 기본 UI 요소
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');
  const timer = document.getElementById('timer');
  
  // 향후 확장을 위한 UI 요소
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsSection = document.getElementById('settingsSection');
  
  // 설정 토글 기능
  settingsToggle.addEventListener('click', () => {
    settingsSection.style.display = settingsSection.style.display === 'block' ? 'none' : 'block';
    settingsToggle.classList.toggle('active');
  });
  
  // 녹음 시작 버튼 이벤트
  startBtn.addEventListener('click', () => {
    updateStatus('녹음 중...', 'recording');
    startCapture();
  });
  
  // 녹음 중지 버튼 이벤트
  stopBtn.addEventListener('click', () => {
    updateStatus('녹음 중지 중...', 'stopping');
    stopCapture();
  });
  
  // 상태 업데이트 함수
  function updateStatus(message, state) {
    status.textContent = message;
    
    // 상태에 따른 아이콘 및 스타일 변경
    statusIcon.className = 'status-icon';
    
    switch(state) {
      case 'idle':
        statusIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
        break;
      case 'recording':
        statusIcon.innerHTML = '<span class="loading"></span>';
        status.classList.add('status-warning');
        // 타이머 표시 (향후 확장)
        timer.style.display = 'block';
        startTimer();
        break;
      case 'stopping':
        statusIcon.innerHTML = '<span class="loading"></span>';
        status.classList.remove('status-warning');
        break;
      case 'success':
        statusIcon.innerHTML = '<i class="fas fa-check-circle status-success"></i>';
        status.classList.add('status-success');
        setTimeout(() => {
          status.classList.remove('status-success');
        }, 3000);
        break;
      case 'error':
        statusIcon.innerHTML = '<i class="fas fa-exclamation-circle status-error"></i>';
        status.classList.add('status-error');
        break;
    }
  }
  
  // 타이머 기능 (향후 확장)
  function startTimer() {
    recordingSeconds = 0;
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
  }
  
  function stopTimer() {
    clearInterval(timerInterval);
    timer.style.display = 'none';
  }
  
  function updateTimerDisplay() {
    recordingSeconds++;
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // 초기 상태 설정
  updateStatus('녹음 버튼을 클릭하여 시작하세요', 'idle');
});

function startCapture() {
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (!stream) {
      updateStatus('오디오 캡처에 실패했습니다.', 'error');
      return;
    }

    capturedStream = stream;
    
    // 오디오 컨텍스트 생성 및 스트림을 스피커로 연결
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination);
    
    // 녹음기 설정
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // WebM을 WAV로 변환
      convertToWav(audioBlob).then(wavBlob => {
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recorded_audio.wav';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        updateStatus('녹음이 완료되었으며 WAV 파일이 다운로드되었습니다.', 'success');
      }).catch(error => {
        console.error('WAV 변환 실패:', error);
        updateStatus('WAV 변환 실패: ' + error.message, 'error');
      });
      
      audioChunks = [];
      stopTimer();
    };

    recorder.start();

    // 녹음 시작 시 버튼 상태 제어
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
  });
}

// WebM 오디오를 WAV로 변환하는 함수
async function convertToWav(webmBlob) {
  // 오디오 컨텍스트 생성
  const offlineContext = new OfflineAudioContext({
    numberOfChannels: 2,
    length: 44100 * 10, // 예상 길이에 따라 조정 (10초)
    sampleRate: 44100
  });
  
  try {
    // WebM 블롭을 ArrayBuffer로 변환
    const arrayBuffer = await webmBlob.arrayBuffer();
    
    // ArrayBuffer를 AudioBuffer로 디코딩
    const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
    
    // WAV 형식으로 인코딩
    const wavBuffer = audioBufferToWav(audioBuffer);
    
    // WAV ArrayBuffer를 Blob으로 변환
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('오디오 변환 중 오류 발생:', error);
    throw error;
  }
}

// AudioBuffer를 WAV 형식으로 인코딩하는 함수
function audioBufferToWav(audioBuffer) {
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChannels * 2; // 16비트 = 2바이트
  const sampleRate = audioBuffer.sampleRate;
  const buffer = new ArrayBuffer(44 + length); // WAV 헤더(44바이트) + 오디오 데이터
  const view = new DataView(buffer);
  
  // WAV 파일 헤더 작성
  writeString(view, 0, 'RIFF'); // RIFF 청크
  view.setUint32(4, 36 + length, true); // 파일 크기
  writeString(view, 8, 'WAVE'); // WAVE 형식
  writeString(view, 12, 'fmt '); // 포맷 청크
  view.setUint32(16, 16, true); // 포맷 청크 크기
  view.setUint16(20, 1, true); // 오디오 포맷 (1 = PCM)
  view.setUint16(22, numOfChannels, true); // 채널 수
  view.setUint32(24, sampleRate, true); // 샘플 레이트
  view.setUint32(28, sampleRate * numOfChannels * 2, true); // 바이트 레이트
  view.setUint16(32, numOfChannels * 2, true); // 블록 크기
  view.setUint16(34, 16, true); // 비트 깊이
  writeString(view, 36, 'data'); // 데이터 청크
  view.setUint32(40, length, true); // 데이터 크기
  
  // 오디오 데이터 작성
  let offset = 44;
  const float32Arrays = [];
  
  for (let i = 0; i < numOfChannels; i++) {
    float32Arrays.push(audioBuffer.getChannelData(i));
  }
  
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, float32Arrays[channel][i]));
      const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16Sample, true);
      offset += 2;
    }
  }
  
  return buffer;
}

// DataView에 문자열 쓰기 헬퍼 함수
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function stopCapture() {
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    
    // 스트림 트랙 중지
    if (capturedStream) {
      capturedStream.getTracks().forEach(track => track.stop());
      capturedStream = null;
    }
    
    // 오디오 컨텍스트 닫기
    if (audioContext) {
      audioContext.close().then(() => {
        audioContext = null;
      }).catch(error => {
        console.error('오디오 컨텍스트 닫기 실패:', error);
      });
    }
    
    // 버튼 상태 복원
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  }
}

// 상태 업데이트 함수 (전역 스코프에서도 사용 가능하도록)
function updateStatus(message, state) {
  const status = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');
  
  if (!status || !statusIcon) return;
  
  status.textContent = message;
  
  // 상태에 따른 아이콘 및 스타일 변경
  statusIcon.className = 'status-icon';
  
  switch(state) {
    case 'idle':
      statusIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
      break;
    case 'recording':
      statusIcon.innerHTML = '<span class="loading"></span>';
      status.classList.add('status-warning');
      break;
    case 'stopping':
      statusIcon.innerHTML = '<span class="loading"></span>';
      status.classList.remove('status-warning');
      break;
    case 'success':
      statusIcon.innerHTML = '<i class="fas fa-check-circle status-success"></i>';
      status.classList.add('status-success');
      setTimeout(() => {
        status.classList.remove('status-success');
      }, 3000);
      break;
    case 'error':
      statusIcon.innerHTML = '<i class="fas fa-exclamation-circle status-error"></i>';
      status.classList.add('status-error');
      break;
  }
}
