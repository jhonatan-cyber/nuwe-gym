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

export async function generateDescriptionForCategory(name: string): Promise<string> {
  const groq = getGroq()
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Eres un asistente experto en inventarios de gimnasios y centros deportivos. Generá una descripción de categoría súper corta, profesional y en español, de un máximo de 100 caracteres. Respondé únicamente con la descripción pura, sin rodeos, sin comillas y sin introducciones.',
      },
      {
        role: 'user',
        content: `Generá la descripción de la categoría: "${name}"`,
      },
    ],
    temperature: 0.7,
    max_tokens: 60,
  })

  const content = completion.choices[0].message.content || ''
  return content.replace(/^["']|["']$/g, '').trim()
}
