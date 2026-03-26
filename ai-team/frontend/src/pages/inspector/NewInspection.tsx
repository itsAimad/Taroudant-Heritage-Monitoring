import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inspectionService } from '../../services/inspectionService'
import { apiFetch } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, AlertTriangle, Upload, X } from 'lucide-react'

// ── Types ────────────────────────────────────────
interface Monument { id: number; name: string; location: string }
interface CrackEntry {
  crack_id: number
  location_on_monument: string
  severity: string
  length_cm: number | null
  photo?: File
  photo_id?: number
  score?: any
}

// ── Step Indicator ───────────────────────────────
const STEPS = [
  { n: 1, label: 'Field Inspection' },
  { n: 2, label: 'Log Cracks' },
  { n: 3, label: 'Submit' },
  { n: 4, label: 'Generate Report' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done   = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading text-base transition-all duration-300 ${
                done   ? 'bg-emerald-700 text-white'  :
                active ? 'bg-[#c9844a] text-[#1a1612]' :
                         'bg-sand/10 text-sand/30'
              }`}>
                {done ? <Check className="w-4 h-4" /> : <span>{s.n}</span>}
              </div>
              <div className={`text-[10px] mt-1.5 font-medium tracking-wide text-center w-20 ${
                active ? 'text-[#c9844a]' : done ? 'text-emerald-400' : 'text-sand/25'
              }`}>{s.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-px mx-1 mb-4 transition-all duration-300 ${
                done ? 'bg-emerald-700' : 'bg-sand/10'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Condition Button ─────────────────────────────
const conditionConfig: Record<string, { label: string; color: string; ring: string }> = {
  good:     { label: 'Good',     color: 'border-emerald-500  text-emerald-400',  ring: 'bg-emerald-500/20' },
  fair:     { label: 'Fair',     color: 'border-yellow-500   text-yellow-400',   ring: 'bg-yellow-500/20' },
  poor:     { label: 'Poor',     color: 'border-amber-500    text-amber-400',    ring: 'bg-amber-500/20' },
  critical: { label: 'Critical', color: 'border-red-500      text-red-400',      ring: 'bg-red-500/20' },
}

// ── Severity Button ──────────────────────────────
const severityConfig: Record<string, { label: string; weight: number; color: string; bg: string }> = {
  minor:    { label: 'Minor',    weight: 1,  color: 'text-emerald-400 border-emerald-500', bg: 'bg-emerald-500/20' },
  moderate: { label: 'Moderate', weight: 3,  color: 'text-yellow-400  border-yellow-500',  bg: 'bg-yellow-500/20'  },
  major:    { label: 'Major',    weight: 7,  color: 'text-amber-400   border-amber-500',   bg: 'bg-amber-500/20'   },
  critical: { label: 'Critical', weight: 15, color: 'text-red-400     border-red-500',     bg: 'bg-red-500/20'     },
}

// ── Score Card ───────────────────────────────────
function ScoreCard({ score }: { score: any }) {
  if (!score) return null
  const risk      = score.risk_level || 'none'
  const total     = score.total_score || 0
  const ageScore  = score.age_score   || 0
  const crackScore = score.crack_score || 0
  const isHighRisk = risk === 'high' || risk === 'critical'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-sand/10 bg-charcoal/70 p-4 mt-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#c9844a] mb-3 font-medium">
        Vulnerability Score Updated
      </div>
      <div className="flex items-end justify-between mb-4">
        <div className="font-heading text-5xl text-sand-light">
          {total}<span className="text-xl text-sand/40">/100</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
          risk === 'critical' ? 'bg-red-900/50 text-red-300    border border-red-800/50' :
          risk === 'high'     ? 'bg-amber-900/50 text-amber-300 border border-amber-800/50' :
          risk === 'medium'   ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800/50' :
                                'bg-emerald-900/50 text-emerald-300 border border-emerald-800/50'
        }`}>{risk.toUpperCase()}</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-sand/40 mb-1">
            <span>Age Factor</span><span>{ageScore}/100</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-[#c9844a] rounded-full transition-all duration-700"
              style={{ width: `${ageScore}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-sand/40 mb-1">
            <span>Crack Severity</span><span>{crackScore}/100</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{ width: `${crackScore}%` }} />
          </div>
        </div>
      </div>
      {isHighRisk && (
        <div className="mt-4 flex items-start gap-2 rounded border border-red-800/60 bg-red-950/40 p-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300 leading-relaxed">
            This monument has reached <span className="font-bold">{risk.toUpperCase()}</span> risk.
            Authorities will be notified upon inspection submission.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────
export default function NewInspection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)

  // Step 1 state
  const [monuments, setMonuments]   = useState<Monument[]>([])
  const [monumentId, setMonumentId] = useState('')
  const [monumentName, setMonumentName] = useState('')
  const [inspDate, setInspDate]     = useState(new Date().toISOString().split('T')[0])
  const [condition, setCondition]   = useState('fair')
  const [notes, setNotes]           = useState('')
  const [inspectionId, setInspectionId] = useState<number | null>(null)
  const [loading1, setLoading1]     = useState(false)

  // Step 2 state
  const [crackLocation, setCrackLocation] = useState('')
  const [crackSeverity, setCrackSeverity] = useState('moderate')
  const [crackLength, setCrackLength]     = useState('')
  const [photoFile, setPhotoFile]         = useState<File | null>(null)
  const [cracks, setCracks]               = useState<CrackEntry[]>([])
  const [latestScore, setLatestScore]     = useState<any>(null)
  const [loading2, setLoading2]           = useState(false)

  // Step 3 state
  const [loading3, setLoading3] = useState(false)
  const [notified, setNotified] = useState(0)

  // Step 4 state
  const [reportTitle, setReportTitle] = useState('')
  const [reportResult, setReportResult] = useState<any>(null)
  const [loading4, setLoading4] = useState(false)

  useEffect(() => {
    apiFetch('/api/monuments/')
      .then(r => r.json())
      .then(d => setMonuments(d.results || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (inspectionId && monumentName) {
      setReportTitle(`Inspection Report — ${monumentName} — ${inspDate}`)
    }
  }, [inspectionId, monumentName, inspDate])

  // ── Step 1: Create Inspection ─────────────────
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monumentId) return alert('Please select a monument')
    setLoading1(true)
    try {
      const res = await inspectionService.create({
        monument_id: parseInt(monumentId),
        inspection_date: inspDate,
        notes,
        overall_condition: condition,
      })
      setInspectionId(res.inspection_id || res.id)
      setStep(2)
    } catch (err: any) {
      alert(err.message || 'Failed to start inspection')
    } finally {
      setLoading1(false)
    }
  }

  // ── Step 2: Log Crack ─────────────────────────
  const handleLogCrack = async () => {
    if (!crackLocation) return alert('Please enter crack location')
    if (!inspectionId) return
    setLoading2(true)
    try {
      const res = await inspectionService.logCrack({
        inspection_id: inspectionId,
        location_on_monument: crackLocation,
        severity: crackSeverity,
        length_cm: crackLength ? parseFloat(crackLength) : undefined,
      })
      const entry: CrackEntry = {
        crack_id: res.crack_id,
        location_on_monument: crackLocation,
        severity: crackSeverity,
        length_cm: crackLength ? parseFloat(crackLength) : null,
        photo: photoFile || undefined,
        score: res.score,
      }
      // Upload photo if selected
      if (photoFile) {
        try {
          const photoRes = await inspectionService.uploadCrackPhoto(res.crack_id, photoFile)
          entry.photo_id = photoRes.photo_id
        } catch (photoErr) {
          console.warn('Photo upload failed', photoErr)
        }
      }
      setCracks(prev => [...prev, entry])
      if (res.score) setLatestScore(res.score)
      // Reset crack form
      setCrackLocation('')
      setCrackSeverity('moderate')
      setCrackLength('')
      setPhotoFile(null)
    } catch (err: any) {
      alert(err.message || 'Failed to log crack')
    } finally {
      setLoading2(false)
    }
  }

  // ── Step 3: Submit ────────────────────────────
  const handleSubmit = async () => {
    if (!inspectionId) return
    setLoading3(true)
    try {
      const res = await inspectionService.submit(inspectionId)
      setNotified(res.notified || 0)
      setStep(4)
    } catch (err: any) {
      alert(err.message || 'Failed to submit inspection')
    } finally {
      setLoading3(false)
    }
  }

  // ── Step 4: Generate Report ───────────────────
  const handleGenerateReport = async () => {
    if (!inspectionId || !monumentId) return
    setLoading4(true)
    try {
      const res = await inspectionService.generateReport({
        monument_id: parseInt(monumentId),
        inspection_id: inspectionId,
        title: reportTitle,
      })
      setReportResult(res.report)
    } catch (err: any) {
      alert(err.message || 'Failed to generate report')
    } finally {
      setLoading4(false)
    }
  }

  const cracksBySeverity = (sev: string) => cracks.filter(c => c.severity === sev).length

  const riskLevel = latestScore?.risk_level || 'none'
  const isHighRisk = riskLevel === 'high' || riskLevel === 'critical'

  return (
    <div className="min-h-screen bg-[#0f0d0b] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-8">
          <div className="text-sm uppercase tracking-[0.22em] text-[#c9844a] mb-2 font-medium">
            Inspector Field Workflow
          </div>
          <h1 className="font-heading text-3xl text-sand-light">New Inspection</h1>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">

          {/* ═══ STEP 1 ═══ */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <form onSubmit={handleStep1}
                className="rounded-lg border border-sand/10 bg-charcoal/70 p-6 space-y-6">

                <div className="text-[10px] uppercase tracking-[0.22em] text-[#c9844a] font-medium">
                  Step 1 · Field Inspection
                </div>

                {/* Monument */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Monument</label>
                  <select required value={monumentId}
                    onChange={e => {
                      setMonumentId(e.target.value)
                      const m = monuments.find(m => String(m.id) === e.target.value)
                      if (m) setMonumentName(`${m.name} — ${m.location}`)
                    }}
                    className="w-full border border-sand/15 bg-black/20 rounded px-2.5 py-2 text-[13px] text-sand/70 outline-none focus:border-[#c9844a]/50 transition-colors"
                  >
                    <option value="">— Select monument —</option>
                    {monuments.map(m => (
                      <option key={m.id} value={m.id}>{m.name} — {m.location}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Inspection Date</label>
                  <input type="date" required value={inspDate}
                    onChange={e => setInspDate(e.target.value)}
                    className="w-full border border-sand/15 bg-black/20 rounded px-2.5 py-2 text-[13px] text-sand/70 outline-none focus:border-[#c9844a]/50 transition-colors"
                  />
                </div>

                {/* Condition buttons */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Overall Condition</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(conditionConfig).map(([val, cfg]) => (
                      <button key={val} type="button"
                        onClick={() => setCondition(val)}
                        className={`border rounded py-2.5 text-[12px] font-medium transition-all ${
                          condition === val
                            ? `${cfg.color} ${cfg.ring} shadow-sm`
                            : 'border-sand/15 text-sand/30 hover:border-sand/30 hover:text-sand/50'
                        }`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Field Notes</label>
                  <textarea rows={4} value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Describe general observations, visible deterioration, environmental conditions..."
                    className="w-full border border-sand/15 bg-black/20 rounded px-2.5 py-2 text-[13px] text-sand/70 placeholder:text-sand/25 outline-none focus:border-[#c9844a]/50 transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button type="submit" disabled={loading1}
                  className="w-full py-3 rounded bg-[#c9844a] text-[#1a1612] font-semibold text-sm tracking-wider hover:bg-[#d9906a] disabled:opacity-50 transition-colors">
                  {loading1 ? 'Starting...' : 'Start Inspection →'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ═══ STEP 2 ═══ */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#c9844a] font-medium mb-4">
                Step 2 · Log Structural Cracks
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Crack entry form */}
                <div className="rounded-lg border border-sand/10 bg-charcoal/70 p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Location on Monument</label>
                    <input value={crackLocation} onChange={e => setCrackLocation(e.target.value)}
                      placeholder="Vertical · Step Cracking · North face, 2m from ground"
                      className="w-full border border-sand/15 bg-black/20 rounded px-2.5 py-2 text-[13px] text-sand/70 placeholder:text-sand/25 outline-none focus:border-[#c9844a]/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Severity</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(severityConfig).map(([val, cfg]) => (
                        <button key={val} type="button"
                          onClick={() => setCrackSeverity(val)}
                          className={`border rounded py-2 text-[11px] font-medium flex items-center justify-between px-2.5 transition-all ${
                            crackSeverity === val
                              ? `${cfg.color} ${cfg.bg}`
                              : 'border-sand/15 text-sand/30 hover:border-sand/30'
                          }`}>
                          <span>{cfg.label}</span>
                          <span className={`text-[10px] font-mono ${crackSeverity === val ? cfg.color.split(' ')[0] : 'text-sand/20'}`}>
                            ×{cfg.weight}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Length (optional)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={crackLength}
                        onChange={e => setCrackLength(e.target.value)}
                        placeholder="0"
                        className="flex-1 border border-sand/15 bg-black/20 rounded px-2.5 py-2 text-[13px] text-sand/70 placeholder:text-sand/25 outline-none focus:border-[#c9844a]/50 transition-colors"
                      />
                      <span className="text-[12px] text-sand/40 font-mono">cm</span>
                    </div>
                  </div>

                  {/* Photo drop zone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Photo (optional)</label>
                    {photoFile ? (
                      <div className="h-20 border border-sand/20 bg-black/20 rounded flex items-center justify-between px-3">
                        <div>
                          <p className="text-[12px] text-[#c9844a] font-medium">{photoFile.name}</p>
                          <p className="text-[10px] text-sand/40">{(photoFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setPhotoFile(null)}
                          className="text-sand/30 hover:text-sand/60">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-20 border border-dashed border-sand/20 bg-black/20 rounded flex flex-col items-center justify-center cursor-pointer hover:border-sand/40 hover:bg-black/30 transition-colors">
                        <Upload className="w-4 h-4 text-sand/30 mb-1" />
                        <span className="text-[10px] text-sand/35 text-center leading-tight">
                          Tap to attach elevation photo<br />JPEG / PNG / HEIC · Max 10MB
                        </span>
                        <input type="file" className="hidden" accept="image/*"
                          onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>

                  <button onClick={handleLogCrack} disabled={loading2}
                    className="w-full py-2.5 rounded border border-[#c9844a]/50 text-[#c9844a] text-[13px] font-medium hover:bg-[#c9844a]/10 disabled:opacity-50 transition-colors">
                    {loading2 ? 'Logging...' : '+ Log Crack'}
                  </button>
                </div>

                {/* Cracks logged + score */}
                <div className="space-y-4">
                  {/* Cracks table */}
                  <div className="rounded-lg border border-sand/10 bg-charcoal/70 overflow-hidden">
                    <div className="px-4 py-3 border-b border-sand/10">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-medium">
                        Cracks Logged ({cracks.length})
                      </div>
                    </div>
                    {cracks.length === 0 ? (
                      <div className="py-8 text-center text-[12px] text-sand/25">
                        No cracks logged yet
                      </div>
                    ) : (
                      <div className="divide-y divide-sand/5 max-h-52 overflow-auto">
                        {cracks.map((c, i) => (
                          <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-sand/70 truncate">{c.location_on_monument}</p>
                              {c.length_cm && (
                                <p className="text-[10px] text-sand/35">{c.length_cm} cm</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${severityConfig[c.severity]?.color || 'text-sand/40 border-sand/15'}`}>
                                {c.severity}
                              </span>
                              {c.photo_id ? (
                                <span className="text-[10px] text-emerald-400">📷</span>
                              ) : (
                                <span className="text-[10px] text-sand/25">—</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score card */}
                  <ScoreCard score={latestScore} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded border border-sand/15 text-sand/50 text-[13px] hover:border-sand/30 hover:text-sand/70 transition-colors">
                  ← Back
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 py-2.5 rounded bg-[#c9844a] text-[#1a1612] font-semibold text-sm hover:bg-[#d9906a] transition-colors">
                  Review & Submit →
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3 ═══ */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#c9844a] font-medium mb-4">
                Step 3 · Review &amp; Submit
              </div>

              <div className="space-y-4">
                {/* Inspection summary */}
                <div className="rounded-lg border border-sand/10 bg-charcoal/70 p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono mb-3">Inspection Summary</div>
                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <div className="text-[10px] text-sand/35 uppercase tracking-wider mb-0.5">Monument</div>
                      <div className="text-sand/80 font-medium">{monumentName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-sand/35 uppercase tracking-wider mb-0.5">Date</div>
                      <div className="text-sand/80">{inspDate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-sand/35 uppercase tracking-wider mb-0.5">Inspector</div>
                      <div className="text-sand/80">{user?.full_name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-sand/35 uppercase tracking-wider mb-0.5">Condition</div>
                      <span className={`text-[12px] px-2 py-0.5 rounded border font-medium capitalize ${conditionConfig[condition]?.color || ''}`}>
                        {condition}
                      </span>
                    </div>
                  </div>
                  {notes && (
                    <div className="mt-4 border-t border-sand/10 pt-3">
                      <div className="text-[10px] text-sand/35 uppercase tracking-wider mb-1">Notes</div>
                      <p className="text-[13px] text-sand/60 leading-relaxed">{notes}</p>
                    </div>
                  )}
                </div>

                {/* Cracks summary */}
                <div className="rounded-lg border border-sand/10 bg-charcoal/70 p-5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono mb-3">
                    Crack Analysis ({cracks.length} total)
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {['minor','moderate','major','critical'].map(s => (
                      <div key={s} className="text-center">
                        <div className={`text-2xl font-heading ${severityConfig[s].color.split(' ')[0]}`}>
                          {cracksBySeverity(s)}
                        </div>
                        <div className="text-[10px] text-sand/35 capitalize mt-0.5">{s}</div>
                      </div>
                    ))}
                  </div>
                  <ScoreCard score={latestScore} />
                </div>

                {/* Risk warning */}
                {isHighRisk && (
                  <div className="rounded border border-red-800/60 bg-red-950/40 p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[12px] font-bold text-red-300 uppercase tracking-wider mb-1">
                          {riskLevel === 'critical' ? 'CRITICAL RISK' : 'HIGH RISK'}
                        </div>
                        <p className="text-[12px] text-red-300/80 leading-relaxed">
                          {riskLevel === 'critical'
                            ? 'Submitting will trigger immediate authority notifications.'
                            : 'Authorities will be notified upon submission.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded border border-sand/15 text-sand/50 text-[13px] hover:border-sand/30 hover:text-sand/70 transition-colors">
                    ← Edit Inspection
                  </button>
                  <button onClick={handleSubmit} disabled={loading3}
                    className={`flex-1 py-2.5 rounded font-semibold text-sm transition-colors disabled:opacity-50 ${
                      isHighRisk
                        ? 'bg-red-700 hover:bg-red-600 text-white'
                        : 'bg-[#c9844a] hover:bg-[#d9906a] text-[#1a1612]'
                    }`}>
                    {loading3 ? 'Submitting...' : 'Submit Inspection →'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4 ═══ */}
          {step === 4 && (
            <motion.div key="step4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#c9844a] font-medium mb-4">
                Step 4 · Generate Report
              </div>

              {/* Submission confirmation */}
              <div className="rounded border border-emerald-800/40 bg-emerald-950/30 p-4 mb-5 flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-[12px] text-emerald-300">
                  Inspection submitted. <span className="font-semibold">{notified}</span> authorit{notified === 1 ? 'y' : 'ies'} notified.
                </p>
              </div>

              {reportResult ? (
                /* Success state */
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-emerald-800/40 bg-emerald-950/40 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h2 className="font-heading text-2xl text-sand-light mb-1">Report Generated &amp; Encrypted</h2>
                  <p className="text-[13px] text-sand/50 mb-6">
                    Report #{`RPT-${reportResult.report_id}`} · Stored with AES-256 encryption · Audit trail created
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate('/dashboard')}
                      className="px-5 py-2.5 rounded border border-sand/20 text-[13px] text-sand/60 hover:border-sand/40 hover:text-sand/80 transition-colors">
                      ← My Reports
                    </button>
                    <button onClick={() => window.location.reload()}
                      className="px-5 py-2.5 rounded bg-[#c9844a] text-[#1a1612] text-[13px] font-semibold hover:bg-[#d9906a] transition-colors">
                      New Inspection
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Report form */
                <div className="space-y-4">
                  {/* Encrypted report preview card */}
                  <div className="rounded-lg border border-sand/12 bg-charcoal/75 p-4 text-left text-[11px] text-sand/70">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c9844a]/10">
                          <Lock className="h-3.5 w-3.5 text-[#c9844a]" />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-sand-light">AES-256 Encrypted Report</div>
                          <div className="text-[10px] text-sand/40">Role-restricted access · Full audit trail</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-800/40">
                        ENCRYPTED
                      </span>
                    </div>
                    <div className="grid gap-2 grid-cols-3 text-[10px]">
                      <div>
                        <div className="text-sand/35 uppercase tracking-wider mb-0.5">Role Access</div>
                        <div className="text-sand/60">Inspectors · Authorities · Admin</div>
                      </div>
                      <div>
                        <div className="text-sand/35 uppercase tracking-wider mb-0.5">Monument</div>
                        <div className="text-sand/60 truncate">{monumentName || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sand/35 uppercase tracking-wider mb-0.5">Audit Trail</div>
                        <div className="text-sand/60">Immutable log created</div>
                      </div>
                    </div>
                  </div>

                  {/* Title input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-[0.18em] text-sand/40 font-mono">Report Title</label>
                    <input required value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      className="w-full border border-sand/15 bg-black/20 rounded px-2.5 py-2 text-[13px] text-sand/70 outline-none focus:border-[#c9844a]/50 transition-colors"
                    />
                  </div>

                  <button onClick={handleGenerateReport} disabled={loading4 || !reportTitle}
                    className="w-full py-3 rounded bg-[#c9844a] text-[#1a1612] font-semibold text-sm tracking-wider hover:bg-[#d9906a] disabled:opacity-50 transition-colors">
                    {loading4 ? 'Generating report...' : '🔒 Generate Encrypted Report'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
