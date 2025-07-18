const express = require('express');
const app = express();
const port = 3000;
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  GoogleGenerativeAI,
} = require('@google/generative-ai');

dotenv.config();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for serverless
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only audio files are allowed.',
        ),
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Note: uploads directory not needed for serverless deployment

//Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.static('public'));

// initiate AI model
const ai = new GoogleGenerativeAI(process.env.API_KEY);
const model = ai.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

app.get('/', (req, res) => {
  res.send(process.env.API_KEY);
});

app.post('/api/chat', async (req, res) => {
  try {
    const {message, history = []} = req.body;

    if (!message) {
      return res
        .status(400)
        .json({error: 'Message is required'});
    }

    // Add system instruction to give the AI a fun personality
    const systemInstruction = {
      role: 'user',
      parts: [
        {
          text: `You are a fun, quirky, and energetic AI assistant with a playful personality! Here's how you should behave:

🎭 PERSONALITY TRAITS:
- Be enthusiastic and use emojis frequently
- Make random jokes and puns when appropriate
- Sometimes respond with unexpected but helpful tangents
- Be slightly sarcastic but always friendly
- Use casual language and slang occasionally
- Reference pop culture, memes, or random fun facts
- Be curious and ask follow-up questions
- Sometimes act surprised or excited about mundane things

🎲 RANDOMNESS GUIDELINES:
- Occasionally start responses with random exclamations like "Oh wow!", "Plot twist!", "Buckle up!", etc.
- Mix serious helpful advice with playful commentary
- Sometimes relate answers to completely random topics before circling back
- Use creative analogies and metaphors
- Occasionally "break the fourth wall" and comment on being an AI

Remember: Stay helpful and accurate, but make every interaction fun and memorable!`,
        },
      ],
    };

    // Create chat session with history and system instruction
    const chat = model.startChat({
      history: [systemInstruction, ...history],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.9, // Higher temperature for more creative/random responses
        topP: 0.95, // Higher topP for more diverse responses
        topK: 40, // Allow more token choices for creativity
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const reply = response.text();

    res.json({reply});
  } catch (error) {
    console.error('Error generating response:', error);
    res
      .status(500)
      .json({error: 'Failed to generate response'});
  }
});

app.post(
  '/api/audio-chat',
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({error: 'Audio file is required'});
      }

      const {history = []} = req.body;
      let parsedHistory = [];

      // Parse history if it's a string
      if (typeof history === 'string') {
        try {
          parsedHistory = JSON.parse(history);
        } catch (parseError) {
          console.warn(
            'Failed to parse history:',
            parseError.message,
          );
          parsedHistory = [];
        }
      } else {
        parsedHistory = history;
      }

      // Read the uploaded audio file from memory buffer
      const audioBuffer = req.file.buffer;
      const audioBase64 = audioBuffer.toString('base64');

      // Add system instruction for fun personality
      const systemInstruction = {
        role: 'user',
        parts: [
          {
            text: `You are a fun, quirky, and energetic AI assistant with a playful personality! Here's how you should behave:

🎭 PERSONALITY TRAITS:
- Be enthusiastic and use emojis frequently
- Make random jokes and puns when appropriate
- Sometimes respond with unexpected but helpful tangents
- Be slightly sarcastic but always friendly
- Use casual language and slang occasionally
- Reference pop culture, memes, or random fun facts
- Be curious and ask follow-up questions
- Sometimes act surprised or excited about mundane things

🎲 RANDOMNESS GUIDELINES:
- Occasionally start responses with random exclamations like "Oh wow!", "Plot twist!", "Buckle up!", etc.
- Mix serious helpful advice with playful commentary
- Sometimes relate answers to completely random topics before circling back
- Use creative analogies and metaphors
- Occasionally "break the fourth wall" and comment on being an AI

Remember: Stay helpful and accurate, but make every interaction fun and memorable!`,
          },
        ],
      };

      // Create chat session with history
      const chat = model.startChat({
        history: [systemInstruction, ...parsedHistory],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        },
      });

      // Process the audio file with Gemini
      const result = await chat.sendMessage([
        {
          inlineData: {
            data: audioBase64,
            mimeType: req.file.mimetype,
          },
        },
        {
          text: "Please listen to this audio and respond to what the person is saying. If it's a question, answer it. If it's a statement, respond appropriately with your fun personality!",
        },
      ]);

      const response = result.response;
      const reply = response.text();

      res.json({
        reply,
        transcription: 'Audio processed successfully',
      });
    } catch (error) {
      console.error('Error processing audio:', error);

      res
        .status(500)
        .json({error: 'Failed to process audio'});
    }
  },
);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
