export interface Prescription {
  id: string
  patientName: string
  doctorName: string
  dateIssued: string
  imageUrl: string
  rawText: string
  createdAt: string
}

export interface Medication {
  id: string
  prescriptionId: string
  name: string
  dosage: string
  frequency: string
  durationDays: number
  pillsPerDose: number
  totalPills: number
  pillsRemaining: number
  startDate: string
  refillReminderSent: boolean
  barcode: string
  notes: string
  createdAt: string
}

export interface MedicationLog {
  id: string
  medicationId: string
  scheduledDate: string
  takenAt: string
  skipped: boolean
  createdAt: string
}

export interface Notification {
  id: string
  medicationId: string
  type: 'refill' | 'daily_reminder' | 'diet' | 'general'
  message: string
  read: boolean
  createdAt: string
}

export interface DietRecommendation {
  id: string
  prescriptionId: string
  detectedConditions: string[]
  recommendations: string
  createdAt: string
}
