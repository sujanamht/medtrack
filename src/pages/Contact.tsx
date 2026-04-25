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

    {/* 1. PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Contact Doctor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Reach your healthcare providers or request appointments
        </p>
      </div>

    {/* 2. DOCTOR CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {doctors.map(doctor => (
          <div key={doctor.id} className="bg-white rounded-xl shadow-sm p-5">

            {/* Top row */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${avatarClass[doctor.color as DoctorColor]}`}
              >
                {doctor.initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{doctor.name}</p>
                <p className="text-sm text-blue-600">{doctor.specialty}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <i className="fa-solid fa-hospital mr-1" />
                  {doctor.hospital}
                </p>
              </div>

              <div className="ml-auto shrink-0">
                {doctor.available ? (
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-3 py-1 text-xs">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Unavailable
                  </span>
                )}
              </div>
            </div>

            {/* Contact details */}
            <div className="mt-4 space-y-1.5 text-sm text-gray-600">
              <p>
                <i className="fa-solid fa-phone w-4 text-gray-400 mr-2" />
                {doctor.phone}
              </p>
              <p>
                <i className="fa-solid fa-envelope w-4 text-gray-400 mr-2" />
                {doctor.email}
              </p>
              <p>
                <i className="fa-solid fa-clock w-4 text-gray-400 mr-2" />
                Next available: {doctor.nextSlot}
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.alert('Calling ' + doctor.name)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
              >
                <i className="fa-solid fa-phone mr-2" />
                Call Now
              </button>
              <button
                onClick={() => {
                  updateField('doctorId', doctor.id)
                  formRef.current?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                <i className="fa-solid fa-message mr-2" />
                Message
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
