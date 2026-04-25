import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type Status = 'critical' | 'low' | 'good'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  pillsRemaining: number
  totalPills: number
  durationDays: number
  startDate: string
  prescribedBy: string
  notes: string
  status: Status
  daysLeft: number
}

interface PrescriptionMed {
  name: string
  dosage: string
  frequency: string
  durationDays: number
  notes: string
}

interface Prescription {
  patientName: string
  doctorName: string
  dateIssued: string
  medications: PrescriptionMed[]
  _meta: {
    filename: string
    uploadedAt: string
  }
}

function computeStatus(daysLeft: number, total: number): Status {
  const pct = total > 0 ? daysLeft / total : 0
  if (daysLeft <= 3) return 'critical'
  if (pct <= 0.3) return 'low'
  return 'good'
}

function prescriptionsToMeds(prescriptions: Prescription[]): Medication[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const meds: Medication[] = []

  prescriptions.forEach((rx) => {
    const startDate = rx._meta.uploadedAt.split('T')[0]
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    rx.medications.forEach((m, i) => {
      const total = m.durationDays || 30
      const elapsed = Math.floor((today.getTime() - start.getTime()) / 86400000)
      const daysLeft = Math.max(0, total - elapsed)
      const pillsRemaining = daysLeft

      meds.push({
        id: `${rx._meta.filename}-${i}`,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        durationDays: total,
        startDate,
        prescribedBy: rx.doctorName || 'Unknown',
        notes: m.notes,
        totalPills: total,
        pillsRemaining,
        daysLeft,
        status: computeStatus(daysLeft, total),
      })
    })
  })

  return meds
}

const statusColors: Record<Status, { border: string; avatar: string; text: string; bar: string; badge: string; outline: string }> = {
  critical: {
    border: 'border-red-500',
    avatar: 'bg-red-500',
    text: 'text-red-500',
    bar: 'bg-red-500',
    badge: 'border-red-400 text-red-600',
    outline: 'border-red-500 text-red-600 hover:bg-red-50',
  },
  low: {
    border: 'border-orange-500',
    avatar: 'bg-orange-500',
    text: 'text-orange-500',
    bar: 'bg-orange-500',
    badge: 'border-orange-400 text-orange-600',
    outline: 'border-orange-500 text-orange-600 hover:bg-orange-50',
  },
  good: {
    border: 'border-green-500',
    avatar: 'bg-green-500',
    text: 'text-green-500',
    bar: 'bg-green-500',
    badge: 'border-green-400 text-green-600',
    outline: 'border-green-500 text-green-600 hover:bg-green-50',
  },
}

type Filter = 'all' | 'critical' | 'low' | 'good'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Medications() {
  const navigate = useNavigate()
  const [meds, setMeds] = useState<Medication[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:5001/api/prescriptions')
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then((data: Prescription[]) => {
        setMeds(prescriptionsToMeds(data))
      })
      .catch((err) => {
        setError(err.message || 'Failed to load medications')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? meds : meds.filter((m) => m.status === filter)

  const counts = {
    total: meds.length,
    critical: meds.filter((m) => m.status === 'critical').length,
    low: meds.filter((m) => m.status === 'low').length,
    good: meds.filter((m) => m.status === 'good').length,
  }

  function removeMed(id: string) {
    if (confirm('Remove this medication?')) {
      setMeds((prev) => prev.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meds.length} active medication{meds.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            onClick={() => navigate('/upload')}
          >
            Upload Prescription
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="fa-solid fa-pills text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <i className="fa-solid fa-triangle-exclamation text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{counts.critical}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <i className="fa-solid fa-circle-minus text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">{counts.low}</div>
            <div className="text-xs text-gray-500">Low Supply</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <i className="fa-solid fa-circle-check text-green-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{counts.good}</div>
            <div className="text-xs text-gray-500">Good</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'critical', 'low', 'good'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'low' ? 'Low Supply' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <i className="fa-solid fa-spinner animate-spin text-4xl text-blue-400" />
          <p className="text-gray-500 mt-4 font-medium">Loading medications...</p>
        </div>
      ) : error ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <i className="fa-solid fa-circle-exclamation text-4xl text-red-400" />
          <p className="text-gray-500 mt-4 font-medium">Could not load medications</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
          <p className="text-gray-400 text-xs mt-2">Make sure the backend is running on port 5001</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <i className="fa-solid fa-pills text-6xl text-gray-300" />
          <p className="text-gray-500 mt-4 font-medium">
            {meds.length === 0 ? 'No medications yet' : 'No medications found'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {meds.length === 0
              ? 'Upload a prescription to get started'
              : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((med) => {
            const c = statusColors[med.status]
            const pct = Math.round((med.pillsRemaining / med.totalPills) * 100)
            return (
              <div
                key={med.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${c.border} p-5`}
              >
                {/* Card header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${c.avatar} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {med.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900 leading-tight">{med.name}</div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {med.dosage}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supply section */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Days Remaining</span>
                    <span className={`text-sm font-medium ${c.text}`}>
                      {med.daysLeft} / {med.totalPills} days
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 w-full">
                    <div
                      className={`h-2 rounded-full ${c.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {med.status === 'critical' && (
                    <p className="text-xs text-red-500 mt-1">⚠ Critically low — refill immediately</p>
                  )}
                  {med.status === 'low' && (
                    <p className="text-xs text-orange-500 mt-1">• Running low — refill soon</p>
                  )}
                </div>

                {/* Details row */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 flex items-center gap-1.5">
                    <i className="fa-solid fa-clock" />
                    {med.frequency}
                  </span>
                  {med.prescribedBy && med.prescribedBy !== 'Unknown' && (
                    <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 flex items-center gap-1.5">
                      <i className="fa-solid fa-user-doctor" />
                      {med.prescribedBy}
                    </span>
                  )}
                  <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar" />
                    {formatDate(med.startDate)}
                  </span>
                </div>

                {med.notes && (
                  <p className="mt-3 text-xs text-gray-400 italic">{med.notes}</p>
                )}

                {/* Footer */}
                <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
                  <button
                    className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${c.outline}`}
                    onClick={() => window.alert('Refill request noted! Contact your doctor.')}
                  >
                    <i className="fa-solid fa-arrows-rotate" />
                    Request Refill
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => removeMed(med.id)}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
