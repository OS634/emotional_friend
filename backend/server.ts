import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

// Define the chatbot endpoint
app.post('/chatbot', async (req: Request, res: Response) => {
  const { userInput, emotion } = req.body;
  const prompt = `I am feeling ${emotion}. ${userInput}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an empathetic assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 1.0,
    });

    res.json({ response: response.choices[0].message?.content });
  } catch (error: any) {
    console.error(
      'Error with OpenAI API:',
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));