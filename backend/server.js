const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config(); // To load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY, // Ensure you have the API key in a backend .env file
});

// Define the chatbot endpoint
app.post('/chatbot', async (req, res) => {
    const { userInput, emotion } = req.body;
    const prompt = `I am feeling ${emotion}. ${userInput}`;
    
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            max_tokens: 150,
            temperature: 1.3,
            n: 1,
        });

        res.json({ response: response.choices[0].message?.content || "No response from chatbot." });
    } catch (error) {
        console.error("Error with OpenAI API:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));