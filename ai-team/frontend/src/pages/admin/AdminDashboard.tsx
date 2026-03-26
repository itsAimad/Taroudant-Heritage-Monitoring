import { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import PageTransition from '../../components/ui/PageTransition'
import { Check, X, Shield, Users, Activity, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsData, assignData, logsData, reqData] = await Promise.all([
        adminService.getStats(),
        adminService.getAssignments(),
        adminService.getAuditLogs(),
        adminService.getAccessRequests('pending')
      ])
      setStats(statsData)
      setAssignments(assignData.results || [])
      setAuditLogs(logsData.results || [])
      setAccessRequests(reqData.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewRequest = async (id: number, status: string) => {
    try {
      await adminService.reviewRequest(id, status, 'Reviewed via dashboard')
      setAccessRequests(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      alert(err.message || 'Action failed')
    }
  }

  if (loading) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading Dashboard...</div>

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="font-heading text-3xl text-foreground mb-2">System Administration</h1>
              <p className="text-muted-foreground">Manage users, view assignments, and audit system activity.</p>
            </div>
            <Link to="/admin/users">
              <Button>
                <Users className="h-4 w-4 mr-2" /> Manage Users
              </Button>
            </Link>
          </div>

          {/* TOP ROW: SUMMARY STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Active Users</div>
                <div className="text-3xl font-heading text-foreground">
                  <CountUp end={stats?.active_users || 0} />
                </div>
              </div>
              <Users className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Inspectors</div>
                <div className="text-3xl font-heading text-foreground">
                  <CountUp end={stats?.inspectors || 0} />
                </div>
              </div>
              <Shield className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Active Inspections</div>
                <div className="text-3xl font-heading text-warning">
                  <CountUp end={stats?.active_inspections || 0} />
                </div>
              </div>
              <Activity className="w-8 h-8 text-warning/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Logs Today</div>
                <div className="text-3xl font-heading text-foreground">
                  <CountUp end={stats?.logs_today || 0} />
                </div>
              </div>
              <FileText className="w-8 h-8 text-primary/30" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">

              {/* INSTRUCTOR ASSIGNMENTS */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border h-[64px] flex items-center bg-muted/30">
                  <h3 className="text-sm font-medium text-foreground">Inspector Assignments</h3>
                </div>
                <div className="overflow-auto max-h-[350px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase sticky top-0">
                      <tr>
                        <th className="p-4 font-medium">Inspector</th>
                        <th className="p-4 font-medium">Assigned Monument</th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium">Inspections</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assignments.map((a, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-foreground">{a.inspector_name}</div>
                            <div className="text-xs text-muted-foreground">{a.inspector_email}</div>
                          </td>
                          <td className="p-4 font-medium text-foreground/80">{a.monument_name}</td>
                          <td className="p-4 text-muted-foreground text-sm">{a.location}</td>
                          <td className="p-4">
                            <Badge variant="outline">{a.inspection_count}</Badge>
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No assignments found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* AUDIT LOGS */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border h-[64px] flex items-center bg-muted/30">
                  <h3 className="text-sm font-medium text-foreground">System Audit Logs (Last 100)</h3>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase sticky top-0">
                      <tr>
                        <th className="p-4 font-medium">Time</th>
                        <th className="p-4 font-medium">User</th>
                        <th className="p-4 font-medium">Action</th>
                        <th className="p-4 font-medium">Entity Type / ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {auditLogs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-muted-foreground text-xs">
                            {new Date(log.performed_at).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground text-sm">{log.user_name || 'System'}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'CREATE' ? 'default' : 'secondary'} className="text-[10px]">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-foreground/80">
                            {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No audit logs found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </div>

            <div className="space-y-6">
              {/* PENDING ACCESS REQUESTS */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 px-6 border-b border-border flex justify-between items-center h-[64px] bg-muted/30">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    Access Requests
                    {accessRequests.length > 0 && <Badge variant="secondary" className="bg-primary/20 text-primary">{accessRequests.length}</Badge>}
                  </h3>
                </div>
                <div className="overflow-auto max-h-[500px]">
                  <div className="divide-y divide-border">
                    {accessRequests.map((req) => (
                      <div key={req.id} className="p-5">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <p className="text-sm text-foreground font-medium">{req.full_name}</p>
                            <p className="text-xs text-muted-foreground font-mono mb-1">{req.email}</p>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              Requested: {req.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(req.submitted_at).toLocaleDateString()}</div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded text-sm text-muted-foreground/80 mb-4 border border-border/50">
                          <span className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">Organization / Notes</span>
                          {req.organization} - {req.reason}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReviewRequest(req.id, 'approved')}
                            size="sm"
                            className="flex-1 bg-safe hover:bg-safe/90 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReviewRequest(req.id, 'rejected')}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {accessRequests.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">No pending requests.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}
