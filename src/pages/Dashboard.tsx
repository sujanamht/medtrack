import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Seed Data ───────────────────────────────────────────────────────────────

type MedStatus = 'taken' | 'skipped' | 'pending'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string
  status: MedStatus
}

const initialMedications: Medication[] = [
  { id: '1',  name: 'Metformin',    dosage: '500mg', frequency: 'Twice daily',          time: '8:00 AM', status: 'taken' },
  { id: '1b', name: 'Metformin',    dosage: '500mg', frequency: 'Twice daily',          time: '8:00 PM', status: 'pending' },
  { id: '2',  name: 'Lisinopril',   dosage: '10mg',  frequency: 'Once daily',           time: '9:00 AM', status: 'taken' },
  { id: '3',  name: 'Atorvastatin', dosage: '20mg',  frequency: 'Once daily at night',  time: '9:00 PM', status: 'pending' },
  { id: '4',  name: 'Aspirin',      dosage: '75mg',  frequency: 'Once daily',           time: '9:00 AM', status: 'taken' },
]

const notifications = [
  { id: '1', type: 'refill',   message: 'Metformin running low — only 3 days left',                  time: '2 hours ago',  read: false },
  { id: '2', type: 'reminder', message: 'Time to take Atorvastatin 20mg',                            time: 'Today 9:00 PM', read: false },
  { id: '3', type: 'diet',     message: 'New dietary tips available based on your medications',       time: 'Yesterday',    read: true },
]

const supplyStatus = [
  { name: 'Metformin',    daysLeft: 3,  status: 'critical', pillsRemaining: 6,  totalPills: 60 },
  { name: 'Lisinopril',   daysLeft: 18, status: 'low',      pillsRemaining: 18, totalPills: 30 },
  { name: 'Atorvastatin', daysLeft: 28, status: 'good',     pillsRemaining: 28, totalPills: 30 },
  { name: 'Aspirin',      daysLeft: 25, status: 'good',     pillsRemaining: 25, totalPills: 30 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function supplyBadgeClass(status: string) {
  if (status === 'critical') return 'bg-red-100 text-red-600'
  if (status === 'low')      return 'bg-orange-100 text-orange-600'
  return 'bg-green-100 text-green-600'
}

function supplyBarClass(status: string) {
  if (status === 'critical') return 'bg-red-500'
  if (status === 'low')      return 'bg-orange-400'
  return 'bg-green-500'
}

function adherenceBarClass(pct: number) {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-orange-400'
  return 'bg-red-500'
}

function adherenceBadgeClass(pct: number) {
  if (pct >= 80) return 'bg-green-100 text-green-700'
  if (pct >= 50) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-600'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const [meds, setMeds] = useState<Medication[]>(initialMedications)

  const takenCount   = meds.filter(m => m.status === 'taken').length
  const totalCount   = meds.length
  const adherencePct = Math.round((takenCount / totalCount) * 100)
  const unreadCount  = notifications.filter(n => !n.read).length

  function markStatus(id: string, status: MedStatus) {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  return (
    <div className="space-y-6">

       {/* 1. WELCOME ROW */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Good morning, John 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">Saturday, April 25, 2025</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${adherenceBadgeClass(adherencePct)}`}>
          Today's Adherence: {adherencePct}%
        </span>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Card 1 — Today's Doses */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-pills text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
          <p className="text-xs font-medium text-gray-500">Total doses today</p>
          <p className="text-xs">
            <span className="text-green-600 font-medium">{takenCount} taken</span>
            <span className="text-gray-400"> · {totalCount - takenCount} remaining</span>
          </p>
        </div>

        {/* Card 2 — Streak */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-fire text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">7</p>
          <p className="text-xs font-medium text-gray-500">Day streak</p>
          <p className="text-xs text-green-600 font-medium">Keep it up!</p>
        </div>

        {/* Card 3 — Medications */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-kit-medical text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">4</p>
          <p className="text-xs font-medium text-gray-500">Active medications</p>
          <p className="text-xs text-gray-400">Across 2 prescriptions</p>
        </div>

        {/* Card 4 — Next Dose */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-clock text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">8 PM</p>
          <p className="text-xs font-medium text-gray-500">Next dose</p>
          <p className="text-xs text-gray-400">Metformin + Atorvastatin</p>
        </div>

      </div>

    

    </div>
  )
}
