import { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import PageTransition from '../../components/ui/PageTransition'
import { Check, X, Shield, Users, Activity, FileText, BarChart3, PieChart as PieIcon, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Calendar, MapPin, ClipboardList } from 'lucide-react'
import { monumentService, Monument } from '../../services/monumentService'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [monuments, setMonuments] = useState<Monument[]>([])
  const [inspectors, setInspectors] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form State
  const [newAssignment, setNewAssignment] = useState({
    inspectorId: '',
    monumentId: '',
    dueDate: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsData, assignData, logsData, reqData, monData, insData] = await Promise.all([
        adminService.getStats(),
        adminService.getAssignments(),
        adminService.getAuditLogs(),
        adminService.getAccessRequests('pending'),
        monumentService.getAll(),
        adminService.getUsers('inspector')
      ])
      setStats(statsData)
      setAssignments(assignData.results || [])
      setAuditLogs(logsData.results || [])
      setAccessRequests(reqData.results || [])
      setMonuments(monData.results || [])
      setInspectors(insData.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssignment.inspectorId || !newAssignment.monumentId || !newAssignment.dueDate) {
      alert("Please fill in all required fields")
      return
    }
    
    setSubmitting(true)
    try {
      await adminService.createAssignment({
        inspector_id: parseInt(newAssignment.inspectorId),
        monument_id: parseInt(newAssignment.monumentId),
        due_date: newAssignment.dueDate,
        notes: newAssignment.notes
      })
      
      // Reset form and refresh
      setNewAssignment({ inspectorId: '', monumentId: '', dueDate: '', notes: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || "Failed to create assignment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this assignment?")) return
    try {
      await adminService.deleteAssignment(id)
      setAssignments(prev => prev.filter(a => a.assignment_id !== id))
    } catch (err: any) {
      alert(err.message || "Failed to delete assignment")
    }
  }

  // Review Modal State
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; id: number | null; status: string; note: string }>({
    isOpen: false,
    id: null,
    status: '',
    note: ''
  })

  const openReviewModal = (id: number, status: string) => {
    setReviewModal({
      isOpen: true,
      id,
      status,
      note: status === 'approved' ? 'Request approved. Welcome to the system!' : 'Request rejected for administrative reasons.'
    });
  }

  const submitReview = async () => {
    const { id, status, note } = reviewModal;
    if (!id) return;
    
    if (status === 'rejected' && (!note || !note.trim())) {
      alert("A review note is mandatory when rejecting a request.");
      return;
    }

    setSubmitting(true);
    try {
      await adminService.reviewRequest(id, status, note);
      setAccessRequests(prev => prev.filter(r => r.id !== id));
      setReviewModal({ isOpen: false, id: null, status: '', note: '' });
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading Dashboard...</div>

  const roleData = [
    { name: 'Inspectors', value: stats?.inspectors || 0, color: '#3b82f6' },
    { name: 'Authorities', value: stats?.authorities || 0, color: '#f59e0b' },
    { name: 'Admins', value: 1, color: '#ef4444' }
  ];

  const assignmentStatusData = [
    { name: 'Pending', count: stats?.assignments_pending || 0, fill: '#64748b' },
    { name: 'In Progress', count: stats?.assignments_in_progress || 0, fill: '#f59e0b' },
    { name: 'Completed', count: stats?.assignments_completed || 0, fill: '#22c55e' }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="font-heading text-3xl text-foreground mb-2">System Administration</h1>
              <p className="text-muted-foreground">Manage users, view assignments, and audit system activity.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/risk-lab">
                <Button variant="outline" className="border-copper-light/30 text-copper-light hover:bg-copper-light/5">
                  <FlaskConical className="w-4 h-4 mr-2" /> Risk Lab
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button>
                  <Users className="h-4 w-4 mr-2" /> Manage Users
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Active Users</div>
                <div className="text-3xl font-heading text-foreground"><CountUp end={stats?.active_users || 0} /></div>
              </div>
              <Users className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Pending Requests</div>
                <div className="text-3xl font-heading text-warning"><CountUp end={stats?.pending_requests || 0} /></div>
              </div>
              <Activity className="w-8 h-8 text-warning/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Active Alerts</div>
                <div className="text-3xl font-heading text-critical"><CountUp end={stats?.unread_alerts || 0} /></div>
              </div>
              <Shield className="w-8 h-8 text-critical/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Logs Today</div>
                <div className="text-3xl font-heading text-foreground"><CountUp end={stats?.logs_today || 0} /></div>
              </div>
              <FileText className="w-8 h-8 text-primary/30" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card border border-border p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <PieIcon className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">User Roles Distribution</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {roleData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                   {roleData.filter(d => d.value > 0).map(d => (
                     <div key={d.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}
                     </div>
                   ))}
                </div>
             </motion.div>

             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-card border border-border p-6 rounded-lg col-span-1 lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">Assignment Lifecycle Summary</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assignmentStatusData} layout="vertical" margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">Inspector Assignment Manager</h3>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {assignments.length} ACTIVE
                    </Badge>
                  </div>
                </div>

                {/* Assignment Form */}
                <div className="p-5 border-b border-border bg-muted/10">
                  <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Monument</label>
                      <select 
                        required
                        value={newAssignment.monumentId}
                        onChange={e => setNewAssignment({...newAssignment, monumentId: e.target.value})}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Monument...</option>
                        {monuments.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Inspector</label>
                      <select 
                        required
                        value={newAssignment.inspectorId}
                        onChange={e => setNewAssignment({...newAssignment, inspectorId: e.target.value})}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">Select Inspector...</option>
                        {inspectors.map(i => (
                          <option key={i.id} value={i.id}>{i.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Due Date</label>
                      <input 
                        required
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full">
                      <Plus className="w-4 h-4 mr-2" /> Assign Task
                    </Button>
                  </form>
                </div>

                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground text-[10px] uppercase tracking-widest sticky top-0">
                      <tr>
                        <th className="p-4 font-bold border-b border-border/50 text-primary">Monument</th>
                        <th className="p-4 font-bold border-b border-border/50 text-primary">Assigned Inspector</th>
                        <th className="p-4 font-bold border-b border-border/50 text-primary">Status</th>
                        <th className="p-4 font-bold border-b border-border/50 text-primary">Due Date</th>
                        <th className="p-4 font-bold border-b border-border/50 text-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assignments.map((a) => (
                        <tr key={a.assignment_id} className="hover:bg-muted/50 transition-colors group">
                          <td className="p-4 text-foreground/90 font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              {a.monument_name}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground">{a.inspector_name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Assigned by: {a.assigned_by_name}</div>
                          </td>
                          <td className="p-4">
                            <Badge className={`text-[10px] uppercase font-bold ${
                              a.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              a.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`} variant="outline">
                              {a.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(a.due_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteAssignment(a.assignment_id)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                            No assignments currently active. Use the form above to deploy inspectors.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

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
                          <td className="p-4 text-muted-foreground text-xs">{new Date(log.performed_at).toLocaleString()}</td>
                          <td className="p-4 font-medium text-foreground text-sm">{log.user_name || 'System'}</td>
                          <td className="p-4">
                            <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'CREATE' ? 'default' : 'secondary'} className="text-[10px]">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-foreground/80">{log.target_table} {log.target_id ? `(#${log.target_id})` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            <div className="space-y-6">
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
                            <Badge variant="outline" className="text-[10px] uppercase">Req: {req.role}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(req.submitted_at).toLocaleDateString()}</div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded text-sm text-muted-foreground/80 mb-4 border border-border/50">
                          <span className="block text-[10px] uppercase text-muted-foreground mb-1 font-bold">Org / Notes</span>
                          {req.organization} - {req.reason}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => openReviewModal(req.id, 'approved')} size="sm" className="flex-1 bg-safe hover:bg-safe/90 text-white">Approve</Button>
                          <Button onClick={() => openReviewModal(req.id, 'rejected')} size="sm" variant="destructive" className="flex-1">Reject</Button>
                        </div>
                      </div>
                    ))}
                    {accessRequests.length === 0 && <div className="p-8 text-center text-muted-foreground">No pending requests.</div>}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Review Request Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-md rounded-xl border border-border p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setReviewModal({ isOpen: false, id: null, status: '', note: '' })}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-heading mb-2 text-foreground capitalize">
              {reviewModal.status} Request
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Please provide a review note. An email will automatically be sent to the user notifying them of your decision.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                  Review Note {reviewModal.status === 'rejected' && <span className="text-red-500">*</span>}
                </label>
                <textarea 
                  className="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground focus:ring-1 min-h-[100px]" 
                  value={reviewModal.note}
                  onChange={(e) => setReviewModal(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Enter the message that will be sent to the user..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setReviewModal({ isOpen: false, id: null, status: '', note: '' })}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitReview}
                  disabled={submitting}
                  className={reviewModal.status === 'approved' ? 'bg-safe hover:bg-safe/90 text-white' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}
                >
                  Confirm {reviewModal.status}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
    </PageTransition>
  )
}
