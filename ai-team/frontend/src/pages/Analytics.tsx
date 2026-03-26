import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Shield, AlertTriangle, Clock, Activity, FileText } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import PageTransition from '../components/ui/PageTransition'

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#eab308',
  low:      '#22c55e',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  major:    '#f59e0b',
  moderate: '#eab308',
  minor:    '#22c55e',
}

const Analytics = () => {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    analyticsService.get()
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-background pt-32 text-center text-muted-foreground">
      Loading analytics...
    </div>
  )
  if (error || !data) return (
    <div className="min-h-screen bg-background pt-32 text-center text-destructive">
      Failed to load analytics. Make sure you are logged in as admin or authority.
    </div>
  )

  const summary = data.summary || {}

  // Risk distribution → PieChart data
  const riskDistData = (data.risk_distribution || []).map((d: any) => ({
    name:  (d.risk_level || 'unknown').toUpperCase(),
    value: d.count,
    color: RISK_COLORS[d.risk_level] || '#78716c',
  }))

  // Crack severity breakdown → BarChart
  const crackData = (data.crack_severity || []).map((d: any) => ({
    name:  d.severity,
    count: d.count,
    fill:  SEVERITY_COLORS[d.severity] || '#78716c',
  }))

  // Inspections trend → BarChart
  const trendData = (data.inspections_trend || []).map((d: any) => ({
    month:    d.month,
    total:    d.total,
    critical: d.critical_count,
  }))

  // Most vulnerable → horizontal bar
  const vulnData = (data.most_vulnerable || []).map((m: any) => ({
    name:  m.name.length > 18 ? m.name.slice(0, 18) + '…' : m.name,
    score: m.total_score,
    fill:  RISK_COLORS[m.risk_level] || '#78716c',
  }))

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Live data from the Taroudant Heritage monitoring database.
            </p>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { icon: Shield,        label: 'Monuments',   value: summary.total_monuments   || 0, color: 'text-primary' },
              { icon: Clock,         label: 'Inspections', value: summary.total_inspections || 0, color: 'text-primary' },
              { icon: AlertTriangle, label: 'Cracks',      value: summary.total_cracks      || 0, color: 'text-warning' },
              { icon: Activity,      label: 'Alerts',      value: summary.unread_alerts     || 0, color: 'text-critical' },
              { icon: FileText,      label: 'Reports',     value: summary.total_reports     || 0, color: 'text-primary' },
            ].map((s) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="font-heading text-3xl text-foreground">
                  <CountUp end={s.value} duration={1.5} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">

            {/* Risk Distribution Pie */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-base text-foreground mb-4">Risk Distribution</h2>
              {riskDistData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">No vulnerability scores computed yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={riskDistData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {riskDistData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Most Vulnerable Monuments */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-base text-foreground mb-4">Most Vulnerable Monuments</h2>
              {vulnData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={vulnData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis type="number" domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={130}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {vulnData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Inspections Trend */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-base text-foreground mb-4">Inspections Trend (6M)</h2>
              {trendData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">No inspection data for the last 6 months.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="total"    name="Total"    fill="#a36e4f" radius={[4,4,0,0]} />
                    <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Crack Severity Distribution */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-base text-foreground mb-4">Cracks by Severity</h2>
              {crackData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">No cracks logged yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={crackData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name"  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {crackData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}

export default Analytics
