import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionService } from '../../services/inspectionService'
import PageTransition from '../../components/ui/PageTransition'
import { motion } from 'framer-motion'
import { MapPin, Calendar, User, Check, AlertTriangle, X, Activity, Image as ImageIcon, FileText, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ── Helpers ──────────────────────────────────────
const statusOrder = ['draft', 'in_progress', 'submitted', 'acknowledged', 'completed']

const riskColors: Record<string, string> = {
  critical: 'text-red-400 border-red-500    bg-red-900/20',
  high: 'text-amber-400 border-amber-500 bg-amber-900/20',
  medium: 'text-yellow-400 border-yellow-500 bg-yellow-900/20',
  low: 'text-emerald-400 border-emerald-500 bg-emerald-900/20',
}
const severityColors: Record<string, string> = {
  minor: 'text-emerald-400 border-emerald-500',
  moderate: 'text-yellow-400  border-yellow-500',
  major: 'text-amber-400   border-amber-500',
  critical: 'text-red-400     border-red-500',
}

function ScoreBreakdown({ score }: { score: any }) {
  if (!score) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6 mt-2 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Activity className="w-32 h-32" />
      </div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">Final Vulnerability Output</h3>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="text-center md:text-left shrink-0">
          <div className="font-heading text-6xl font-bold text-foreground tracking-tighter">
            {score.total_score}<span className="text-xl text-muted-foreground font-medium">/100</span>
          </div>
          <div className="mt-2 text-sm font-semibold tracking-wide flex items-center justify-center md:justify-start gap-2">
            Status:
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border ${riskColors[score.risk_level] || 'text-sand/40'}`}>
              {score.risk_level} Risk
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-foreground/70 mb-2">
              <span>Historical Age Factor</span>
              <span>{score.age_score} pts</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-600/80 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, score.age_score)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium text-foreground/70 mb-2">
              <span>Structural Crack Severity</span>
              <span>{score.crack_score} pts</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-600/80 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, score.crack_score)}%` }} />
            </div>
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
            className={`flex-1 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors ${isDispute
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

          {/* Report Header */}
          <div className="bg-card border border-border p-8 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-2.5 bg-primary/5">
                    Official Report #{id}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" /> Submitted {new Date(inspection.created_at || inspection.inspection_date).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="font-heading text-4xl text-foreground font-bold tracking-tight mb-2">
                  {inspection.monument_name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-foreground/70 font-medium">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" />{inspection.monument_location}</span>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-1"><User className="w-4 h-4 text-primary" />{inspection.inspector_name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Overall Condition</div>
                <Badge className="text-sm px-4 py-1 capitalize" variant={inspection.overall_condition === 'critical' ? 'destructive' : 'default'}>
                  {inspection.overall_condition}
                </Badge>
              </div>
            </div>
          </div>
          {/* Status Timeline */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Status Timeline</h3>
            <div className="flex items-center gap-0">
              {statusOrder.map((s, i) => {
                const done = i < statusIdx
                const active = i === statusIdx
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-colors ${done ? 'bg-emerald-700 text-white' :
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary" /> Field Inspector Notes
              </h3>
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-sm text-foreground/80 leading-relaxed min-h-[140px]">
                {inspection.notes || <span className="text-muted-foreground italic">No descriptive notes recorded by inspector.</span>}
              </div>
            </motion.div>

            {/* Vulnerability Score */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {inspection.vulnerability_score != null ? (
                <ScoreBreakdown score={{
                  total_score: inspection.vulnerability_score,
                  risk_level: inspection.risk_level,
                  age_score: inspection.age_score,
                  crack_score: inspection.crack_score,
                }} />
              ) : (
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
                  <Info className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <h3 className="text-sm font-medium text-foreground">Score Pending</h3>
                  <p className="text-xs text-muted-foreground mt-1">Vulnerability score not yet calculated.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Cracks List Card */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" /> Crack Observations
              </h3>
              <Badge variant="secondary">{cracks.length} total</Badge>
            </div>

            <div className="p-6">
              {cracks.length === 0 ? (
                <div className="text-center py-10 bg-muted/10 rounded-lg border border-dashed border-border">
                  <span className="text-muted-foreground text-sm font-medium">No cracks were reported in this inspection.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cracks.map((crack: any) => (
                    <div key={crack.crack_id} className="border border-border/80 bg-background/50 rounded-lg overflow-hidden group">
                      {/* Photo Section */}
                      <div className="h-40 bg-muted border-b border-border relative overflow-hidden flex flex-col items-center justify-center relative">
                        {crack.photo_url ? (
                          <img
                            src={
                              crack.photo_url.startsWith('data:')
                                ? crack.photo_url
                                : crack.photo_url.startsWith('http')
                                  ? crack.photo_url
                                  : `http://localhost:8000${crack.photo_url}`
                            }
                            alt="Crack photo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">No visual</span>
                          </div>
                        )}
                        <div className="hidden absolute inset-0 flex-col items-center justify-center opacity-50 bg-muted">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-[10px] uppercase tracking-wider font-semibold">Resource Invalid</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className={`text-[10px] uppercase tracking-wide border bg-background/80 backdrop-blur-sm ${severityColors[crack.severity] || ''}`}>
                            {crack.severity} Severity
                          </Badge>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="p-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Location</div>
                        <p className="text-sm font-medium text-foreground mb-3">{crack.location_on_monument}</p>

                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Dimensions</div>
                        <p className="text-sm text-foreground">{crack.length_cm ? `${crack.length_cm} cm total length` : 'Not measured'}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
          {inspection.report && ['acknowledged', 'completed'].includes(inspection.status) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Inspection Report</h3>
                <Badge variant="outline" className="capitalize text-xs">{inspection.report.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{inspection.report.title}</p>
              {!['validated', 'disputed'].includes(inspection.report.status) && (
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
