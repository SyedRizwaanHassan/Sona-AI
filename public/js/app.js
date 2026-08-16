/**
 * Zarkhez AI Agent - Official Engro Fertilizers Limited
 * Client-Side Controller, Voice Assistant & Dosage Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatFeed = document.getElementById('chatFeed');
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  
  // Voice Recording Elements
  const micRecordBtn = document.getElementById('micRecordBtn');
  const recordingOverlay = document.getElementById('recordingOverlay');
  const cancelRecordBtn = document.getElementById('cancelRecordBtn');
  const stopRecordBtn = document.getElementById('stopRecordBtn');
  const waveformCanvas = document.getElementById('waveformCanvas');
  
  // Modals & Triggers
  const calculatorBtn = document.getElementById('calculatorBtn');
  const calcModal = document.getElementById('calcModal');
  const closeCalcModal = document.getElementById('closeCalcModal');
  const runCalcBtn = document.getElementById('runCalcBtn');
  const calcResults = document.getElementById('calcResults');

  const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
  const voiceModal = document.getElementById('voiceModal');
  const closeVoiceModal = document.getElementById('closeVoiceModal');
  const saveVoiceSettingsBtn = document.getElementById('saveVoiceSettingsBtn');
  const voiceSelect = document.getElementById('voiceSelect');
  const autoAudioToggle = document.getElementById('autoAudioToggle');

  // App State
  let conversationHistory = [];
  let mediaRecorder = null;
  let audioChunks = [];
  let audioContext = null;
  let analyser = null;
  let animationFrameId = null;
  let currentAudioPlayer = null;
  let activeSpeechRecognition = null;

  let selectedVoiceId = localStorage.getItem('zarkhez_voice_id') || 'cgSgspJ2msm6clMCkdW9';
  let isAutoPlayAudio = localStorage.getItem('zarkhez_auto_play') !== 'false';

  if (voiceSelect) voiceSelect.value = selectedVoiceId;
  if (autoAudioToggle) autoAudioToggle.checked = isAutoPlayAudio;

  // Preserve Initial Welcome Card HTML for Resetting
  const initialWelcomeHtml = chatFeed.innerHTML;

  // Bind initial welcome card play button
  const initialPlayBtn = chatFeed.querySelector('.play-audio-btn');
  if (initialPlayBtn) {
    initialPlayBtn.addEventListener('click', () => {
      const speechText = initialPlayBtn.getAttribute('data-speech-text');
      const botCard = initialPlayBtn.closest('.chat-message');
      playZarkhezVoice(initialPlayBtn, speechText, botCard);
    });
  }

  // Clear Chat Button Handler
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (currentAudioPlayer && !currentAudioPlayer.paused) {
        currentAudioPlayer.pause();
        currentAudioPlayer = null;
      }

      conversationHistory = [];
      chatFeed.innerHTML = initialWelcomeHtml;

      const welcomePlayBtn = chatFeed.querySelector('.play-audio-btn');
      if (welcomePlayBtn) {
        welcomePlayBtn.addEventListener('click', () => {
          const speechText = welcomePlayBtn.getAttribute('data-speech-text');
          const botCard = welcomePlayBtn.closest('.chat-message');
          playZarkhezVoice(welcomePlayBtn, speechText, botCard);
        });
      }

      userInput.value = '';
      userInput.style.height = 'auto';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Auto-resize textarea
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  });

  // Handle Enter key for quick submit
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Quick Prompt Chips
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      if (promptText) {
        userInput.value = promptText;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Handle Chat Form Submit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = userInput.value.trim();
    if (!prompt) return;

    userInput.value = '';
    userInput.style.height = 'auto';

    appendUserMessage(prompt);
    const loadingCard = appendLoadingMessage();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          history: conversationHistory
        })
      });

      const data = await res.json();
      loadingCard.remove();

      conversationHistory.push({ role: 'user', content: prompt });
      conversationHistory.push({ role: 'assistant', content: data.text });

      appendBotMessage(data.text, data.speechText);

    } catch (err) {
      loadingCard.remove();
      appendBotMessage('معذرت! کنیکشن کا مسئلہ ہوا ہے۔ براہ کرم دوبارہ کوشش کریں۔');
    }
  });

  function appendUserMessage(text) {
    const msgHtml = `
      <div class="chat-message user-message">
        <div class="avatar user-avatar">
          <i class="fa-solid fa-user"></i>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">Kissan Bhai</span>
            <span class="timestamp">${getCurrentTime()}</span>
          </div>
          <div class="message-body nastaliq">${escapeHtml(text)}</div>
        </div>
      </div>
    `;
    chatFeed.insertAdjacentHTML('beforeend', msgHtml);
    scrollToBottom();
  }

  function appendLoadingMessage() {
    const loadingHtml = `
      <div class="chat-message bot-message" id="loadingMessage">
        <div class="avatar bot-avatar">
          <i class="fa-solid fa-seedling"></i>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">Zarkhez AI (Analyzing Engro Recommendations...)</span>
          </div>
          <div class="message-body nastaliq text-green">
            <i class="fa-solid fa-circle-notch fa-spin"></i> اینگرو کی زرعی معلومات اور زرخیز کی آواز تیار ہو رہی ہے...
          </div>
        </div>
      </div>
    `;
    chatFeed.insertAdjacentHTML('beforeend', loadingHtml);
    scrollToBottom();
    return document.getElementById('loadingMessage');
  }

  function appendBotMessage(text, speechText) {
    const messageId = `msg-${Date.now()}`;
    const cleanSpeech = speechText || cleanTextForSpeech(text);

    const botHtml = `
      <div class="chat-message bot-message" id="${messageId}">
        <div class="avatar bot-avatar">
          <i class="fa-solid fa-seedling"></i>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">Zarkhez (Senior Agronomist - Engro)</span>
            <span class="timestamp">${getCurrentTime()}</span>
          </div>
          <div class="message-body nastaliq">${formatMarkdownUrdu(text)}</div>
          
          <!-- Zarkhez Voice Player Card -->
          <div class="engro-voice-card">
            <div class="engro-voice-header">
              <div class="engro-badge">
                <i class="fa-solid fa-volume-high text-orange"></i>
                <span>Zarkhez Voice Guide (Audio)</span>
              </div>
              <span class="engro-tag">Engro Official Audio</span>
            </div>
            <div class="audio-player-controls">
              <button class="play-audio-btn" data-speech-text="${escapeHtml(cleanSpeech)}">
                <i class="fa-solid fa-play"></i>
              </button>
              <div class="audio-progress-bar">
                <div class="audio-progress-fill" style="width: 0%;"></div>
              </div>
              <span class="audio-time">0:00</span>
            </div>
          </div>

        </div>
      </div>
    `;

    chatFeed.insertAdjacentHTML('beforeend', botHtml);
    scrollToBottom();

    const botCard = document.getElementById(messageId);
    const playBtn = botCard.querySelector('.play-audio-btn');

    playBtn.addEventListener('click', () => {
      playZarkhezVoice(playBtn, cleanSpeech, botCard);
    });

    if (isAutoPlayAudio && playBtn) {
      playZarkhezVoice(playBtn, cleanSpeech, botCard);
    }
  }

  // Fast Low-Latency Audio Stream Playback
  async function playZarkhezVoice(playBtn, speechText, botCard) {
    const icon = playBtn.querySelector('i');
    const progressBar = botCard.querySelector('.audio-progress-fill');
    const timeDisplay = botCard.querySelector('.audio-time');
    const cleanSpeech = cleanTextForSpeech(speechText).substring(0, 300);

    if (playBtn.audioObj && !playBtn.audioObj.paused) {
      playBtn.audioObj.pause();
      icon.className = 'fa-solid fa-play';
      return;
    }

    if (currentAudioPlayer && !currentAudioPlayer.paused) {
      currentAudioPlayer.pause();
    }

    if (playBtn.audioObj) {
      playBtn.audioObj.play();
      icon.className = 'fa-solid fa-pause';
      currentAudioPlayer = playBtn.audioObj;
      return;
    }

    try {
      icon.className = 'fa-solid fa-spinner fa-spin';
      timeDisplay.innerText = 'Loading voice...';

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanSpeech, voiceId: selectedVoiceId })
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      playBtn.audioObj = audio;
      currentAudioPlayer = audio;

      audio.addEventListener('loadedmetadata', () => {
        timeDisplay.innerText = formatDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          const pct = (audio.currentTime / audio.duration) * 100;
          progressBar.style.width = `${pct}%`;
          timeDisplay.innerText = `${formatDuration(audio.currentTime)} / ${formatDuration(audio.duration)}`;
        }
      });

      audio.addEventListener('ended', () => {
        icon.className = 'fa-solid fa-play';
        progressBar.style.width = '0%';
        timeDisplay.innerText = formatDuration(audio.duration || 0);
      });

      audio.play();
      icon.className = 'fa-solid fa-pause';

    } catch (err) {
      console.error('Zarkhez Audio Playback Error:', err);
      icon.className = 'fa-solid fa-triangle-exclamation';
      timeDisplay.innerText = 'Audio error';
    }
  }

  // Speech-to-Text (STT) Voice Recording
  micRecordBtn.addEventListener('click', () => {
    startUrduVoiceRecognition();
  });

  function startUrduVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (activeSpeechRecognition) {
        try { activeSpeechRecognition.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      activeSpeechRecognition = recognition;
      recognition.lang = 'ur-PK';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recordingOverlay.classList.remove('hidden');

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          userInput.value = finalTranscript.trim();
        }
      };

      recognition.onend = () => {
        recordingOverlay.classList.add('hidden');
        const finalVal = userInput.value.trim();
        if (finalVal) {
          chatForm.dispatchEvent(new Event('submit'));
        }
      };

      recognition.start();
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => startMediaRecorderStream(stream))
        .catch(() => alert('Please grant microphone permission in your browser settings.'));
    }
  }

  function startMediaRecorderStream(stream) {
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    recordingOverlay.classList.remove('hidden');

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    drawWaveform();

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stopWaveform();
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
  }

  function drawWaveform() {
    const canvasCtx = waveformCanvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
      animationFrameId = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = '#F1F5F9';
      canvasCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);

      const barWidth = (waveformCanvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * waveformCanvas.height;
        canvasCtx.fillStyle = '#00A859';
        canvasCtx.fillRect(x, waveformCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    }
    renderFrame();
  }

  function stopWaveform() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (audioContext) audioContext.close();
  }

  cancelRecordBtn.addEventListener('click', () => {
    if (activeSpeechRecognition) {
      try { activeSpeechRecognition.abort(); } catch (e) {}
    }
    recordingOverlay.classList.add('hidden');
  });

  stopRecordBtn.addEventListener('click', () => {
    if (activeSpeechRecognition) {
      try { activeSpeechRecognition.stop(); } catch (e) {}
    }
    recordingOverlay.classList.add('hidden');
  });

  // Modals & Calculator
  calculatorBtn.addEventListener('click', () => calcModal.classList.remove('hidden'));
  closeCalcModal.addEventListener('click', () => calcModal.classList.add('hidden'));

  runCalcBtn.addEventListener('click', async () => {
    const crop = document.getElementById('cropSelect').value;
    const acres = document.getElementById('acreInput').value;

    try {
      const res = await fetch('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, acres })
      });
      const data = await res.json();

      document.getElementById('resUrea').innerText = data.engroUrea;
      document.getElementById('resDap').innerText = data.engroDap;
      document.getElementById('resZabardast').innerText = data.engroZabardast;
      document.getElementById('resZarkhez').innerText = data.engroZarkhez;
      document.getElementById('resSchedule').innerText = data.schedule;

      calcResults.classList.remove('hidden');
    } catch (e) {
      alert('Calculator error, please try again!');
    }
  });

  voiceSettingsBtn.addEventListener('click', () => voiceModal.classList.remove('hidden'));
  closeVoiceModal.addEventListener('click', () => voiceModal.classList.add('hidden'));

  saveVoiceSettingsBtn.addEventListener('click', () => {
    selectedVoiceId = voiceSelect.value;
    isAutoPlayAudio = autoAudioToggle.checked;

    localStorage.setItem('zarkhez_voice_id', selectedVoiceId);
    localStorage.setItem('zarkhez_auto_play', isAutoPlayAudio);

    voiceModal.classList.add('hidden');
    alert('Zarkhez voice settings saved successfully!');
  });

  function scrollToBottom() {
    chatFeed.scrollTop = chatFeed.scrollHeight;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  function formatMarkdownUrdu(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function cleanTextForSpeech(text) {
    return (text || '')
      .replace(/[\*#_`~>]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[\(\)\[\]\{\}]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatDuration(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
});
