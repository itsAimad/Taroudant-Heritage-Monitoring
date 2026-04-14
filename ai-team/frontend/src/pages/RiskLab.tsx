import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FlaskConical, Plus, Trash2, ChevronDown, RotateCcw, Info } from 'lucide-react'
import {
  calculateScore, CATEGORY_FACTORS, RISK_DESCRIPTIONS,
  type CrackInput, type Severity, type RiskLevel, type ScoreResult,
} from '@/lib/vulnerabilityEngine'

// ── Color constants ───────────────────────────────────────────────────────────
const riskColor: Record<RiskLevel, string> = {
  low:      '#16a34a',
  medium:   '#ca8a04',
  high:     '#d97706',
  critical: '#dc2626',
}

const riskBgStyle: Record<RiskLevel, string> = {
  low:      'bg-emerald-900/20 border-emerald-800/30',
  medium:   'bg-yellow-900/20 border-yellow-800/30',
  high:     'bg-amber-900/20 border-amber-800/30',
  critical: 'bg-red-900/20 border-red-800/30',
}

const riskTextStyle: Record<RiskLevel, string> = {
  low:      'text-emerald-400',
  medium:   'text-yellow-400',
  high:     'text-amber-400',
  critical: 'text-red-400',
}

const severityStyles: Record<Severity, { active: string; quick: string; badge: string; border: string }> = {
  minor:    { active: 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300', quick: 'border-emerald-800/40 text-emerald-400/70 hover:bg-emerald-900/20', badge: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/40', border: 'border-l-emerald-600/40' },
  moderate: { active: 'border-yellow-500/50 bg-yellow-900/30 text-yellow-300',   quick: 'border-yellow-800/40 text-yellow-400/70 hover:bg-yellow-900/20',   badge: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/40',   border: 'border-l-yellow-600/40' },
  major:    { active: 'border-amber-500/50 bg-amber-900/30 text-amber-300',       quick: 'border-amber-800/40 text-amber-400/70 hover:bg-amber-900/20',       badge: 'text-amber-400 bg-amber-900/30 border-amber-800/40',       border: 'border-l-amber-600/40' },
  critical: { active: 'border-red-500/50 bg-red-900/30 text-red-300',            quick: 'border-red-800/40 text-red-400/70 hover:bg-red-900/20',            badge: 'text-red-400 bg-red-900/30 border-red-800/40',            border: 'border-l-red-600/40' },
}

const severityDefaults: Record<Severity, number> = {
  minor: 10, moderate: 20, major: 30, critical: 0,
}

// ── CrackInputRow ─────────────────────────────────────────────────────────────
interface CrackRowProps {
  crack: CrackInput
  index: number
  contribution: number
  onChange: (id: string, updates: Partial<CrackInput>) => void
  onRemove: (id: string) => void
}

function CrackInputRow({ crack, index, contribution, onChange, onRemove }: CrackRowProps) {
  const SEVERITIES: Severity[] = ['minor', 'moderate', 'major', 'critical']
  const ss = severityStyles[crack.severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`bg-sand/3 border border-sand/8 border-l-2 ${ss.border} rounded-xl p-4 space-y-3`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-sand/30 uppercase tracking-wider">Crack #{index + 1}</span>
        <button onClick={() => onRemove(crack.id)} className="text-sand/20 hover:text-red-400/70 transition-colors p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {SEVERITIES.map(sev => (
          <button
            key={sev}
            onClick={() => onChange(crack.id, { severity: sev, length_cm: sev === 'critical' ? 0 : severityDefaults[sev] })}
            className={`py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider transition-all ${crack.severity === sev ? severityStyles[sev].active : 'border-sand/8 text-sand/30 hover:border-sand/20 hover:text-sand/50'}`}
          >
            {sev}
          </button>
        ))}
      </div>

      {crack.severity === 'critical' ? (
        <p className="text-[10px] text-sand/25 italic font-mono">Length irrelevant — always scores 15 pts</p>
      ) : (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-sand/40 font-mono uppercase tracking-wider">Length</span>
            <span className="font-mono text-xs text-copper-light/80">{crack.length_cm} cm</span>
          </div>
          <input
            type="range" min={1} max={200} step={1}
            value={crack.length_cm}
            onChange={e => onChange(crack.id, { length_cm: parseInt(e.target.value) })}
            className="w-full accent-copper-light"
          />
          <div className="flex justify-between text-[9px] text-sand/20 font-mono">
            <span>1 cm</span><span>100 cm</span><span>200 cm</span>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${ss.badge}`}>
        <span className="text-[10px] font-mono uppercase tracking-wider opacity-60">Contribution</span>
        <span className="font-mono text-sm font-semibold">+{contribution} pts</span>
      </div>
    </motion.div>
  )
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ result }: { result: ScoreResult }) {
  const r = 68
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(result.total_score, 100) / 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke={riskColor[result.risk_level]}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
        <text x="80" y="72" textAnchor="middle" fill={riskColor[result.risk_level]} fontSize="36" fontWeight="600" fontFamily="serif">
          {result.total_score}
        </text>
        <text x="80" y="90" textAnchor="middle" fill="rgba(235,220,185,0.3)" fontSize="12" fontFamily="monospace">/ 100</text>
        <text x="80" y="108" textAnchor="middle" fill={riskColor[result.risk_level]} fontSize="11" fontWeight="500" fontFamily="monospace" letterSpacing="2">
          {result.risk_level.toUpperCase()}
        </text>
      </svg>
      {result.risk_level === 'critical' && (
        <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" />
      )}
    </div>
  )
}

// ── Step card ─────────────────────────────────────────────────────────────────
const colorClass: Record<string, string> = {
  amber: 'text-amber-400', copper: 'text-copper-light', gray: 'text-sand/25',
  green: 'text-emerald-400', red: 'text-red-400',
  low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-amber-400', critical: 'text-red-400',
}

function StepCard({ n, label, value, desc, color, large }: {
  n: string; label: string; value: string | number
  desc: string; color: string; large?: boolean
}) {
  return (
    <div className="bg-sand/3 border border-sand/8 rounded-xl p-4 flex items-center gap-4">
      <span className="font-heading text-2xl text-sand/10 shrink-0 w-8">{n}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sand/50 text-xs font-medium">{label}</p>
        <p className="text-[10px] text-sand/25 mt-0.5 truncate">{desc}</p>
      </div>
      <span className={`font-mono shrink-0 ${large ? 'text-2xl font-semibold' : 'text-base'} ${colorClass[color] ?? 'text-sand/50'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Risk band table ───────────────────────────────────────────────────────────
const bands = [
  { range: '0 – 15',  level: 'Low',      color: 'border-emerald-600', bg: 'bg-emerald-900/10', text: 'text-emerald-400', threshold: 'total_score ≤ 15',        action: 'Periodic monitoring. No immediate intervention needed.' },
  { range: '16 – 35', level: 'Medium',   color: 'border-yellow-600',  bg: 'bg-yellow-900/10',  text: 'text-yellow-400',  threshold: '16 ≤ total_score ≤ 35',   action: 'Schedule maintenance within 6 months. Detailed inspection advised.' },
  { range: '36 – 60', level: 'High',     color: 'border-amber-600',   bg: 'bg-amber-900/10',   text: 'text-amber-400',   threshold: '36 ≤ total_score ≤ 60',   action: 'Urgent intervention required. Authorities notified automatically.' },
  { range: '61+',     level: 'Critical', color: 'border-red-600',     bg: 'bg-red-900/10',     text: 'text-red-400',     threshold: 'total_score > 60',         action: 'Emergency closure. Immediate restoration required. Monument flagged.' },
]

const limitations = [
  { factor: 'Humidity & Moisture',   reason: 'Requires continuous IoT sensor integration — not yet deployed on Taroudant sites.' },
  { factor: 'Seismic Activity',      reason: 'Would require integration with ONHYM seismic data feed. Planned for v3.0.' },
  { factor: 'Rainfall & Erosion',    reason: 'Seasonal weathering data from Météo Maroc not yet integrated into scoring.' },
  { factor: 'Foundation Soil',       reason: 'Geotechnical survey data not systematically collected for Taroudant monuments.' },
  { factor: 'Restoration History',   reason: 'Previous interventions could reduce risk but historical records are incomplete.' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RiskLab() {
  const [category, setCategory]           = useState('Rempart')
  const [constructionYear, setYear]       = useState<number>(1528)
  const [cracks, setCracks]               = useState<CrackInput[]>([])
  const [showLimitations, setShowLim]     = useState(false)

  const result = useMemo(
    () => calculateScore(constructionYear, category, cracks),
    [constructionYear, category, cracks]
  )

  const breakdownMap = Object.fromEntries(result.crack_breakdown.map(b => [b.id, b]))

  const addCrack = useCallback((sev: Severity = 'minor') => {
    setCracks(prev => [...prev, { id: crypto.randomUUID(), severity: sev, length_cm: severityDefaults[sev] }])
  }, [])

  const updateCrack = useCallback((id: string, updates: Partial<CrackInput>) => {
    setCracks(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const removeCrack = useCallback((id: string) => {
    setCracks(prev => prev.filter(c => c.id !== id))
  }, [])

  const reset = () => { setCategory('Rempart'); setYear(1528); setCracks([]) }

  const steps = [
    { n: '01', label: 'Raw Crack Score',     value: result.raw_crack_score, desc: `${cracks.length} crack${cracks.length !== 1 ? 's' : ''} logged`,                                                                                                                                                                                                 color: 'amber' },
    { n: '02', label: 'Age Multiplier',      value: `× ${result.age_multiplier.toFixed(3)}`, desc: result.raw_crack_score === 0 ? 'Inactive — no cracks present' : `${result.age_years}yr old monument`,                                                                                                                                           color: result.raw_crack_score === 0 ? 'gray' : 'copper' },
    { n: '03', label: 'Weighted Crack Score', value: result.crack_score, desc: `${result.raw_crack_score} × ${result.age_multiplier.toFixed(2)}`,                                                                                                                                                                                                   color: 'amber' },
    { n: '04', label: 'Age Bonus',           value: `+ ${result.age_score}`, desc: result.age_score === 0 ? 'Zero — no cracks to amplify' : 'max 10 pts, capped',                                                                                                                                                                                   color: result.age_score === 0 ? 'gray' : 'amber' },
    { n: '05', label: 'Category Factor',     value: `× ${result.category_factor.toFixed(2)}`, desc: `${result.category_name} — ${result.category_factor < 1 ? 'durable material (reduces score)' : result.category_factor > 1 ? 'vulnerable material (increases score)' : 'standard material'}`,                                                  color: result.category_factor < 1 ? 'green' : result.category_factor > 1 ? 'red' : 'gray' },
    { n: '06', label: 'Total Score',         value: result.total_score, desc: `Risk: ${result.risk_level.toUpperCase()}`, color: result.risk_level, large: true },
  ]

  return (
    <div className="min-h-screen bg-[#0f0d0b]">
      {/* ── Header ── */}
      <div className="pt-24 pb-10 px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sand/30 text-xs font-mono tracking-wider mb-6">
          <Link to="/dashboard" className="hover:text-sand/60 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-copper-light/60">Risk Lab</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-copper-light/10 border border-copper-light/20 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-copper-light" />
              </div>
              <span className="font-mono text-xs tracking-[0.3em] text-copper-light/50 uppercase">Vulnerability Calculator</span>
            </div>
            <h1 className="font-heading text-[clamp(1.8rem,4vw,2.8rem)] text-sand-light leading-tight">Risk Lab</h1>
            <p className="text-sand/45 text-sm leading-relaxed mt-2 max-w-xl">
              Simulate the vulnerability scoring algorithm on any monument profile.
              Results are not saved to the database — this is a calibration and training tool.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="bg-sand/5 border border-sand/10 rounded-xl p-4 text-right hidden sm:block">
              <p className="text-[10px] font-mono tracking-wider text-sand/30 uppercase mb-1">Formula Version</p>
              <p className="text-sand text-sm font-medium">v2.1 — Weighted</p>
              <p className="text-[10px] text-sand/30 mt-0.5">Age × Crack × Category</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-xs text-sand/30 hover:text-sand/60 transition-colors border border-sand/10 hover:border-sand/20 rounded-lg px-3 py-2 font-mono"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="px-6 pb-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ══ LEFT: Inputs ═══════════════════════════════════════════════════ */}
        <div className="bg-stone-900/50 border border-sand/8 rounded-2xl p-6 space-y-8">

          {/* 01 — Monument Profile */}
          <div>
            <h3 className="font-mono text-xs tracking-[0.25em] text-sand/40 uppercase mb-4">01 — Monument Profile</h3>

            {/* Category selector */}
            <div className="space-y-2 mb-6">
              <label className="text-xs text-sand/50 tracking-wider uppercase font-mono">Monument Type</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(CATEGORY_FACTORS).map(([name, factor]) => (
                  <button
                    key={name}
                    onClick={() => setCategory(name)}
                    className={`text-left p-3 rounded-xl border text-sm transition-all ${category === name ? 'border-copper-light/40 bg-copper-light/10 text-sand-light' : 'border-sand/8 bg-sand/3 text-sand/50 hover:border-sand/20 hover:text-sand/70'}`}
                  >
                    <div className="font-medium text-xs">{name}</div>
                    <div className="text-[10px] mt-0.5 opacity-60 font-mono">factor × {factor.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Year slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-sand/50 tracking-wider uppercase font-mono">Construction Year</label>
                <span className="font-mono text-sm text-copper-light">{constructionYear}</span>
              </div>
              <input
                type="range" min={900} max={2000} step={10}
                value={constructionYear}
                onChange={e => setYear(parseInt(e.target.value))}
                className="w-full accent-copper-light"
              />
              <div className="flex justify-between text-[10px] text-sand/25 font-mono">
                <span>900 CE</span><span>1200</span><span>1500</span><span>1800</span><span>2000</span>
              </div>
              <div className="bg-sand/5 rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-sand/40">Structural Age</span>
                <span className="font-mono text-sm text-sand/70">{new Date().getFullYear() - constructionYear} years</span>
              </div>
              <p className="text-[11px] text-sand/30 leading-relaxed italic">
                Age activates only when cracks exist. A monument with no cracks scores 0 regardless
                of age — structural age alone is not a risk indicator in this model.
              </p>
            </div>
          </div>

          {/* 02 — Crack Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-xs tracking-[0.25em] text-sand/40 uppercase">02 — Crack Observations</h3>
              <button
                onClick={() => addCrack('minor')}
                className="flex items-center gap-1.5 text-xs text-copper-light/70 hover:text-copper-light transition-colors border border-copper-light/20 hover:border-copper-light/40 rounded-lg px-3 py-1.5"
              >
                <Plus className="w-3 h-3" /> Add Crack
              </button>
            </div>

            {cracks.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-sand/10 rounded-xl">
                <p className="text-sand/25 text-sm">No cracks added yet</p>
                <p className="text-sand/15 text-xs mt-1">Score will be 0 with no cracks</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {cracks.map((crack, index) => (
                    <CrackInputRow
                      key={crack.id}
                      crack={crack}
                      index={index}
                      contribution={breakdownMap[crack.id]?.contribution ?? 0}
                      onChange={updateCrack}
                      onRemove={removeCrack}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {cracks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(['minor', 'moderate', 'major', 'critical'] as Severity[]).map(sev => (
                  <button
                    key={sev}
                    onClick={() => addCrack(sev)}
                    className={`text-[10px] uppercase tracking-wider font-mono rounded-full px-2.5 py-1 border transition-colors ${severityStyles[sev].quick}`}
                  >
                    + {sev}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Live Results ═══════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Score ring + risk badge */}
          <div className="bg-stone-900/50 border border-sand/8 rounded-2xl p-6 flex flex-col items-center">
            <ScoreRing result={result} />
            <div className={`rounded-xl p-4 border mt-4 w-full text-center ${riskBgStyle[result.risk_level]}`}>
              <p className={`font-heading text-base font-semibold mb-1 ${riskTextStyle[result.risk_level]}`}>
                {RISK_DESCRIPTIONS[result.risk_level].label}
              </p>
              <p className="text-xs text-sand/50 leading-relaxed">{RISK_DESCRIPTIONS[result.risk_level].action}</p>
              {result.critical_override && (
                <div className="mt-2 pt-2 border-t border-red-800/30 text-[11px] text-red-400/80 italic">
                  ⚡ Critical crack override applied — risk escalated to HIGH minimum
                </div>
              )}
            </div>
          </div>

          {/* Step breakdown */}
          <div className="bg-stone-900/50 border border-sand/8 rounded-2xl p-6">
            <h3 className="font-mono text-xs tracking-[0.25em] text-sand/30 uppercase mb-4">Score Computation Steps</h3>
            <div className="space-y-1">
              {steps.map((step, i) => (
                <div key={step.n}>
                  <StepCard {...step} />
                  {i < steps.length - 1 && <div className="w-px h-2 bg-sand/10 ml-10" />}
                </div>
              ))}
            </div>
          </div>

          {/* Crack table */}
          {cracks.length > 0 && (
            <div className="bg-stone-900/50 border border-sand/8 rounded-2xl p-6">
              <h3 className="font-mono text-xs tracking-[0.25em] text-sand/30 uppercase mb-4">Crack Contributions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-sand/8">
                      {['#', 'Severity', 'Length', 'Base', '× Factor', '= Pts'].map(h => (
                        <th key={h} className="text-left py-2 px-2 text-sand/30 font-mono uppercase text-[10px] tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/5">
                    {result.crack_breakdown.map((b, i) => (
                      <tr key={b.id} className="hover:bg-sand/3 transition-colors">
                        <td className="py-2 px-2 text-sand/30 font-mono">{i + 1}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${severityStyles[b.severity].badge}`}>{b.severity}</span>
                        </td>
                        <td className="py-2 px-2 font-mono text-sand/50">{b.severity === 'critical' ? '—' : `${b.length_cm} cm`}</td>
                        <td className="py-2 px-2 font-mono text-sand/50">{b.base_weight}</td>
                        <td className="py-2 px-2 font-mono text-sand/50">{b.severity === 'critical' ? '—' : `× ${b.length_mult.toFixed(2)}`}</td>
                        <td className="py-2 px-2 font-mono font-semibold text-copper-light">+{b.contribution}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-sand/10">
                      <td colSpan={5} className="py-2 px-2 text-sand/30 font-mono text-[10px] uppercase tracking-wider">Total raw crack score</td>
                      <td className="py-2 px-2 font-mono font-semibold text-amber-400">{result.raw_crack_score}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Limitations collapsible */}
          <div className="bg-stone-900/50 border border-sand/8 rounded-2xl px-6 py-4">
            <button
              onClick={() => setShowLim(!showLimitations)}
              className="w-full flex items-center justify-between py-1 text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-sand/20" />
                <span className="font-mono text-xs tracking-wider text-sand/25 uppercase">Scope & Limitations</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-sand/20 transition-transform duration-200 ${showLimitations ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showLimitations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3 text-[11px] text-sand/35 leading-relaxed">
                    <p className="border-l-2 border-sand/10 pl-3">
                      This calculator implements the{' '}
                      <span className="text-sand/60 font-medium">structural observation model</span>
                      {' '}— it evaluates visible physical damage and material durability against age.
                    </p>
                    <p className="font-mono text-[10px] text-sand/25 uppercase tracking-wider mt-4 mb-2">Not currently included:</p>
                    {limitations.map(item => (
                      <div key={item.factor} className="bg-sand/3 rounded-lg p-3">
                        <p className="text-sand/50 font-medium text-xs mb-0.5">{item.factor}</p>
                        <p className="text-sand/25 text-[10px] leading-relaxed">{item.reason}</p>
                      </div>
                    ))}
                    <p className="text-sand/20 text-[10px] leading-relaxed italic mt-2">
                      The current model is optimized for field-observable structural indicators.
                      Environmental factors will be incorporated as sensor infrastructure is deployed
                      across the Taroudant heritage zone.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Risk Band Reference ── */}
      <div className="px-6 pb-20 max-w-6xl mx-auto">
        <h3 className="font-mono text-xs tracking-[0.25em] text-sand/30 uppercase mb-4">Risk Classification Reference</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {bands.map(band => (
            <div key={band.level} className={`rounded-xl ${band.bg} border-l-4 ${band.color} border border-sand/5 p-4`}>
              <p className={`font-mono text-2xl font-semibold ${band.text} mb-1`}>{band.range}</p>
              <p className={`font-heading text-base font-semibold ${band.text} mb-1`}>{band.level}</p>
              <p className="text-[10px] font-mono text-sand/25 mb-2">{band.threshold}</p>
              <p className="text-[11px] text-sand/50 leading-relaxed">{band.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
