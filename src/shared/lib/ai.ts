export async function generateDescriptionForCategory(name: string): Promise<string> {
  const model = process.env.GROQ_MODEL?.trim()
  const apiKey = process.env.GROQ_API_KEY?.trim()

  if (!apiKey || !model) {
    throw new Error('Las variables de entorno GROQ_API_KEY o GROQ_MODEL no están configuradas.')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente experto en inventarios de gimnasios y centros deportivos. Generá una descripción de categoría súper corta, profesional y en español rioplatense (o neutro natural), de un máximo de 100 caracteres. Respondé únicamente con la descripción pura, sin rodeos, sin comillas y sin introducciones.',
        },
        {
          role: 'user',
          content: `Generá la descripción de la categoría: "${name}"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 60,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  const content = result?.choices?.[0]?.message?.content || ''
  
  // Clean up any double quotes or trailing/leading spaces the model might include
  return content.replace(/^["']|["']$/g, '').trim()
}
