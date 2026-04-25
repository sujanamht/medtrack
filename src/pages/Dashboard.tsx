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

      {/* 3. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800">Today's Schedule</h3>
            <span className="text-xs text-gray-400">Saturday, April 25, 2025</span>
          </div>

          <div className="space-y-0">
            {meds.map((med, idx) => (
              <div key={med.id}>
                <div className="flex items-center gap-4 py-3">
                  {/* Time badge */}
                  <div className="w-16 shrink-0 text-center text-xs font-medium bg-blue-50 text-blue-600 rounded-lg py-1">
                    {med.time}
                  </div>

                  {/* Med info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{med.name}</p>
                    <p className="text-xs text-gray-500">{med.dosage} · {med.frequency}</p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0 flex flex-col items-center gap-0.5">
                    {med.status === 'taken' && (
                      <>
                        <i className="fa-solid fa-circle-check text-green-500 text-xl" />
                        <span className="text-xs text-green-600">Taken</span>
                      </>
                    )}
                    {med.status === 'skipped' && (
                      <>
                        <i className="fa-solid fa-forward text-gray-400 text-xl" />
                        <span className="text-xs text-gray-400">Skipped</span>
                      </>
                    )}
                    {med.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markStatus(med.id, 'taken')}
                          className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Take
                        </button>
                        <button
                          onClick={() => markStatus(med.id, 'skipped')}
                          className="border border-gray-300 text-gray-500 text-xs px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {idx < meds.length - 1 && (
                  <div className="border-t border-gray-100" />
                )}
              </div>
            ))}
          </div>

          {/* Adherence bar */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
              <span>Today's adherence</span>
              <span>{adherencePct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${adherenceBarClass(adherencePct)}`}
                style={{ width: `${adherencePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">

          {/* CARD A — Alerts & Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-bell text-gray-700" />
              <h3 className="font-bold text-gray-800 flex-1">Alerts</h3>
              {unreadCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${n.type === 'refill'   ? 'bg-red-50'   : ''}
                    ${n.type === 'reminder' ? 'bg-blue-50'  : ''}
                    ${n.type === 'diet'     ? 'bg-green-50' : ''}
                  `}>
                    {n.type === 'refill'   && <i className="fa-solid fa-arrows-rotate text-red-500 text-sm" />}
                    {n.type === 'reminder' && <i className="fa-solid fa-clock text-blue-500 text-sm" />}
                    {n.type === 'diet'     && <i className="fa-solid fa-bowl-food text-green-500 text-sm" />}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>
          </div>

          {/* CARD B — Supply Status */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-warehouse text-gray-700" />
              <h3 className="font-bold text-gray-800">Supply Status</h3>
            </div>

            <div className="space-y-3">
              {supplyStatus.map(item => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${supplyBadgeClass(item.status)}`}>
                      {item.daysLeft} days left
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${supplyBarClass(item.status)}`}
                      style={{ width: `${(item.pillsRemaining / item.totalPills) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/medications')}
              className="mt-5 w-full border border-blue-600 text-blue-600 rounded-lg py-2 text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Manage Medications
            </button>
          </div>

        </div>
      </div>

      {/* 4. QUICK ACTIONS ROW */}
      <div className="grid grid-cols-3 gap-4">

        <div
          onClick={() => navigate('/upload')}
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-upload text-blue-600 text-lg" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800">Upload Prescription</p>
          <p className="text-xs text-gray-400 mt-0.5">Add new prescription</p>
        </div>

        <div
          onClick={() => navigate('/medications')}
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-pills text-purple-600 text-lg" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800">View Medications</p>
          <p className="text-xs text-gray-400 mt-0.5">Manage your meds</p>
        </div>

        <div
          onClick={() => navigate('/diet')}
          className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-bowl-food text-green-600 text-lg" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800">Diet Tips</p>
          <p className="text-xs text-gray-400 mt-0.5">View recommendations</p>
        </div>

      </div>

    

    </div>
  )
}
