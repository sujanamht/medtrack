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

    

    </div>
  )
}
