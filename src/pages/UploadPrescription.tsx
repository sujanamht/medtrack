import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  durationDays: string
  notes: string
}

type Stage = 'idle' | 'preview' | 'saved'

export default function UploadPrescription() {
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [patientName, setPatientName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [dateIssued, setDateIssued] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: '', dosage: '', frequency: '', durationDays: '', notes: '' },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Gemini state ──────────────────────────────────────────────────────────
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiError, setGeminiError] = useState('')
  const [geminiDone, setGeminiDone] = useState(false)

  // ── Extraction via Flask backend ──────────────────────────────────────────
  async function handleGeminiExtract(fileOverride?: File) {
    const file = fileOverride ?? selectedFile
    if (!file) return
    setGeminiLoading(true)
    setGeminiError('')
    setGeminiDone(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Server error ${res.status}`)
      }
      const data = await res.json()

      if (data.patientName) setPatientName(data.patientName)
      if (data.doctorName) setDoctorName(data.doctorName)
      if (data.dateIssued) setDateIssued(data.dateIssued)
      if (data.medications?.length) {
        setMedications(data.medications.map((m: Omit<Medication, 'id'>, i: number) => ({ ...m, id: String(Date.now() + i) })))
      }
      setGeminiDone(true)
    } catch (err) {
      setGeminiError(err instanceof Error ? err.message : 'Extraction failed — please fill in manually.')
    } finally {
      setGeminiLoading(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function handleFile(file: File) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrors({ file: 'Only images or PDF files are allowed' })
      return
    }
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl('')
    }
    setErrors({})
    setStage('preview')
    handleGeminiExtract(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  function addMedication() {
    setMedications((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', dosage: '', frequency: '', durationDays: '', notes: '' },
    ])
  }

  function removeMedication(id: string) {
    if (medications.length > 1) {
      setMedications((prev) => prev.filter((m) => m.id !== id))
    }
  }

  function updateMedication(id: string, field: keyof Medication, value: string) {
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  function handleSave() {
    const newErrors: Record<string, string> = {}
    if (!patientName.trim()) newErrors.patientName = 'Patient name is required'
    if (!medications[0].name.trim()) newErrors.medName = 'At least one medication name is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setStage('saved')
  }

  function resetAll() {
    setStage('idle')
    setDragOver(false)
    setSelectedFile(null)
    setPreviewUrl('')
    setRawText('')
    setPatientName('')
    setDoctorName('')
    setDateIssued('')
    setErrors({})
    setMedications([{ id: '1', name: '', dosage: '', frequency: '', durationDays: '', notes: '' }])
    setGeminiLoading(false)
    setGeminiError('')
    setGeminiDone(false)
  }

  // ── Input class helper ────────────────────────────────────────────────────

  const inputCls =
    'w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'

  // ── Stage: idle ───────────────────────────────────────────────────────────

  if (stage === 'idle') {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <i className="fa-solid fa-file-medical text-blue-600 text-2xl mr-3" />
            Upload Prescription
          </h2>
          <p className="text-sm text-gray-500 mt-1">Upload a photo or PDF — or enter details manually</p>
        </div>

        {/* Upload zone */}
        <div
          className={`mt-6 border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-gray-100'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              dragOver ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <i className={`fa-solid fa-cloud-arrow-up text-4xl ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>

          <p className="text-lg font-medium text-gray-700">Drag &amp; drop your prescription here</p>
          <p className="text-sm text-gray-400 my-3">or</p>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-2.5 text-sm font-medium transition-colors"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
          >
            Browse Files
          </button>

          <p className="text-xs text-gray-400 mt-4">Supports JPG, PNG, PDF up to 10MB</p>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
          />
        </div>

        {/* File error */}
        {errors.file && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-red-500" />
            <span className="text-red-600 text-sm">{errors.file}</span>
          </div>
        )}

        {/* OR divider */}
        <div className="my-6 flex items-center gap-4">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400 whitespace-nowrap">or enter manually</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Manual entry button */}
        <button
          className="w-full border-2 border-gray-200 text-gray-600 rounded-xl py-3.5 text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
          onClick={() => setStage('preview')}
        >
          <i className="fa-solid fa-keyboard mr-2" />
          Enter Prescription Manually
        </button>

        {/* Tips card */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-700">
            <i className="fa-solid fa-lightbulb text-blue-500 mr-2" />
            Tips for best results
          </p>
          <ul className="mt-2 space-y-1">
            {[
              'Ensure the prescription text is clearly visible',
              'Good lighting helps with image quality',
              'Make sure all medication names are readable',
              'PDF uploads give the best extraction results',
            ].map((tip) => (
              <li key={tip} className="text-xs text-blue-600">
                <i className="fa-solid fa-check text-blue-400 mr-2" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // ── Stage: preview ────────────────────────────────────────────────────────

  if (stage === 'preview') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <button
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            onClick={() => { setStage('idle'); setSelectedFile(null); setPreviewUrl(''); setErrors({}) }}
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            Back
          </button>

          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <span className="text-xs text-blue-600 mt-1">Upload</span>
            </div>
            <div className="w-8 h-px bg-blue-300 mb-4" />
            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <span className="text-xs text-blue-600 mt-1">Review</span>
            </div>
            <div className="w-8 h-px bg-gray-300 mb-4" />
            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <span className="text-xs text-gray-400 mt-1">Save</span>
            </div>
          </div>
        </div>

        {/* Card 1: File preview */}
        {selectedFile && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            {selectedFile.type.startsWith('image/') && previewUrl ? (
              <img
                src={previewUrl}
                alt="prescription preview"
                className="w-24 h-24 object-cover rounded-xl border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-red-50 rounded-xl border border-red-200 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-file-pdf text-red-500 text-4xl" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedFile.size < 1024 * 1024
                  ? `${Math.round(selectedFile.size / 1024)} KB`
                  : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
              </p>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${
                  selectedFile.type.startsWith('image/')
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
              >
                {selectedFile.type.startsWith('image/') ? 'Image' : 'PDF'}
              </span>
            </div>

            <button
              className="ml-auto flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center"
              onClick={() => { setSelectedFile(null); setPreviewUrl(''); setStage('idle') }}
            >
              <i className="fa-solid fa-xmark text-gray-400 hover:text-red-500" />
            </button>
          </div>
        )}

        {/* Card 2: Prescription notes */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-semibold text-gray-800">
            <i className="fa-solid fa-note-sticky text-blue-600 mr-2" />
            Prescription Notes
            <span className="text-xs text-gray-400 ml-1">(optional)</span>
          </p>
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste raw prescription text here if you have it, e.g.:\nPatient: John Mathews\nRx: Metformin 500mg twice daily × 30 days\nDr. Sarah Johnson | April 25, 2025`}
            className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition-all"
          />
          {selectedFile && (
            <div className="mt-3">
              {geminiLoading && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
                  <i className="fa-solid fa-spinner animate-spin text-purple-500" />
                  <span className="text-xs text-purple-700 font-medium">Extracting with Gemini...</span>
                </div>
              )}
              {geminiDone && !geminiLoading && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-green-500" />
                  <span className="text-xs text-green-700 font-medium">Fields filled by Gemini — review and edit below</span>
                  <button onClick={() => handleGeminiExtract()} className="ml-auto text-xs text-green-600 underline hover:no-underline">Re-extract</button>
                </div>
              )}
              {geminiError && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation text-red-500" />
                  <span className="text-xs text-red-600">{geminiError}</span>
                </div>
              )}
            </div>
          )}
          {!selectedFile && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3 flex gap-2 items-center">
              <i className="fa-solid fa-wand-magic-sparkles text-purple-500" />
              <span className="text-xs text-purple-700">Upload a file above to enable Gemini AI auto-extraction</span>
            </div>
          )}
        </div>

        {/* Card 3: Extraction results */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-wand-magic-sparkles text-purple-500 mr-2" />
            Extracted Information
          </p>

          {geminiLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
              <i className="fa-solid fa-spinner animate-spin text-3xl text-purple-400" />
              <span className="text-sm font-medium">Analyzing prescription...</span>
            </div>
          )}

          {geminiError && !geminiLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-red-500" />
              <span className="text-xs text-red-600">{geminiError}</span>
            </div>
          )}

          {!geminiLoading && !geminiError && (
            <>
              {/* Patient / Doctor / Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Patient</p>
                  <p className="text-sm font-medium text-gray-800">{patientName || <span className="text-gray-400 italic">Not detected</span>}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Doctor</p>
                  <p className="text-sm font-medium text-gray-800">{doctorName || <span className="text-gray-400 italic">Not detected</span>}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Date Issued</p>
                  <p className="text-sm font-medium text-gray-800">{dateIssued || <span className="text-gray-400 italic">Not detected</span>}</p>
                </div>
              </div>

              {/* Medications */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                <i className="fa-solid fa-pills text-blue-400 mr-1.5" />
                Medications
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full ml-2 normal-case tracking-normal">
                  {medications.filter(m => m.name.trim()).length} found
                </span>
              </p>
              <div className="space-y-2">
                {medications.filter(m => m.name.trim()).map((med) => {
                  const parts = [med.dosage, med.frequency, med.durationDays ? `${med.durationDays} days` : ''].filter(Boolean)
                  return (
                    <div key={med.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex gap-3">
                      <i className="fa-solid fa-capsules text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{med.name}</p>
                        {parts.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">{parts.join(' · ')}</p>
                        )}
                        {med.notes && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">{med.notes}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {medications.filter(m => m.name.trim()).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No medications detected</p>
                )}
              </div>

              {errors.patientName && (
                <p className="text-red-500 text-xs mt-4">{errors.patientName}</p>
              )}
              {errors.medName && (
                <p className="text-red-500 text-xs mt-1">{errors.medName}</p>
              )}
            </>
          )}
        </div>

        {/* Confirm & Save button */}
        <button
          disabled={geminiLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-medium transition-colors text-sm"
          onClick={handleSave}
        >
          <i className="fa-solid fa-circle-check mr-2" />
          Confirm &amp; Save
        </button>
      </div>
    )
  }

  // ── Stage: saved ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success hero */}
      <div className="text-center py-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <i className="fa-solid fa-circle-check text-green-500 text-5xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mt-5">Prescription Saved!</h2>
        <p className="text-gray-500 mt-2">Your prescription has been recorded successfully.</p>
      </div>

      {/* Summary card */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <p className="font-semibold text-gray-800">
          <i className="fa-solid fa-clipboard-list text-blue-600 mr-2" />
          Summary
        </p>

        <div className="mt-4 space-y-3">
          {/* Patient */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-user text-blue-500 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Patient</p>
              <p className="font-medium text-gray-800">{patientName}</p>
            </div>
          </div>

          {/* Doctor */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-user-doctor text-blue-500 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Doctor</p>
              <p className="font-medium text-gray-800">{doctorName || 'Not specified'}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-calendar text-blue-500 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium text-gray-800">{dateIssued || 'Not specified'}</p>
            </div>
          </div>

          {/* Medication count */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-pills text-blue-500 text-sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Medications</p>
              <p className="font-medium text-gray-800">
                {medications.filter((m) => m.name.trim()).length} medication(s)
              </p>
            </div>
          </div>
        </div>

        <hr className="my-4 border-t border-gray-100" />

        {/* Medication list */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Prescribed Medications
        </p>
        <div className="space-y-2">
          {medications
            .filter((m) => m.name.trim())
            .map((m) => {
              const parts = [m.dosage, m.frequency, m.durationDays ? `${m.durationDays} days` : ''].filter(Boolean)
              return (
                <div key={m.id} className="flex items-start gap-3">
                  <i className="fa-solid fa-capsules text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{m.name}</p>
                    {parts.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{parts.join(' · ')}</p>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Next steps card */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-700 mb-3">What's next?</p>
        <div className="space-y-2">
          <p className="text-xs text-blue-600">
            <i className="fa-solid fa-bell text-blue-500 mr-2" />
            Refill reminders will be set automatically
          </p>
          <p className="text-xs text-blue-600">
            <i className="fa-solid fa-bowl-food text-blue-500 mr-2" />
            Diet recommendations are being prepared
          </p>
          <p className="text-xs text-blue-600">
            <i className="fa-solid fa-pills text-blue-500 mr-2" />
            Track your daily doses in My Medications
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 rounded-xl px-6 py-3 text-sm font-medium hover:bg-blue-50 transition-all"
          onClick={resetAll}
        >
          <i className="fa-solid fa-plus mr-2" />
          Upload Another Prescription
        </button>
        <button
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-sm font-medium transition-colors"
          onClick={() => navigate('/medications')}
        >
          <i className="fa-solid fa-pills mr-2" />
          View My Medications
        </button>
      </div>
    </div>
  )
}
