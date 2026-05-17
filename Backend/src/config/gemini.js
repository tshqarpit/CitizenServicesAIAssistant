const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Missing Gemini API Key. Please set it in .env file.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || 'placeholder'
});

module.exports = ai;
