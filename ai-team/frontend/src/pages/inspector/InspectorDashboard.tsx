import { useState, useEffect } from 'react'
import { inspectionService, Inspection } from '../../services/inspectionService'
import { assignmentService, Assignment } from '../../services/assignmentService'
import { useAuth } from '../../context/AuthContext'
import PageTransition from '../../components/ui/PageTransition'
import { Plus, MapPin, ChevronRight, Activity, Clock, AlertCircle, X, ClipboardList, FileText, CheckCircle2, FlaskConical } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import InspectionDetailModal from '../../components/inspector/InspectionDetailModal'

export default function InspectorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [inspections, setInspections] = useState<Inspection[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAlertsPanel, setShowAlertsPanel] = useState(false)

  // Map monument_id → latest inspection (for computing assignment status)
  const [inspectionsByMonument, setInspectionsByMonument] = useState<Record<number, Inspection>>({})

  // Inspection modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // PDF download state
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [inspData, assignData, alertsData, reportsData] = await Promise.all([
        inspectionService.getAll(),
        assignmentService.getAll(),
        inspectionService.getTriggeredNotifications(),
        inspectionService.getReports(),
      ])
      const inspList: Inspection[] = inspData.results || []
      setInspections(inspList)
      setAssignments(assignData.results || [])
      setTriggeredAlerts(alertsData.results || [])
      setReports(reportsData.results || [])

      // Build monument_id → latest inspection map
      const byMonument: Record<number, Inspection> = {}
      inspList.forEach((insp) => {
        const existing = byMonument[insp.monument_id]
        if (!existing || new Date(insp.created_at) > new Date(existing.created_at)) {
          byMonument[insp.monument_id] = { ...insp }
        }
      })

      // Link reports to their respective inspections for correct status derived 
      const reportList = reportsData.results || []
      reportList.forEach((rep: any) => {
        const insp = byMonument[rep.monument_id]
        if (insp && insp.inspection_id === rep.inspection_id) {
          (insp as any).report = rep
        }
      })

      setInspectionsByMonument(byMonument)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  // ── Assignment status helpers ──────────────────────────────

  const assignmentBadgeStyle = (status: string) =>
    ({
      completed: 'bg-green-50 text-green-700 border border-green-200',
      submitted: 'bg-purple-50 text-purple-700 border border-purple-200',
      in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    }[status] ?? 'bg-amber-50 text-amber-700 border border-amber-200')

  const assignmentBadgeLabel = (status: string) =>
    ({
      completed: 'Completed',
      submitted: 'Submitted',
      in_progress: 'In Progress',
      pending: 'Pending',
    }[status] ?? 'Pending')

  // ── Inspection status badge helpers ───────────────────────

  const statusConfig: Record<string, { label: string; style: string }> = {
    draft:        { label: 'Draft',        style: 'bg-stone-100 text-stone-500 border-stone-200' },
    in_progress:  { label: 'In Progress',  style: 'bg-blue-50 text-blue-600 border-blue-200' },
    submitted:    { label: 'Submitted',    style: 'bg-purple-50 text-purple-600 border-purple-200' },
    acknowledged: { label: 'Acknowledged', style: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    completed:    { label: 'Completed',    style: 'bg-green-50 text-green-600 border-green-200' },
  }

  // ── Inspection detail modal handlers ──────────────────────

  const handleInspectionClick = async (inspectionId: number) => {
    setModalLoading(true)
    setShowModal(true)
    setSelectedInspection(null)
    try {
      const data = await inspectionService.getDetail(inspectionId)
      setSelectedInspection(data)
    } catch (err) {
      console.error(err)
    } finally {
      setModalLoading(false)
    }
  }

  // ── PDF download handler ───────────────────────────────────

  const handleDownloadReport = async (reportId: number) => {
    try {
      setDownloadingId(reportId)
      const { blob, filename } = await inspectionService.downloadReportPdf(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download failed:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  const isOverdue = (date: string) => new Date(date) < new Date()

  const chartData = [
    { name: 'Week 1', completed: 2 },
    { name: 'Week 2', completed: 5 },
    { name: 'Week 3', completed: 3 },
    { name: 'Week 4', completed: inspections.filter(i => i.status === 'completed').length },
  ]

  if (loading) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading Inspections...</div>

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-heading text-foreground mb-2">Inspector Portal</h1>
              <p className="text-muted-foreground">Welcome back, {user?.full_name}. Here is your fieldwork overview.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/risk-lab">
                <Button variant="outline" className="border-copper-light/30 text-copper-light hover:bg-copper-light/5">
                  <FlaskConical className="w-4 h-4 mr-2" /> Risk Lab
                </Button>
              </Link>
              <Link to="/inspect/new">
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" /> New Inspection
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Stat Cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-xl">
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Assignments</div>
              <div className="text-3xl font-heading text-foreground">{assignments.filter(a => a.status !== 'completed').length}</div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {assignments.filter(a => isOverdue(a.due_date)).length} Overdue
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-xl">
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Completed (MTD)</div>
              <div className="text-3xl font-heading text-safe">{inspections.filter(i => i.status === 'completed').length}</div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Total submitted: {inspections.length}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setShowAlertsPanel(true)}
              className="bg-card border border-border p-6 rounded-xl col-span-1 lg:col-span-1 cursor-pointer hover:border-critical/50 transition-colors group"
            >
              <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-critical transition-colors text-left">Alerts Generated</div>
              <div className="text-3xl font-heading text-critical text-left">{triggeredAlerts.length}</div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-critical">
                  <AlertCircle className="w-3 h-3" /> High Risk detected
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-critical transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          </div>

          {/* ── Recent Inspections + Reports ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Recent Inspections */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="font-heading text-lg text-foreground">Recent Inspections</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-sand/70">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="p-4 font-bold">Monument</th>
                      <th className="p-4 font-bold">Condition</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inspections.slice(0, 5).map((insp) => {
                      const cfg = statusConfig[insp.status] ?? statusConfig.draft
                      return (
                        <tr key={insp.inspection_id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium text-foreground">{insp.monument_name}</td>
                          <td className="p-4 capitalize">
                            <Badge variant="outline" className={`text-[9px] ${
                              insp.overall_condition === 'critical' ? 'border-critical text-critical' :
                              insp.overall_condition === 'poor' ? 'border-warning text-warning' :
                              'border-safe text-safe'
                            }`}>
                              {insp.overall_condition}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-medium tracking-wide rounded-full px-2.5 py-0.5 border ${cfg.style}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleInspectionClick(insp.inspection_id)}
                              className="p-1.5 rounded-md hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600 ml-auto flex"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {inspections.length === 0 && (
                      <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">No inspections found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Generated Reports */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h3 className="font-heading text-lg text-foreground">Generated Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-sand/70">
                  <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="p-4 font-bold">Report Title</th>
                      <th className="p-4 font-bold">Risk</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.slice(0, 5).map((rep) => (
                      <tr key={rep.report_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium text-foreground truncate max-w-[200px]">{rep.title}</td>
                        <td className="p-4 capitalize">
                          <Badge variant="outline" className={`text-[9px] ${
                            rep.risk_level === 'critical' ? 'border-critical text-critical' :
                            rep.risk_level === 'high' ? 'border-warning text-warning' :
                            'border-safe text-safe'
                          }`}>
                            {rep.risk_level}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {rep.status === 'validated' || rep.status === 'final'
                              ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              : <Clock className="w-3 h-3 text-muted-foreground" />}
                            <span className={`uppercase tracking-wider font-semibold ${
                              rep.status === 'validated' || rep.status === 'final' ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}>
                              {rep.status === 'final' ? 'COMPLETED' : rep.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDownloadReport(rep.report_id)}
                            disabled={downloadingId === rep.report_id}
                            className="p-1.5 rounded-md hover:bg-stone-100 transition-colors text-stone-400 hover:text-amber-600 disabled:opacity-40 disabled:cursor-not-allowed ml-auto flex"
                            title="Download PDF Report"
                          >
                            {downloadingId === rep.report_id ? (
                              <div className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-amber-600 animate-spin" />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <polyline points="9 15 12 18 15 15" />
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">No reports generated yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* ── Active Assignments + Performance ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-xl text-foreground">Active Assignments</h3>
                <div className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground border border-border uppercase tracking-widest">
                  Priority Sort
                </div>
              </div>

              <div className="space-y-4">
                {assignments.filter(a => a.status !== 'completed').map((a, i) => {
                  const latestInsp = inspectionsByMonument[a.monument_id]
                  return (
                    <motion.div
                      key={a.assignment_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all group relative overflow-hidden"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOverdue(a.due_date) ? 'bg-critical' : 'bg-primary'}`} />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex gap-5 items-center">
                          <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-lg font-heading text-foreground mb-1 group-hover:text-primary transition-colors">{a.monument_name}</h4>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {new Date(a.due_date).toLocaleDateString()}</span>
                              {/* Real derived status badge */}
                              <span className={`text-[10px] font-medium tracking-wider uppercase rounded-full px-2.5 py-0.5 ${assignmentBadgeStyle(a.status)}`}>
                                {assignmentBadgeLabel(a.status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {a.status === 'completed' && latestInsp ? (
                            <button
                              onClick={() => {
                                const report = (latestInsp as any).report
                                if (report) handleDownloadReport(report.report_id)
                                else handleInspectionClick(latestInsp.inspection_id)
                              }}
                              className="text-xs text-amber-700 border border-amber-300 rounded-md px-3 py-1.5 hover:bg-amber-50 transition-colors flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Report
                            </button>
                          ) : a.status !== 'submitted' ? (
                            <button
                              onClick={() => navigate(
                                latestInsp
                                  ? `/inspect/${latestInsp.inspection_id}`
                                  : `/inspect/new?monument_id=${a.monument_id}`
                              )}
                              className="text-xs font-medium tracking-wider uppercase border border-stone-300 rounded-md px-3 py-1.5 hover:bg-stone-50 transition-colors"
                            >
                              {a.status === 'in_progress' ? 'Continue' : 'Start Inspection'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                {assignments.filter(a => a.status !== 'completed').length === 0 && (
                  <div className="p-16 text-center border border-dashed border-border rounded-xl bg-muted/10">
                    <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                      You have no active assignments. You can still perform a new inspection for any monument.
                    </p>
                    <Link to="/inspect/new">
                      <Button variant="outline" className="border-primary/30 text-primary">
                        <Plus className="w-4 h-4 mr-2" /> Start New Inspection
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-widest">Performance Insights</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1208', border: '1px solid #a36e4f66', borderRadius: '8px' }}
                        itemStyle={{ color: '#fed7aa', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="completed" stroke="#a36e4f" strokeWidth={3} dot={{ fill: '#a36e4f', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center">Inspections completed over recent weeks</p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest">Recent Activity</h3>
                <div className="space-y-4">
                  {inspections.slice(0, 3).map((insp, i) => (
                    <div key={i} className="flex gap-3 leading-tight">
                      <div className="mt-1 h-2 w-2 rounded-full bg-safe shrink-0" />
                      <div>
                        <div className="text-[11px] font-medium text-foreground">{insp.monument_name || 'Inspection'}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(insp.inspection_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {inspections.length === 0 && <p className="text-xs text-muted-foreground italic">No recent activity.</p>}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alerts Drawer ───────────────────────────────────── */}
      {showAlertsPanel && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAlertsPanel(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="relative w-full max-w-md h-full bg-card border-l border-border p-8 shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-heading text-2xl text-foreground">Alerts Generated</h3>
                <p className="text-xs text-muted-foreground">Notifications triggered by your findings</p>
              </div>
              <button onClick={() => setShowAlertsPanel(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {triggeredAlerts.map((alert, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`text-[9px] uppercase font-bold ${
                      alert.severity === 'critical' ? 'bg-critical/10 text-critical border-critical/20' :
                      alert.severity === 'high' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>
                      {alert.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(alert.sent_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{alert.monument_name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {triggeredAlerts.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm">No alerts triggered yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Inspection Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <InspectionDetailModal
            inspection={selectedInspection}
            loading={modalLoading}
            onClose={() => {
              setShowModal(false)
              setSelectedInspection(null)
            }}
            onDownloadReport={handleDownloadReport}
            downloadingId={downloadingId}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
