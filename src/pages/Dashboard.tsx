import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type MedStatus = 'taken' | 'skipped' | 'pending'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string
  status: MedStatus
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const initialMedications: Medication[] = [
  { id: '1',  name: 'Metformin',    dosage: '500mg', frequency: 'Twice daily',          time: '8:00 AM', status: 'taken'   },
  { id: '1b', name: 'Metformin',    dosage: '500mg', frequency: 'Twice daily',          time: '8:00 PM', status: 'pending' },
  { id: '2',  name: 'Lisinopril',   dosage: '10mg',  frequency: 'Once daily',           time: '9:00 AM', status: 'taken'   },
  { id: '3',  name: 'Atorvastatin', dosage: '20mg',  frequency: 'Once daily at night',  time: '9:00 PM', status: 'pending' },
  { id: '4',  name: 'Aspirin',      dosage: '75mg',  frequency: 'Once daily',           time: '9:00 AM', status: 'taken'   },
]

const supplyData = [
  { name: 'Metformin',    daysLeft: 3,  status: 'critical', pillsRemaining: 6,  totalPills: 60 },
  { name: 'Lisinopril',   daysLeft: 18, status: 'low',      pillsRemaining: 18, totalPills: 30 },
  { name: 'Atorvastatin', daysLeft: 28, status: 'good',     pillsRemaining: 28, totalPills: 30 },
  { name: 'Aspirin',      daysLeft: 25, status: 'good',     pillsRemaining: 25, totalPills: 30 },
]

// Past 6 days of adherence (Mon–Sat); today is appended dynamically
const pastWeekAdherence = [
  { day: 'Mon', pct: 60 },
  { day: 'Tue', pct: 80 },
  { day: 'Wed', pct: 75 },
  { day: 'Thu', pct: 90 },
  { day: 'Fri', pct: 70 },
  { day: 'Sat', pct: 85 },
]

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function HealthChart({ data }: { data: { day: string; pct: number }[] }) {
  const W = 400, H = 160
  const padL = 32, padR = 12, padT = 14, padB = 32
  const chartW = W - padL - padR
  const chartH = H - padT - padB

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + (1 - d.pct / 100) * chartH,
    pct: d.pct,
    day: d.day,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`

  function dotColor(pct: number) {
    if (pct >= 80) return '#22c55e'
    if (pct >= 50) return '#f97316'
    return '#ef4444'
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal reference lines at 25 / 50 / 75 / 100 */}
      {[25, 50, 75, 100].map(v => {
        const y = padT + (1 - v / 100) * chartH
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} fontSize="9" textAnchor="end" fill="#9ca3af">{v}%</text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill={dotColor(p.pct)} stroke="white" strokeWidth="2" />
      ))}

      {/* X-axis labels */}
      {pts.map((p, i) => (
        <text
          key={i} x={p.x} y={H - 4}
          fontSize="9" textAnchor="middle"
          fill={p.day === 'Today' ? '#3b82f6' : '#9ca3af'}
          fontWeight={p.day === 'Today' ? 'bold' : 'normal'}
        >
          {p.day}
        </text>
      ))}
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function supplyBadgeClass(status: string) {
  if (status === 'critical') return 'bg-red-100 text-red-700'
  if (status === 'low')      return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
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
  return 'bg-red-100 text-red-700'
}

// ─── Component ───────────────────────────────────────────────────────────────

const MED_STATUS_KEY = 'medtrack_med_statuses'

function loadStatuses(): Record<string, MedStatus> {
  try {
    return JSON.parse(localStorage.getItem(MED_STATUS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function applyStatuses(meds: Medication[]): Medication[] {
  const saved = loadStatuses()
  return meds.map(m => saved[m.id] ? { ...m, status: saved[m.id] } : m)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [meds, setMeds] = useState<Medication[]>(() => applyStatuses(initialMedications))
  const [now, setNow] = useState(new Date())

  // Refresh clock every minute so reminders stay current
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const takenCount   = meds.filter(m => m.status === 'taken').length
  const totalCount   = meds.length
  const adherencePct = Math.round((takenCount / totalCount) * 100)

  // Auto-derived from supply data — no hardcoding
  const criticalSupply = supplyData.filter(s => s.status === 'critical')
  const lowSupply      = supplyData.filter(s => s.status === 'low')
  const pendingMeds    = meds.filter(m => m.status === 'pending')

  const chartData = [...pastWeekAdherence, { day: 'Today', pct: adherencePct }]

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  function markStatus(id: string, status: MedStatus) {
    setMeds(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, status } : m)
      const saved = loadStatuses()
      saved[id] = status
      localStorage.setItem(MED_STATUS_KEY, JSON.stringify(saved))
      return updated
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* 1. WELCOME */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Good morning, John 👋</h2>
          <p className="text-base text-gray-500 mt-1">Saturday, April 25, 2025 · {timeStr}</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-semibold ${adherenceBadgeClass(adherencePct)}`}>
          <i className="fa-solid fa-heart-pulse" />
          Today's Adherence: {adherencePct}%
        </span>
      </div>

      {/* 2. AUTO ALERT BANNERS — driven by supply data */}
      {criticalSupply.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-red-700 text-base">Medicine Running Out!</p>
            {criticalSupply.map(s => (
              <p key={s.name} className="text-red-600 mt-1 text-sm">
                <strong>{s.name}</strong> — only <strong>{s.daysLeft} days</strong> left. Please refill soon.
              </p>
            ))}
          </div>
        </div>
      )}

      {lowSupply.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl p-4 flex items-start gap-3">
          <i className="fa-solid fa-bell text-orange-500 text-xl mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-orange-700 text-base">Low Supply Warning</p>
            {lowSupply.map(s => (
              <p key={s.name} className="text-orange-600 mt-1 text-sm">
                <strong>{s.name}</strong> — {s.daysLeft} days remaining.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Chart + Schedule */}
        <div className="lg:col-span-2 space-y-5">

          {/* Health Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-chart-line text-blue-600" />
              <h3 className="font-bold text-gray-800 text-lg">Weekly Health Trend</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Medicine adherence over the past 7 days</p>

            <HealthChart data={chartData} />

            <div className="flex items-center gap-5 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> 80%+ Great
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> 50–79% OK
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Below 50% Poor
              </span>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-5">Today's Medicine Schedule</h3>

            <div className="space-y-0">
              {meds.map((med, idx) => (
                <div key={med.id}>
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-20 shrink-0 text-center text-sm font-semibold bg-blue-50 text-blue-600 rounded-lg py-2">
                      {med.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-500">{med.dosage} · {med.frequency}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      {med.status === 'taken' && (
                        <div className="flex flex-col items-center gap-1">
                          <i className="fa-solid fa-circle-check text-green-500 text-2xl" />
                          <span className="text-sm text-green-600 font-medium">Taken</span>
                          <button
                            onClick={() => markStatus(med.id, 'pending')}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                          >
                            Undo
                          </button>
                        </div>
                      )}
                      {med.status === 'skipped' && (
                        <div className="flex flex-col items-center gap-1">
                          <i className="fa-solid fa-forward text-gray-400 text-2xl" />
                          <span className="text-sm text-gray-400">Skipped</span>
                          <button
                            onClick={() => markStatus(med.id, 'pending')}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                          >
                            Undo
                          </button>
                        </div>
                      )}
                      {med.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markStatus(med.id, 'taken')}
                            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Take
                          </button>
                          <button
                            onClick={() => markStatus(med.id, 'skipped')}
                            className="border border-gray-300 text-gray-500 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {idx < meds.length - 1 && <div className="border-t border-gray-100" />}
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                <span>Today's adherence</span>
                <span>{adherencePct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${adherenceBarClass(adherencePct)}`}
                  style={{ width: `${adherencePct}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — Reminders + Supply */}
        <div className="flex flex-col gap-5">

          {/* Daily Intake Reminders — auto from pending meds */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-bell text-blue-600" />
              <h3 className="font-bold text-gray-800 text-base">Today's Reminders</h3>
              {pendingMeds.length > 0 && (
                <span className="ml-auto w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingMeds.length}
                </span>
              )}
            </div>

            {pendingMeds.length === 0 ? (
              <div className="text-center py-4">
                <i className="fa-solid fa-circle-check text-green-500 text-3xl" />
                <p className="text-green-600 font-semibold mt-2">All done for today!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMeds.map(med => (
                  <div key={med.id} className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                    <i className="fa-solid fa-clock text-blue-500 text-lg shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{med.name} {med.dosage}</p>
                      <p className="text-sm text-blue-600">Due at {med.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medicine Supply */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-warehouse text-gray-700" />
              <h3 className="font-bold text-gray-800 text-base">Medicine Supply</h3>
            </div>

            <div className="space-y-4">
              {supplyData.map(item => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${supplyBadgeClass(item.status)}`}>
                      {item.daysLeft}d left
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${supplyBarClass(item.status)}`}
                      style={{ width: `${(item.pillsRemaining / item.totalPills) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/medications')}
              className="mt-5 w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Manage Medications
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
