import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type DoctorColor = 'blue' | 'purple'

type Doctor = {
  id: string
  name: string
  specialty: string
  hospital: string
  phone: string
  initials: string
  color: DoctorColor
}

// ─── Color Maps ───────────────────────────────────────────────────────────────

const avatarClass: Record<DoctorColor, string> = {
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

const COLORS: DoctorColor[] = ['blue', 'purple']

// ─── Component ───────────────────────────────────────────────────────────────

export default function Contact() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5001/api/prescriptions')
      .then(r => r.json())
      .then((prescriptions: any[]) => {
        const seen = new Map<string, Doctor>()
        let colorIdx = 0

        for (const p of prescriptions) {
          const name: string = (p.doctorName ?? '').trim()
          if (!name) continue
          const key = name.toLowerCase()
          if (seen.has(key)) continue

          const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .map((w: string) => w[0].toUpperCase())
            .slice(0, 2)
            .join('')

          seen.set(key, {
            id: key.replace(/\s+/g, '-'),
            name,
            specialty: (p.doctorSpecialty ?? '').trim(),
            hospital:  (p.doctorHospital  ?? '').trim(),
            phone:     (p.doctorPhone     ?? '').trim(),
            initials,
            color: COLORS[colorIdx % COLORS.length],
          })
          colorIdx++
        }

        setDoctors([...seen.values()])
      })
      .catch(() => {})
      .finally(() => setLoadingDoctors(false))
  }, [])

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
      {loadingDoctors ? (
        <p className="text-sm text-gray-400">Loading doctors…</p>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400">
          <i className="fa-solid fa-user-doctor text-3xl mb-2" />
          <p className="text-sm">No doctors found. Upload a prescription to add your doctor's info.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-sm p-5">

              {/* Top row */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${avatarClass[doctor.color]}`}
                >
                  {doctor.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{doctor.name}</p>
                  {doctor.specialty && (
                    <p className="text-sm text-blue-600">{doctor.specialty}</p>
                  )}
                  {doctor.hospital && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      <i className="fa-solid fa-hospital mr-1" />
                      {doctor.hospital}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone number */}
              {doctor.phone && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <i className="fa-solid fa-phone w-4 text-gray-400 mr-2" />
                    {doctor.phone}
                  </p>
                </div>
              )}

              {/* Call button */}
              <div className="mt-4">
                {doctor.phone ? (
                  <a
                    href={`tel:${doctor.phone}`}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm transition-colors inline-flex items-center"
                  >
                    <i className="fa-solid fa-phone mr-2" />
                    Call Now
                  </a>
                ) : (
                  <button
                    disabled
                    className="bg-gray-200 text-gray-400 rounded-lg px-4 py-2 text-sm cursor-not-allowed"
                  >
                    <i className="fa-solid fa-phone mr-2" />
                    No number on file
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    {/* 3. EMERGENCY BANNER */}
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
