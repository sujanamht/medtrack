import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Seed Data ───────────────────────────────────────────────────────────────

const doctors = [
  {
    id: '1',
    name: 'Dr. Abir Abdo',
    specialty: 'Internal Medicine',
    hospital: 'North Oaks Health System',
    phone: '+1 (985) 230-2778',
    available: true,
    nextSlot: 'Today, 4:00 PM',
    initials: 'SJ',
    color: 'blue',
  },
  {
    id: '2',
    name: 'Dr. Nidal Abi Rafeh',
    specialty: 'Cardiologist',
    hospital: 'North Oaks Health System',
    phone: '+1 (985) 230-2778',
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

    {/* 3. APPOINTMENT FORM CARD */}
      <div ref={formRef} className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-1">
          <i className="fa-solid fa-calendar-plus text-blue-600 mr-2" />
          <h2 className="font-semibold text-gray-800 text-lg">Request Appointment</h2>
        </div>

        {/* SUCCESS STATE */}
        {submitted ? (
          <div className="flex flex-col items-center py-12 text-center">
            <i className="fa-solid fa-circle-check text-green-500 text-6xl" />
            <p className="text-2xl font-bold text-gray-800 mt-4">Request Sent!</p>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              {selectedDoctor?.name ?? 'Your doctor'} will contact you at{' '}
              {formData.phone} to confirm your appointment.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (

          /* FORM STATE */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">

            {/* Row 1 — Patient Name + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Patient Name</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={e => updateField('patientName', e.target.value)}
                  placeholder="Your full name"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {errors.patientName && (
                  <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Row 2 — Select Doctor + Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Select Doctor</label>
                <select
                  value={formData.doctorId}
                  onChange={e => updateField('doctorId', e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Reason for Contact</label>
                <select
                  value={formData.reason}
                  onChange={e => updateField('reason', e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a reason...</option>
                  {reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.reason && (
                  <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
                )}
              </div>
            </div>

            {/* Row 3 — Preferred Date + Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Preferred Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.preferredDate}
                  onChange={e => updateField('preferredDate', e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Preferred Time</label>
                <select
                  value={formData.preferredTime}
                  onChange={e => updateField('preferredTime', e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select time slot...</option>
                  <option value="morning">Morning (9AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 8PM)</option>
                </select>
              </div>
            </div>

            {/* Row 4 — Message */}
            <div>
              <label className="text-sm font-medium text-gray-700">Message or Symptoms</label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={e => updateField('message', e.target.value)}
                placeholder="Describe your symptoms, reason for visit, or any questions for the doctor..."
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors mt-2"
            >
              <i className="fa-solid fa-paper-plane mr-2" />
              Send Appointment Request
            </button>

          </form>
        )}
      </div>

    {/* 4. EMERGENCY BANNER */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl shrink-0" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Medical Emergency?</p>
            <p className="text-xs text-red-500 mt-0.5">
              Call 911 or go to your nearest emergency room. Do not use this form for emergencies.
            </p>
          </div>
        </div>
        <a
          href="tel:911"
          className="shrink-0 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
        >
          <i className="fa-solid fa-phone mr-1" />
          Call 911
        </a>
      </div>


    </div>
  )
}
