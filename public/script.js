const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const voiceBtn = document.getElementById('voice-btn');
const voiceToggleBtn = document.getElementById(
  'voice-toggle-btn',
);
const voiceModeIndicator = document.getElementById(
  'voice-mode-indicator',
);
const voiceControls = document.getElementById(
  'voice-controls',
);
const voiceSelect = document.getElementById('voice-select');

// Store conversation history
let conversationHistory = [];

// Voice recording variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Text-to-speech functionality
let speechSynthesis = window.speechSynthesis;
let isVoiceReplyEnabled = false; // Track if voice reply should be used

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  // Show thinking message while waiting for API response
  appendMessage('bot', 'Gemini is thinking...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();

    // Remove the last thinking message and add actual response
    const lastMessage = chatBox.lastElementChild;
    if (
      lastMessage &&
      lastMessage.textContent === 'Gemini is thinking...'
    ) {
      lastMessage.remove();
    }
    appendMessage('bot', data.reply);

    // If voice mode is enabled, speak the reply
    if (isVoiceReplyEnabled) {
      speakText(data.reply);
    }

    // Add user message and bot reply to conversation history
    conversationHistory.push({
      role: 'user',
      parts: [{text: userMessage}],
    });
    conversationHistory.push({
      role: 'model',
      parts: [{text: data.reply}],
    });
  } catch (error) {
    console.error('Error:', error);
    // Remove the last thinking message and show error
    const lastMessage = chatBox.lastElementChild;
    if (
      lastMessage &&
      lastMessage.textContent === 'Gemini is thinking...'
    ) {
      lastMessage.remove();
    }
    appendMessage(
      'bot',
      'Sorry, something went wrong. Please try again.',
    );
  }
});

// Voice mode toggle functionality
voiceToggleBtn.addEventListener('click', function () {
  isVoiceReplyEnabled = !isVoiceReplyEnabled;
  updateVoiceModeUI();
});

function updateVoiceModeUI() {
  if (isVoiceReplyEnabled) {
    voiceToggleBtn.textContent = '🔊';
    voiceToggleBtn.title =
      'Voice Replies: ON (Click to turn OFF)';
    voiceModeIndicator.textContent = '🔊 Voice replies: ON';
    voiceModeIndicator.style.color = '#28a745';
    voiceControls.style.display = 'flex';
  } else {
    voiceToggleBtn.textContent = '🔇';
    voiceToggleBtn.title =
      'Voice Replies: OFF (Click to turn ON)';
    voiceModeIndicator.textContent =
      '🔇 Voice replies: OFF';
    voiceModeIndicator.style.color = '#6c757d';
    voiceControls.style.display = 'none';
  }
}

// Populate voice options
function populateVoiceOptions() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML =
    '<option value="auto">Auto (Best Available)</option>';

  // Filter and sort voices for better user experience
  const englishVoices = voices
    .filter(voice => voice.lang.startsWith('en'))
    .sort((a, b) => {
      // Prioritize enhanced/premium voices
      const aEnhanced =
        a.name.toLowerCase().includes('enhanced') ||
        a.name.toLowerCase().includes('premium');
      const bEnhanced =
        b.name.toLowerCase().includes('enhanced') ||
        b.name.toLowerCase().includes('premium');
      if (aEnhanced && !bEnhanced) return -1;
      if (!aEnhanced && bEnhanced) return 1;

      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });

  englishVoices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    const quality =
      voice.name.toLowerCase().includes('enhanced') ||
      voice.name.toLowerCase().includes('premium')
        ? ' ⭐'
        : '';
    option.textContent = `${voice.name}${quality}`;
    voiceSelect.appendChild(option);
  });
}

// Initialize voice options when available
if (speechSynthesis.getVoices().length > 0) {
  populateVoiceOptions();
} else {
  speechSynthesis.addEventListener(
    'voiceschanged',
    populateVoiceOptions,
    {once: true},
  );
}

// Initialize voice mode UI
updateVoiceModeUI();

// Voice recording functionality
voiceBtn.addEventListener('click', async function () {
  if (!isRecording) {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = function (event) {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async function () {
        const audioBlob = new Blob(audioChunks, {
          type: 'audio/webm',
        });
        await sendAudioMessage(audioBlob);

        // Stop all tracks to turn off microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      isRecording = true;
      voiceBtn.textContent = '⏹️';
      voiceBtn.title = 'Stop Recording';
      appendMessage(
        'user',
        '🎤 Recording... (click stop when done)',
      );
    } catch (error) {
      console.error('Error accessing microphone:', error);
      appendMessage(
        'bot',
        "Sorry, I couldn't access your microphone. Please check your permissions.",
      );
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    voiceBtn.textContent = '🎤';
    voiceBtn.title = 'Voice Message';
  }
});

async function sendAudioMessage(audioBlob) {
  // Remove the recording message
  const lastMessage = chatBox.lastElementChild;
  if (
    lastMessage?.textContent?.includes('🎤 Recording...')
  ) {
    lastMessage.remove();
  }

  appendMessage('user', '🎵 Voice message sent');
  appendMessage('bot', 'Processing your voice message...');

  try {
    const formData = new FormData();
    formData.append(
      'audio',
      audioBlob,
      'voice-message.webm',
    );
    formData.append(
      'history',
      JSON.stringify(conversationHistory),
    );

    const response = await fetch('/api/audio-chat', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();

    // Remove the processing message
    const lastMessage = chatBox.lastElementChild;
    if (
      lastMessage?.textContent ===
      'Processing your voice message...'
    ) {
      lastMessage.remove();
    }

    appendMessage('bot', data.reply);

    // Enable voice reply for future responses and speak this response
    isVoiceReplyEnabled = true;
    speakText(data.reply);

    // Add to conversation history
    conversationHistory.push({
      role: 'user',
      parts: [{text: '[Voice message]'}],
    });
    conversationHistory.push({
      role: 'model',
      parts: [{text: data.reply}],
    });
  } catch (error) {
    console.error('Error sending audio:', error);
    // Remove the processing message
    const lastMessage = chatBox.lastElementChild;
    if (
      lastMessage?.textContent ===
      'Processing your voice message...'
    ) {
      lastMessage.remove();
    }
    appendMessage(
      'bot',
      "Sorry, I couldn't process your voice message. Please try again.",
    );
  }
}

// Text-to-speech function
function speakText(text) {
  if (!speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Stop any ongoing speech
  speechSynthesis.cancel();

  // Clean and improve the text for more natural speech
  let cleanText = text
    // Remove emojis
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      '',
    )
    // Replace common abbreviations for better pronunciation
    .replace(/\bAI\b/g, 'A I')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bURL\b/g, 'U R L')
    .replace(/\bHTML\b/g, 'H T M L')
    .replace(/\bCSS\b/g, 'C S S')
    .replace(/\bJS\b/g, 'JavaScript')
    // Add natural pauses
    .replace(/\. /g, '. ')
    .replace(/! /g, '! ')
    .replace(/\? /g, '? ')
    // Handle exclamations better
    .replace(/Oh wow/gi, 'Oh, wow')
    .replace(/Plot twist/gi, 'Plot twist')
    .replace(/Buckle up/gi, 'Buckle up')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Wait for voices to load if needed
  const setVoiceAndSpeak = () => {
    const voices = speechSynthesis.getVoices();
    let selectedVoice = null;

    // Check if user has selected a specific voice
    const userSelectedVoice = voiceSelect.value;
    if (userSelectedVoice && userSelectedVoice !== 'auto') {
      selectedVoice = voices.find(
        voice => voice.name === userSelectedVoice,
      );
    }

    // If no user selection or auto, use priority system
    if (!selectedVoice) {
      // Priority order for natural-sounding voices (most human-like first)
      const voicePriority = [
        // macOS high-quality voices
        'Samantha (Enhanced)',
        'Alex (Enhanced)',
        'Ava (Enhanced)',
        'Allison (Enhanced)',
        'Susan (Enhanced)',
        'Victoria (Enhanced)',
        // Standard macOS voices
        'Samantha',
        'Alex',
        'Ava',
        'Allison',
        'Susan',
        'Victoria',
        // Google voices (usually high quality)
        'Google UK English Female',
        'Google US English Female',
        'Google UK English Male',
        'Google US English Male',
        // Microsoft voices
        'Microsoft Zira Desktop',
        'Microsoft David Desktop',
        // Any English female voice (generally sounds more natural)
        'female',
        // Fallback to any English voice
        'en-US',
        'en-GB',
        'en',
      ];

      // Try to find the best voice in order of preference
      for (const priority of voicePriority) {
        selectedVoice = voices.find(voice => {
          if (priority === 'female') {
            return (
              voice.lang.startsWith('en') &&
              voice.name.toLowerCase().includes('female')
            );
          }
          return (
            voice.name.includes(priority) ||
            voice.lang.startsWith(priority) ||
            voice.name
              .toLowerCase()
              .includes(priority.toLowerCase())
          );
        });
        if (selectedVoice) break;
      }
    }

    // Configure for natural, human-like speech
    utterance.voice = selectedVoice;
    utterance.rate = 0.95; // Slightly slower for clarity and naturalness
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 0.9; // Clear volume

    // Add natural speech patterns for different voice types
    if (selectedVoice) {
      const voiceName = selectedVoice.name.toLowerCase();

      // Adjust settings based on voice characteristics
      if (
        voiceName.includes('enhanced') ||
        voiceName.includes('premium')
      ) {
        utterance.rate = 0.9; // Slightly slower for premium voices
        utterance.pitch = 0.95; // Slightly lower for more natural sound
      } else if (voiceName.includes('google')) {
        utterance.rate = 1.0; // Google voices sound good at normal speed
        utterance.pitch = 1.0;
      } else if (
        voiceName.includes('alex') ||
        voiceName.includes('male')
      ) {
        utterance.pitch = 0.85; // Lower pitch for male voices
        utterance.rate = 0.9;
      } else if (
        voiceName.includes('samantha') ||
        voiceName.includes('female')
      ) {
        utterance.pitch = 1.05; // Slightly higher for female voices
        utterance.rate = 0.95;
      }
    }

    console.log(
      'Using voice:',
      selectedVoice ? selectedVoice.name : 'Default voice',
    );

    speechSynthesis.speak(utterance);
  };

  // Check if voices are already loaded
  if (speechSynthesis.getVoices().length > 0) {
    setVoiceAndSpeak();
  } else {
    // Wait for voices to load
    speechSynthesis.addEventListener(
      'voiceschanged',
      setVoiceAndSpeak,
      {once: true},
    );
  }
}

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
