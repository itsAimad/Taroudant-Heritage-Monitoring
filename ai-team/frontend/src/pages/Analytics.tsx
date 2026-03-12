import { MOCK_MONUMENTS, MOCK_ALERTS, RISK_HISTORY } from '@/data/mockData';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Shield, AlertTriangle, Clock, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = { safe: '#22C55E', warning: '#F59E0B', critical: '#EF4444', copper: '#A67C52', stone: '#8B7355' };

const Analytics = () => {
  const criticalCount = MOCK_MONUMENTS.filter(m => m.riskLevel === 'critical').length;
  const warningCount = MOCK_MONUMENTS.filter(m => m.riskLevel === 'warning').length;
  const safeCount = MOCK_MONUMENTS.filter(m => m.riskLevel === 'safe').length;
  const pendingAlerts = MOCK_ALERTS.filter(a => a.status === 'pending').length;
  const recentInspections = MOCK_MONUMENTS.reduce((sum, m) => sum + m.inspections.length, 0);

  const riskDistribution = [
    { name: 'Safe', value: safeCount, color: CHART_COLORS.safe },
    { name: 'Warning', value: warningCount, color: CHART_COLORS.warning },
    { name: 'Critical', value: criticalCount, color: CHART_COLORS.critical },
  ];

  const monumentRisks = MOCK_MONUMENTS.map(m => ({
    name: m.name.length > 15 ? m.name.slice(0, 15) + '…' : m.name,
    risk: m.riskScore,
    fill: m.riskLevel === 'safe' ? CHART_COLORS.safe : m.riskLevel === 'warning' ? CHART_COLORS.warning : CHART_COLORS.critical,
  })).sort((a, b) => b.risk - a.risk);

  // Vulnerability factors across all monuments
  const factorData = [
    { name: 'Humidity', value: 30 },
    { name: 'Cracks', value: 25 },
    { name: 'Age', value: 25 },
    { name: 'Erosion', value: 20 },
  ];
  const factorColors = ['#3B82F6', '#F59E0B', '#8B7355', '#EF4444'];

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive heritage monitoring statistics</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Shield, label: 'Total Monuments', value: MOCK_MONUMENTS.length, color: 'text-primary' },
            { icon: AlertTriangle, label: 'High Risk', value: criticalCount, color: 'text-critical' },
            { icon: Clock, label: 'Total Inspections', value: recentInspections, color: 'text-primary' },
            { icon: Activity, label: 'Active Alerts', value: pendingAlerts, color: 'text-warning' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <div className="font-heading text-3xl text-foreground"><CountUp end={s.value} duration={1.5} /></div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Evolution */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-heading text-lg text-foreground mb-4">Risk Evolution Over Time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={RISK_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="babElKasbah" name="Bab El Kasbah" stroke={CHART_COLORS.warning} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="borjSouth" name="Borj Sud" stroke={CHART_COLORS.critical} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rampartWest" name="Western Rampart" stroke={CHART_COLORS.copper} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="average" name="Average" stroke={CHART_COLORS.stone} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk by Monument */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-heading text-lg text-foreground mb-4">Risk Score by Monument</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monumentRisks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
                  {monumentRisks.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution Pie */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-heading text-lg text-foreground mb-4">Monuments by Risk Level</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Vulnerability Factors */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-heading text-lg text-foreground mb-4">Vulnerability Factor Weights</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={factorData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {factorData.map((_, i) => (
                    <Cell key={i} fill={factorColors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert History */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-heading text-lg text-foreground mb-4">Alert History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Monument</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Level</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Rule</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ALERTS.map(a => (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="py-3 font-mono text-xs text-foreground">{new Date(a.timestamp).toLocaleDateString()}</td>
                    <td className="py-3 text-foreground">{a.monumentName}</td>
                    <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${a.riskLevel === 'critical' ? 'bg-critical/10 text-critical' : 'bg-warning/10 text-warning'}`}>{a.riskLevel}</span></td>
                    <td className="py-3 text-muted-foreground text-xs">{a.triggeredRule}</td>
                    <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${a.status === 'pending' ? 'bg-warning/10 text-warning' : a.status === 'acknowledged' ? 'bg-primary/10 text-primary' : 'bg-safe/10 text-safe'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
