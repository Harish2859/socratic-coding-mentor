import OpenAI from 'openai'

// Copy this file to src/config.js and fill in your key from console.groq.com
export const groq = new OpenAI({
  apiKey: 'YOUR_GROQ_API_KEY_HERE',
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
})

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
