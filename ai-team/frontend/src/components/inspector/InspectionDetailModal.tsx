import { motion } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Helper style functions ──────────────────────────────────

const severityStyle = (s: string) =>
  ({
    critical: 'bg-red-50 text-red-700 border-red-200',
    major: 'bg-orange-50 text-orange-700 border-orange-200',
    moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    minor: 'bg-green-50 text-green-700 border-green-200',
  }[s?.toLowerCase()] ?? 'bg-stone-50 text-stone-600 border-stone-200')

const scoreBackground = (risk: string) =>
  ({
    critical: 'bg-red-50 text-red-700',
    high: 'bg-orange-50 text-orange-700',
    medium: 'bg-yellow-50 text-yellow-700',
    low: 'bg-green-50 text-green-700',
  }[risk?.toLowerCase()] ?? 'bg-stone-50 text-stone-700')

const conditionBadge = (c: string) =>
  ({
    good: 'text-green-700 bg-green-50 border border-green-200 text-xs font-medium rounded-full px-2.5 py-0.5',
    fair: 'text-yellow-700 bg-yellow-50 border border-yellow-200 text-xs font-medium rounded-full px-2.5 py-0.5',
    poor: 'text-orange-700 bg-orange-50 border border-orange-200 text-xs font-medium rounded-full px-2.5 py-0.5',
    critical: 'text-red-700 bg-red-50 border border-red-200 text-xs font-medium rounded-full px-2.5 py-0.5',
  }[c?.toLowerCase()] ?? 'text-stone-600 bg-stone-50 border border-stone-200 text-xs font-medium rounded-full px-2.5 py-0.5')

const statusLabel = (s: string) =>
  ({
    draft: 'Draft',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    acknowledged: 'Acknowledged',
    completed: 'Completed',
  }[s] ?? s)

const statusBadge = (s: string) =>
  ({
    draft: 'bg-stone-100 text-stone-500 border-stone-200',
    in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
    submitted: 'bg-purple-50 text-purple-600 border-purple-200',
    acknowledged: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    completed: 'bg-green-50 text-green-600 border-green-200',
  }[s] ?? 'bg-stone-100 text-stone-500 border-stone-200')

const formatDate = (d: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Types ───────────────────────────────────────────────────

interface Crack {
  crack_id: number
  location_on_monument: string
  severity: string
  length_cm: number | null
  photo_count: number
}

interface InspectionDetail {
  inspection_id: number
  monument_name: string
  monument_location: string
  inspection_date: string
  overall_condition: string
  status: string
  notes: string
  vulnerability_score: number | null
  risk_level: string | null
  age_score: number | null
  crack_score: number | null
  inspector_name: string
  cracks: Crack[]
  report: { report_id: number; title: string; status: string } | null
}

interface Props {
  inspection: InspectionDetail | null
  loading: boolean
  onClose: () => void
  onDownloadReport: (reportId: number) => void
  downloadingId: number | null
}

// ── Component ───────────────────────────────────────────────

export default function InspectionDetailModal({
  inspection,
  loading,
  onClose,
  onDownloadReport,
  downloadingId,
}: Props) {
  const navigate = useNavigate()

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-stone-200"
      >
        {/* Loading state */}
        {loading && (
          <>
            <div className="flex items-start justify-between p-6 border-b border-stone-100">
              <div className="h-5 w-40 bg-stone-100 rounded animate-pulse" />
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-amber-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-400">Loading inspection...</p>
              </div>
            </div>
          </>
        )}

        {/* Loaded state */}
        {!loading && inspection && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-semibold text-stone-800">{inspection.monument_name}</h2>
                <p className="text-sm text-stone-400 mt-0.5">{inspection.monument_location}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-medium tracking-wide rounded-full px-2.5 py-0.5 border ${statusBadge(inspection.status)}`}>
                  {statusLabel(inspection.status)}
                </span>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Row 1: Date + Condition + Score */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm font-medium text-stone-700">{formatDate(inspection.inspection_date)}</p>
                </div>

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Condition</p>
                  <span className={conditionBadge(inspection.overall_condition)}>
                    {inspection.overall_condition
                      ? inspection.overall_condition.charAt(0).toUpperCase() + inspection.overall_condition.slice(1)
                      : '—'}
                  </span>
                </div>

                <div className={`rounded-xl p-4 ${scoreBackground(inspection.risk_level ?? '')}`}>
                  <p className="text-xs uppercase tracking-wider mb-1 opacity-60">Risk Score</p>
                  <p className="text-xl font-bold">{inspection.vulnerability_score ?? '—'}/100</p>
                  <p className="text-xs font-medium capitalize mt-0.5">
                    {inspection.risk_level ?? 'not computed'}
                  </p>
                </div>
              </div>

              {/* Score breakdown */}
              {inspection.age_score !== null && (
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">Score Breakdown</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Age Factor', value: inspection.age_score ?? 0, color: 'bg-amber-400' },
                      { label: 'Crack Severity', value: inspection.crack_score ?? 0, color: 'bg-red-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                          <span>{item.label}</span>
                          <span className="font-mono">{item.value} pts</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all duration-700`}
                            style={{ width: `${Math.min((item.value / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {inspection.notes && (
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Field Notes</p>
                  <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 rounded-xl p-4">{inspection.notes}</p>
                </div>
              )}

              {/* Cracks list */}
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">
                  Cracks Logged ({inspection.cracks?.length ?? 0})
                </p>

                {inspection.cracks?.length > 0 ? (
                  <div className="space-y-2">
                    {inspection.cracks.map((crack) => (
                      <div
                        key={crack.crack_id}
                        className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-700 truncate">{crack.location_on_monument}</p>
                          {crack.length_cm && (
                            <p className="text-xs text-stone-400 mt-0.5">{crack.length_cm} cm</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <span className={`text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 border ${severityStyle(crack.severity)}`}>
                            {crack.severity}
                          </span>
                          {crack.photo_count > 0 && (
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                              {crack.photo_count}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 italic text-center py-4">No cracks recorded</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <p className="text-xs text-stone-400">
                Inspection #{inspection.inspection_id} · {inspection.inspector_name}
              </p>

              <div className="flex items-center gap-3">
                {inspection.report && (
                  <button
                    onClick={() => onDownloadReport(inspection.report!.report_id)}
                    disabled={downloadingId === inspection.report.report_id}
                    className="flex items-center gap-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-lg px-4 py-2 hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {downloadingId === inspection.report.report_id ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 border-t-amber-700 animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    Download Report PDF
                  </button>
                )}

                {inspection.status !== 'completed' && inspection.status !== 'submitted' && (
                  <button
                    onClick={() => {
                      onClose()
                      navigate(`/inspect/${inspection.inspection_id}`)
                    }}
                    className="text-sm font-medium text-white bg-stone-700 rounded-lg px-4 py-2 hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                  >
                    Continue Inspection
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
