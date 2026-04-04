import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface TrendPoint {
  inspection_date: string
  total_score: number
  risk_level: string
}

interface Summary {
  total_inspections: number
  last_inspection_date: string | null
  last_condition: string | null
}

interface HistoryData {
  summary: Summary
  trend: TrendPoint[]
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateShort = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })
}

interface SparklineChartProps {
  data: TrendPoint[]
}

const SparklineChart = ({ data }: SparklineChartProps) => (
  <ResponsiveContainer width="100%" height={60}>
    <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
      <Line
        type="monotone"
        dataKey="total_score"
        stroke="#c87941"
        strokeWidth={1.5}
        dot={false}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </LineChart>
  </ResponsiveContainer>
)

interface Props {
  history: HistoryData | null
}

const MonitoringHistorySummary = ({ history }: Props) => {
  const total = history?.summary?.total_inspections ?? 0
  const lastDate = history?.summary?.last_inspection_date
  const trend = history?.trend ?? []

  return (
    <section className="mt-16">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px flex-1 bg-sand/10" />
        <span className="font-mono text-xs tracking-[0.3em] text-copper-light/50 uppercase">
          Monitoring History
        </span>
        <div className="h-px flex-1 bg-sand/10" />
      </div>

      {/* Summary statement */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        {total > 0 ? (
          <>
            <p className="text-sand/70 text-base leading-relaxed">
              This monument has been surveyed{' '}
              <span className="text-sand-light font-medium">
                {total} time{total !== 1 ? 's' : ''}
              </span>{' '}
              by certified heritage inspectors. Last field survey:{' '}
              <span className="text-copper-light">{formatDate(lastDate)}</span>.
            </p>
            <p className="text-sand/45 text-sm mt-3 leading-relaxed">
              Structural condition assessments are conducted on a rotating schedule
              and scored using the Heritage Shield vulnerability algorithm —
              combining structural age and observed deterioration indicators.
            </p>
          </>
        ) : (
          <p className="text-sand/45 text-sm leading-relaxed">
            No formal inspections have been recorded for this monument yet.
            Field surveys are conducted by certified heritage inspectors on
            a rotating schedule.
          </p>
        )}
      </div>

      {/* Sparkline trend — NO numbers, NO labels, NO tooltip */}
      {trend.length > 1 && (
        <div className="max-w-lg mx-auto mb-10">
          <p className="font-mono text-[10px] tracking-[0.25em] text-sand/30 uppercase text-center mb-4">
            Risk Score Trend
          </p>
          <SparklineChart data={trend} />
          <div className="flex justify-between mt-2 text-[10px] text-sand/25 font-mono">
            <span>{formatDateShort(trend[0]?.inspection_date)}</span>
            <span>{formatDateShort(trend[trend.length - 1]?.inspection_date)}</span>
          </div>
        </div>
      )}

      {/* CTA for unauthenticated */}
      <div className="text-center">
        <p className="text-sand/30 text-xs mb-4">
          Detailed inspection records, crack analysis and technical reports are
          available to authorized personnel only.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-copper-light border border-copper-light/30 rounded-lg px-5 py-2.5 hover:bg-copper-light/10 transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          Access Technical Records
        </Link>
      </div>
    </section>
  )
}

export default MonitoringHistorySummary
