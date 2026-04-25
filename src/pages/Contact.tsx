import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Seed Data ───────────────────────────────────────────────────────────────

const doctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'General Physician',
    hospital: 'City Medical Center',
    phone: '+1 (555) 234-5678',
    email: 'dr.johnson@citymedical.com',
    available: true,
    nextSlot: 'Today, 4:00 PM',
    initials: 'SJ',
    color: 'blue',
  },
  {
    id: '2',
    name: 'Dr. Michael Lee',
    specialty: 'Cardiologist',
    hospital: 'Heart & Vascular Institute',
    phone: '+1 (555) 345-6789',
    email: 'dr.lee@hvi.com',
    available: false,
    nextSlot: 'Monday, 10:00 AM',
    initials: 'ML',
    color: 'purple',
  },
]

const reasons = [
  'Prescription Refill',
  'Follow-up Appointment',
  'New Symptom',
  'Medication Side Effect',
  'General Consultation',
  'Other',
]

// ─── Color Maps ───────────────────────────────────────────────────────────────

type DoctorColor = 'blue' | 'purple'

const avatarClass: Record<DoctorColor, string> = {
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Contact() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)

  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    doctorId: '',
    reason: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updateField(field: keyof typeof formData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.patientName.trim()) newErrors.patientName = 'Name is required'
    if (!formData.phone.trim())       newErrors.phone       = 'Phone is required'
    if (!formData.doctorId)           newErrors.doctorId    = 'Please select a doctor'
    if (!formData.reason)             newErrors.reason      = 'Please select a reason'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setSubmitted(true)
  }

  const selectedDoctor = doctors.find(d => d.id === formData.doctorId)

  return (
    <div className="space-y-6">

   

    </div>
  )
}
