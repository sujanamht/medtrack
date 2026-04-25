import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function extractPrescription(
  imageBase64: string,
  mimeType: string
): Promise<{
  patientName: string | null
  doctorName: string | null
  dateIssued: string | null
  medications: Array<{
    name: string | null
    dosage: string | null
    frequency: string | null
    durationDays: number | null
    pillsPerDose: number | null
    notes: string | null
  }>
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
    `Extract all information from this medical prescription image. Return ONLY a valid JSON object with these exact fields: patientName, doctorName, dateIssued (YYYY-MM-DD format), medications (array of objects with fields: name, dosage, frequency, durationDays (number), pillsPerDose (number), notes). If any field is unclear write null. No markdown, no explanation, just the raw JSON.`,
  ])

  const text = result.response.text()
  return JSON.parse(text)
}

export async function getDietRecommendations(medications: string[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent(
    `Based on these medications: ${medications.join(', ')}, identify the likely medical conditions being treated, then provide specific dietary recommendations, foods to avoid, and lifestyle tips. Format the response in clear sections with headings.`
  )

  return result.response.text()
}
