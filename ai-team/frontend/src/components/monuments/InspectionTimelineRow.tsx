import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

// ─── Style helpers ─────────────────────────────────────────────────────────────

const riskDotColor = (risk: string, isFirst: boolean) => {
  if (isFirst) return 'border-copper-light bg-copper-light/30'
  return (
    ({
      critical: 'border-red-500 bg-red-500/20',
      high: 'border-amber-500 bg-amber-500/20',
      medium: 'border-yellow-500 bg-yellow-500/20',
      low: 'border-emerald-500 bg-emerald-500/20',
    } as Record<string, string>)[risk?.toLowerCase()] ?? 'border-sand/20 bg-sand/5'
  )
}

const riskScoreStyle = (risk: string) =>
  (
    ({
      critical: 'bg-red-900/30 text-red-400 border-red-800/40',
      high: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
      medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
      low: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
    } as Record<string, string>)[risk?.toLowerCase()] ?? 'bg-sand/5 text-sand/50 border-sand/10'
  )

const conditionStyle = (cond: string) =>
  (
    ({
      excellent: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
      good: 'bg-emerald-900/20 text-emerald-500 border-emerald-800/30',
      fair: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
      poor: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
      critical: 'bg-red-900/30 text-red-400 border-red-800/40',
    } as Record<string, string>)[cond?.toLowerCase()] ?? 'bg-sand/5 text-sand/50 border-sand/10'
  )

const severityMiniStyle = (s: string) =>
  (
    ({
      critical: 'bg-red-900/30 text-red-400 border-red-800/30',
      major: 'bg-orange-900/30 text-orange-400 border-orange-800/30',
      moderate: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
      minor: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30',
    } as Record<string, string>)[s?.toLowerCase()] ?? 'bg-sand/5 text-sand/40 border-sand/10'
  )

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Crack {
  crack_id: number
  location_on_monument: string
  severity: string
  length_cm: number | null
  photo_count?: number
}

interface Report {
  report_id: number
  title?: string
  status?: string
}

interface Inspection {
  inspection_id: number
  inspection_date: string
  overall_condition: string
  status: string
  total_score: number | null
  risk_level: string
  age_score?: number
  crack_score?: number
  crack_count: number
  inspector_name?: string | null
  notes?: string | null
  cracks?: Crack[]
  report?: Report | null
}

interface Props {
  inspection: Inspection
  isFirst: boolean
  role: string
  onDownloadReport: (reportId: number) => void
  onOpenPhotoGallery?: (crackId: number) => void
}

// ─── Component ──────────────────────────────────────────────────────────────────

const InspectionTimelineRow = ({
  inspection: insp,
  isFirst,
  role,
  onDownloadReport,
  onOpenPhotoGallery,
}: Props) => {
  const [expanded, setExpanded] = useState(false)
  const isAuthority = role === 'authority' || role === 'admin'

  const hasScoreBreakdown =
    insp.age_score !== undefined || insp.crack_score !== undefined

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={`absolute -left-[21px] top-[18px] w-[10px] h-[10px] rounded-full border-2 transition-all duration-300
          ${riskDotColor(insp.risk_level, isFirst)}
          ${isFirst ? 'scale-125' : ''}`}
      />

      {/* Collapsed row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="relative flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer group transition-colors hover:bg-sand/5 border border-transparent hover:border-sand/[0.08]"
      >
        {/* Left: date + inspector */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <span className="text-sand text-sm font-medium">
              {formatDate(insp.inspection_date)}
            </span>
            {insp.inspector_name && (
              <span className="text-sand/35 text-xs ml-2">
                · {insp.inspector_name}
              </span>
            )}
          </div>
        </div>

        {/* Right: badges + chevron */}
        <div className="flex items-center gap-2.5 shrink-0 ml-4">
          {/* Condition badge */}
          <span
            className={`text-[10px] font-medium uppercase tracking-wider rounded-full px-2.5 py-0.5 border ${conditionStyle(insp.overall_condition)}`}
          >
            {insp.overall_condition}
          </span>

          {/* Score pill */}
          {insp.total_score !== null && insp.total_score !== undefined && (
            <span
              className={`font-mono text-xs font-medium rounded-full px-2.5 py-0.5 border ${riskScoreStyle(insp.risk_level)}`}
            >
              {insp.total_score}
            </span>
          )}

          {/* Crack count */}
          {insp.crack_count > 0 && (
            <span className="text-[10px] text-sand/35 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              {insp.crack_count}
            </span>
          )}

          {/* Expand chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-sand/25 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Animated drawer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-4 mb-3 rounded-xl border border-sand/[0.08] bg-sand/[0.03] overflow-hidden">

              {/* Field notes */}
              {insp.notes && (
                <div className="px-5 py-4 border-b border-sand/[0.08]">
                  <p className="text-[10px] font-mono tracking-[0.2em] text-sand/30 uppercase mb-2">
                    Field Notes
                  </p>
                  <p className="text-sand/60 text-sm leading-relaxed">{insp.notes}</p>
                </div>
              )}

              {/* Score breakdown bars */}
              {hasScoreBreakdown && (
                <div className="px-5 py-4 border-b border-sand/[0.08]">
                  <p className="text-[10px] font-mono tracking-[0.2em] text-sand/30 uppercase mb-3">
                    Score Breakdown
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        label: 'Age Factor',
                        value: insp.age_score ?? 0,
                        max: 50,
                        color: 'bg-amber-500/60',
                      },
                      {
                        label: 'Crack Severity',
                        value: insp.crack_score ?? 0,
                        max: 75,
                        color: 'bg-red-500/60',
                      },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-sand/40 mb-1">
                          <span>{item.label}</span>
                          <span className="font-mono">{item.value} pts</span>
                        </div>
                        <div className="h-1 rounded-full bg-sand/[0.08] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                            }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className={`h-full rounded-full ${item.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cracks list */}
              {insp.cracks && insp.cracks.length > 0 && (
                <div className="px-5 py-4 border-b border-sand/[0.08]">
                  <p className="text-[10px] font-mono tracking-[0.2em] text-sand/30 uppercase mb-3">
                    Cracks ({insp.cracks.length})
                  </p>
                  <div className="space-y-2">
                    {insp.cracks.map(crack => (
                      <div
                        key={crack.crack_id}
                        className="flex items-center justify-between text-xs text-sand/50"
                      >
                        <span className="truncate max-w-[55%]">
                          {crack.location_on_monument}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {crack.length_cm && (
                            <span className="text-sand/30 font-mono">
                              {crack.length_cm}cm
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 border ${severityMiniStyle(crack.severity)}`}
                          >
                            {crack.severity}
                          </span>
                          {/* Photo gallery button — authority only */}
                          {isAuthority && (crack.photo_count ?? 0) > 0 && onOpenPhotoGallery && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                onOpenPhotoGallery(crack.crack_id)
                              }}
                              title="View crack photos"
                              className="text-sand/30 hover:text-copper-light transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report button */}
              {insp.report && (
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="text-[10px] text-sand/30 font-mono tracking-wider">
                    REPORT #{insp.report.report_id}
                    {insp.report.status ? ` · ${insp.report.status.toUpperCase()}` : ''}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onDownloadReport(insp.report!.report_id)
                    }}
                    className="flex items-center gap-1.5 text-xs text-copper-light hover:text-copper-light/80 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InspectionTimelineRow
