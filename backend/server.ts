import express from 'express';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Type definitions
interface ChatMessage {
  isUser: boolean;
  text: string;
}

interface ChatbotRequestBody {
  userInput: string;
  emotion: string;
  messageHistory?: ChatMessage[];
}

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Utility function to clean up temporary files
const cleanupFile = (filePath: string): void => {
  fs.unlink(filePath, (err) => {
    if (err) console.error('Error deleting temporary file:', err);
  });
};

// Endpoint for emotion detection
app.post('/detect-emotion', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  try {
    // Path to your Python script and model
    const pythonScriptPath = path.join(__dirname, 'ai', 'emotion_detector.py');
    const modelPath = path.join(__dirname, 'ai', 'models', 'emotion_model.pth');

    // Spawn Python process
    const pythonProcess = spawn('python', [
      pythonScriptPath,
      '--image', req.file.path,
      '--model', modelPath
    ]);

    let result = '';
    let errorOutput = '';

    // Collect data from Python process
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      // Clean up the temporary file
      cleanupFile(req.file!.path);

      if (code !== 0) {
        console.error('Python process error:', errorOutput);
        return res.status(500).json({ 
          error: 'Emotion detection failed',
          details: errorOutput
        });
      }

      try {
        const emotion = JSON.parse(result.trim());
        res.json({ emotion });
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        res.status(500).json({ 
          error: 'Error parsing emotion detection result',
          details: result
        });
      }
    });

  } catch (error) {
    // Clean up the temporary file in case of error
    if (req.file) cleanupFile(req.file.path);
    
    console.error('Error in emotion detection:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Enhanced chatbot endpoint with emotion integration
app.post('/chatbot', async (req: express.Request, res: express.Response): Promise<void> => {
  const { userInput, emotion, messageHistory } = req.body as ChatbotRequestBody;

  if (!userInput) {
    res.status(400).json({ error: 'User input is required' });
    return;
  }

  try {
    // Construct the system message with emotion context
    const systemMessage = {
      role: 'system',
      content: `You are an empathetic AI assistant. The user is currently feeling ${emotion || 'neutral'}. 
                Adjust your response tone and content to be appropriate for their emotional state.
                If they're feeling negative emotions (sad, angry, fearful), be extra supportive and understanding.
                If they're feeling positive emotions (happy, excited), match their enthusiasm.
                If they're neutral, maintain a balanced and professional tone.
                Always maintain a helpful and professional demeanor while showing emotional intelligence.`
    };

    // Construct the conversation context
    const messages = [systemMessage];

    // Add message history if provided
    if (messageHistory && Array.isArray(messageHistory)) {
      messages.push(...messageHistory.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      })));
    }

    // Add current user input
    messages.push({ role: 'user', content: userInput });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      max_tokens: 150,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response generated');
    }

    res.json({ 
      response,
      emotion: emotion || 'neutral'
    });

  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;