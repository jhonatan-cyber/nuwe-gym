import Groq from 'groq-sdk'

let client: Groq | null = null

export function getGroq(): Groq {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no configurada en .env')
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return client
}

export const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
