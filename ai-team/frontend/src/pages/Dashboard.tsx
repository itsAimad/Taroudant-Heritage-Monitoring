import { useAuth } from '@/context/AuthContext';
import { MOCK_MONUMENTS, MOCK_ALERTS } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Clock, Activity, Users, FileText, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { getRiskBgColor } from '@/utils/riskCalculation';

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-5">
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`h-5 w-5 ${color || 'text-primary'}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="font-heading text-3xl text-foreground">
      {typeof value === 'number' ? <CountUp end={value} duration={1.5} /> : value}
    </div>
  </motion.div>
);

const MonumentRow = ({ m }: { m: typeof MOCK_MONUMENTS[0] }) => {
  const riskBg = m.riskLevel === 'safe' ? 'bg-safe/10 text-safe' : m.riskLevel === 'warning' ? 'bg-warning/10 text-warning' : 'bg-critical/10 text-critical';
  return (
    <Link to={`/monument/${m.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${getRiskBgColor(m.riskLevel)}`} />
        <div>
          <div className="font-medium text-sm text-foreground">{m.name}</div>
          <div className="text-xs text-muted-foreground">{m.type} · {m.era}</div>
        </div>
      </div>
      <span className={`text-xs font-mono px-2 py-1 rounded ${riskBg}`}>{m.riskScore}</span>
    </Link>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  const criticalCount = MOCK_MONUMENTS.filter(m => m.riskLevel === 'critical').length;
  const warningCount = MOCK_MONUMENTS.filter(m => m.riskLevel === 'warning').length;
  const pendingAlerts = MOCK_ALERTS.filter(a => a.status === 'pending').length;
  const sorted = [...MOCK_MONUMENTS].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">
            {user.role === 'admin' ? 'Administration' : user.role === 'inspector' ? 'Inspection' : 'Overview'} Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Shield} label="Monuments Monitored" value={MOCK_MONUMENTS.length} />
          <StatCard icon={AlertTriangle} label="Critical Risk" value={criticalCount} color="text-critical" />
          <StatCard icon={Activity} label="Warning" value={warningCount} color="text-warning" />
          <StatCard icon={Clock} label="Pending Alerts" value={pendingAlerts} color="text-warning" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monuments list */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-foreground">All Monuments</h2>
              <Link to="/heritage" className="text-sm text-primary hover:underline">View catalog →</Link>
            </div>
            <div className="space-y-1">
              {sorted.map(m => <MonumentRow key={m.id} m={m} />)}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-lg text-foreground mb-4">Recent Alerts</h2>
              <div className="space-y-3">
                {MOCK_ALERTS.slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${a.riskLevel === 'critical' ? 'bg-critical animate-pulse-glow' : 'bg-warning'}`} />
                    <div>
                      <div className="text-foreground font-medium">{a.monumentName}</div>
                      <div className="text-muted-foreground text-xs">{a.triggeredRule}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{new Date(a.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-lg text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/risk-lab" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
                  <Activity className="h-4 w-4 text-primary" /> Risk Lab
                </Link>
                <Link to="/analytics" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Analytics
                </Link>
                {user.role === 'admin' && (
                  <Link to="/users" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
                    <Users className="h-4 w-4 text-primary" /> User Management
                  </Link>
                )}
                <Link to="/architecture" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-foreground">
                  <Settings className="h-4 w-4 text-primary" /> System Architecture
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
