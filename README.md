# 🤖 Gemini AI Chatbot

A fun, interactive AI chatbot powered by Google Gemini with voice support and a quirky personality!

## ✨ Features

- 💬 **Text Chat**: Interactive text-based conversations with AI
- 🎤 **Voice Input**: Record voice messages and get AI responses
- 🔊 **Voice Output**: AI responds with natural-sounding speech
- 🎭 **Fun Personality**: Quirky, energetic AI with emojis and jokes
- 📱 **Responsive Design**: Works great on desktop and mobile
- 🎨 **Modern UI**: Clean, professional interface with smooth animations

## 🚀 Live Demo

[Your deployed app will be here]

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **AI**: Google Gemini 2.5 Flash
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Voice**: Web Speech API, MediaRecorder API
- **File Upload**: Multer
- **Deployment**: Vercel/Railway

## 🏗️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arrizalrahmat/my-chatbot.git
   cd my-chatbot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add your Google Gemini API key:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser

## 🔧 Configuration

### Environment Variables

- `API_KEY`: Your Google Gemini API key (required)
- `PORT`: Server port (default: 3000)

### Getting Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

## 📝 API Endpoints

- `GET /`: Health check endpoint
- `POST /api/chat`: Text-based chat endpoint
- `POST /api/audio-chat`: Voice-based chat endpoint

## 🎯 Usage

### Text Chat
1. Type your message in the input field
2. Press Send or hit Enter
3. AI responds with text and optional voice

### Voice Chat
1. Click the 🎤 microphone button
2. Speak your message
3. Click ⏹️ to stop recording
4. AI processes audio and responds with voice

### Voice Controls
- Click 🔇/🔊 to toggle voice replies
- Select preferred voice from dropdown when voice mode is enabled

## 🌟 Features in Detail

### AI Personality
The chatbot has a fun, quirky personality that:
- Uses emojis and casual language
- Makes jokes and puns
- References pop culture
- Shows enthusiasm and curiosity
- Sometimes breaks the fourth wall

### Voice Quality
- Smart voice selection for natural speech
- Platform-optimized (Samantha Enhanced on macOS, etc.)
- Emoji filtering for better pronunciation
- Adjustable speech rate and pitch

### UI/UX
- Modern, responsive design
- Real-time chat interface
- Voice recording indicators
- Smooth animations and transitions
- Mobile-friendly layout

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add `API_KEY` environment variable in Vercel dashboard
3. Deploy automatically from main branch

### Railway
1. Connect your GitHub repository to Railway
2. Add `API_KEY` environment variable
3. Deploy with one click

### Manual Deployment
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**arrizalrahmat**
- GitHub: [@arrizalrahmat](https://github.com/arrizalrahmat)

## 🙏 Acknowledgments

- Google Gemini AI for the language model
- Web Speech API for voice capabilities
- Express.js for the backend framework

---

Made with ❤️ and lots of ☕
