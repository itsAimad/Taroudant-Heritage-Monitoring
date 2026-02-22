import { motion } from 'framer-motion';
import { Database, Shield, Bell, Users, ArrowRight, Zap } from 'lucide-react';

const ArchitecturePage = () => {
  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">System Architecture</h1>
          <p className="text-muted-foreground mt-1">Technical overview of the Heritage Shield platform</p>
        </div>

        {/* Database Schema */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">Database Layer (3NF)</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'MONUMENTS', fields: ['id (PK)', 'name', 'type', 'construction_year', 'era', 'lat / lng', 'risk_score', 'risk_level'] },
              { name: 'INSPECTIONS', fields: ['id (PK)', 'monument_id (FK)', 'inspector_id (FK)', 'date', 'humidity', 'crack_severity', 'erosion_depth', 'risk_score'] },
              { name: 'USERS', fields: ['id (PK)', 'username', 'role', 'name', 'email', 'last_active'] },
              { name: 'ALERTS', fields: ['id (PK)', 'monument_id (FK)', 'risk_level', 'triggered_rule', 'status', 'timestamp'] },
            ].map(table => (
              <div key={table.name} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-primary/10 px-3 py-2">
                  <span className="font-mono text-xs font-bold text-primary">{table.name}</span>
                </div>
                <div className="p-3 space-y-1">
                  {table.fields.map(f => (
                    <div key={f} className="font-mono text-xs text-muted-foreground">{f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stored Procedure */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">Risk Calculation Procedure</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 py-6">
            {[
              { label: 'Inspection Input', sub: 'humidity, cracks, erosion' },
              { label: 'Weight Application', sub: '25% / 30% / 25% / 20%' },
              { label: 'Risk Index', sub: 'Weighted sum (0-100)' },
              { label: 'Alert Check', sub: 'Threshold comparison' },
              { label: 'Notification', sub: 'Email / SMS dispatch' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="bg-muted border border-border rounded-lg p-3 text-center min-w-[140px]">
                  <div className="text-sm font-medium text-foreground">{step.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{step.sub}</div>
                </div>
                {i < 4 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Trigger System */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">Trigger System</h2>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground space-y-2">
            <div className="text-primary font-bold">-- AFTER INSERT ON inspections</div>
            <div>TRIGGER calculate_risk_on_inspection</div>
            <div className="pl-4">1. CALL calculate_risk_index(NEW.monument_id)</div>
            <div className="pl-4">2. UPDATE monuments SET risk_score = result</div>
            <div className="pl-4">3. IF risk_score {'>'} threshold THEN</div>
            <div className="pl-8">INSERT INTO alerts (...)</div>
            <div className="pl-8">CALL send_notification(admin_email, alert_details)</div>
            <div className="pl-4">END IF</div>
          </div>
        </div>

        {/* RBAC */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">Security: Role-Based Access Control</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground">Permission</th>
                  <th className="text-center py-2 text-muted-foreground">Admin</th>
                  <th className="text-center py-2 text-muted-foreground">Inspector</th>
                  <th className="text-center py-2 text-muted-foreground">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['View monuments', true, true, true],
                  ['View reports', true, true, true],
                  ['Submit inspections', true, true, false],
                  ['Upload photos', true, true, false],
                  ['Manage monuments', true, false, false],
                  ['Configure alerts', true, false, false],
                  ['Manage users', true, false, false],
                  ['Export data', true, false, false],
                ].map(([perm, admin, inspector, viewer]) => (
                  <tr key={perm as string} className="border-b border-border/50">
                    <td className="py-2 text-foreground">{perm as string}</td>
                    <td className="py-2 text-center">{admin ? '✅' : '❌'}</td>
                    <td className="py-2 text-center">{inspector ? '✅' : '❌'}</td>
                    <td className="py-2 text-center">{viewer ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security measures */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl text-foreground">Security Measures</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'SQL Injection Prevention', desc: 'Parameterized queries and prepared statements for all database interactions.' },
              { title: 'Authentication', desc: 'Secure credential validation with session management and automatic timeout.' },
              { title: 'Data Encryption', desc: 'Sensitive data encrypted at rest and in transit using industry-standard protocols.' },
              { title: 'Audit Logging', desc: 'Complete audit trail of all user actions, access attempts, and data modifications.' },
            ].map(item => (
              <div key={item.title} className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePage;
