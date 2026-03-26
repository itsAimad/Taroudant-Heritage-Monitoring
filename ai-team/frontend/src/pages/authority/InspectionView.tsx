import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionService } from '../../services/inspectionService'
import PageTransition from '../../components/ui/PageTransition'
import { motion } from 'framer-motion'
import { MapPin, Calendar, User, Check, AlertTriangle, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ── Helpers ──────────────────────────────────────
const statusOrder = ['draft','in_progress','submitted','acknowledged','completed']

const riskColors: Record<string, string> = {
  critical: 'text-red-400 border-red-500    bg-red-900/20',
  high:     'text-amber-400 border-amber-500 bg-amber-900/20',
  medium:   'text-yellow-400 border-yellow-500 bg-yellow-900/20',
  low:      'text-emerald-400 border-emerald-500 bg-emerald-900/20',
}
const severityColors: Record<string, string> = {
  minor:    'text-emerald-400 border-emerald-500',
  moderate: 'text-yellow-400  border-yellow-500',
  major:    'text-amber-400   border-amber-500',
  critical: 'text-red-400     border-red-500',
}

function ScoreBreakdown({ score }: { score: any }) {
  if (!score) return null
  return (
    <div className="rounded-lg border border-sand/10 bg-black/20 p-4 mt-2">
      <div className="flex items-end justify-between mb-4">
        <div className="font-heading text-4xl text-sand-light">
          {score.total_score}<span className="text-base text-sand/40">/100</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
          riskColors[score.risk_level] || 'text-sand/40'
        }`}>{(score.risk_level || 'N/A').toUpperCase()}</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] text-sand/40 mb-1">
            <span>Age Factor</span><span>{score.age_score}/100</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-[#c9844a] rounded-full" style={{ width: `${score.age_score}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-sand/40 mb-1">
            <span>Crack Severity</span><span>{score.crack_score}/100</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${score.crack_score}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Validate Modal ───────────────────────────────
function ValidateModal({
  mode,
  onConfirm,
  onClose,
}: {
  mode: 'validate' | 'dispute'
  onConfirm: (note: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const isDispute = mode === 'dispute'
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1612] border border-sand/15 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading text-sand-light text-lg">
            {isDispute ? 'Dispute Report' : 'Validate Report'}
          </h3>
          <button onClick={onClose}><X className="w-4 h-4 text-sand/40" /></button>
        </div>
        <label className="text-[11px] uppercase tracking-wider text-sand/40 block mb-1.5">
          {isDispute ? 'Reason for dispute (required)' : 'Validation note (optional)'}
        </label>
        <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
          className="w-full border border-sand/15 bg-black/20 rounded px-3 py-2 text-[13px] text-sand/70 outline-none resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded border border-sand/15 text-sand/50 text-sm hover:border-sand/30 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (!isDispute || note.trim()) onConfirm(note) }}
            disabled={isDispute && !note.trim()}
            className={`flex-1 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors ${
              isDispute
                ? 'bg-red-900/50 text-red-300 border border-red-800/50 hover:bg-red-900/70'
                : 'bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/70'
            }`}>
            {isDispute ? 'Dispute' : 'Validate'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Component ───────────────────────────────
export default function InspectionView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'validate' | 'dispute' | null>(null)

  useEffect(() => {
    if (!id) return
    inspectionService.getById(parseInt(id))
      .then(data => setInspection(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleAcknowledge = async () => {
    if (!id) return
    try {
      await inspectionService.acknowledge(parseInt(id))
      setInspection((prev: any) => ({ ...prev, status: 'acknowledged' }))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleValidateReport = async (note: string) => {
    if (!inspection?.report) return
    const status = modal === 'dispute' ? 'disputed' : 'validated'
    try {
      await inspectionService.validateReport(inspection.report.report_id, status, note)
      setInspection((prev: any) => ({
        ...prev,
        report: { ...prev.report, status }
      }))
      setModal(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading Inspection...</div>
  )
  if (!inspection) return (
    <div className="min-h-screen pt-32 text-center text-red-400">Inspection not found.</div>
  )

  const statusIdx = statusOrder.indexOf(inspection.status)
  const cracks = inspection.cracks || []

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-primary mb-1 font-medium">
                Inspection #{id}
              </div>
              <h1 className="font-heading text-3xl text-foreground">{inspection.monument_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{inspection.monument_location}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(inspection.inspection_date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{inspection.inspector_name}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs capitalize">{inspection.overall_condition}</Badge>
          </div>

          {/* Status Timeline */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Status Timeline</h3>
            <div className="flex items-center gap-0">
              {statusOrder.map((s, i) => {
                const done   = i < statusIdx
                const active = i === statusIdx
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                        done   ? 'bg-emerald-700 text-white' :
                        active ? 'bg-primary text-primary-foreground' :
                                 'bg-muted text-muted-foreground'
                      }`}>
                        {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <div className={`text-[10px] mt-1 text-center capitalize ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {s.replace('_', ' ')}
                      </div>
                    </div>
                    {i < statusOrder.length - 1 && (
                      <div className={`h-px w-full mb-4 ${done ? 'bg-emerald-700' : 'bg-border'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Notes */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Field Notes</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {inspection.notes || <span className="text-muted-foreground italic">No notes recorded.</span>}
              </p>
            </motion.div>

            {/* Vulnerability Score */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Vulnerability Assessment</h3>
              {inspection.vulnerability_score != null ? (
                <ScoreBreakdown score={{
                  total_score: inspection.vulnerability_score,
                  risk_level:  inspection.risk_level,
                  age_score:   inspection.age_score,
                  crack_score: inspection.crack_score,
                }} />
              ) : (
                <p className="text-sm text-muted-foreground mt-3">Score not yet calculated.</p>
              )}
            </motion.div>
          </div>

          {/* Cracks */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Logged Cracks ({cracks.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {cracks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No cracks logged.</div>
              ) : (
                cracks.map((crack: any) => (
                  <div key={crack.crack_id} className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{crack.location_on_monument}</p>
                        {crack.length_cm && (
                          <p className="text-xs text-muted-foreground mt-0.5">{crack.length_cm} cm length</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${severityColors[crack.severity] || ''}`}>
                        {crack.severity}
                      </Badge>
                    </div>
                    {/* Photos */}
                    {crack.photo_count > 0 ? (
                      <img
                        src={inspectionService.getCrackPhotoUrl(crack.crack_id)}
                        alt="Crack photo"
                        className="w-full rounded-lg max-h-48 object-cover border border-border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground italic">No photo attached</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Authority Actions */}
          {inspection.status === 'submitted' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex justify-end gap-3">
              <Button onClick={handleAcknowledge}
                className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-900/50">
                <Check className="w-4 h-4 mr-2" /> Acknowledge Inspection
              </Button>
            </motion.div>
          )}

          {/* Report Section (if acknowledged/completed) */}
          {inspection.report && ['acknowledged','completed'].includes(inspection.status) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Inspection Report</h3>
                <Badge variant="outline" className="capitalize text-xs">{inspection.report.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{inspection.report.title}</p>
              {!['validated','disputed'].includes(inspection.report.status) && (
                <div className="flex gap-3">
                  <Button onClick={() => setModal('validate')}
                    className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-900/50" size="sm">
                    <Check className="w-4 h-4 mr-1" /> Validate Report
                  </Button>
                  <Button onClick={() => setModal('dispute')}
                    className="bg-red-900/30 text-red-400 border border-red-800/30 hover:bg-red-900/50" size="sm">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Dispute Report
                  </Button>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>

      {modal && (
        <ValidateModal
          mode={modal}
          onConfirm={handleValidateReport}
          onClose={() => setModal(null)}
        />
      )}
    </PageTransition>
  )
}
