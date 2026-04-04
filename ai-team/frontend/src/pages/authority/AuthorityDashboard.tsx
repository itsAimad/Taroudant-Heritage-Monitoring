import { useState, useEffect } from 'react'
import { analyticsService } from '../../services/analyticsService'
import { notificationService, Notification } from '../../services/notificationService'
import { inspectionService } from '../../services/inspectionService'
import { useAuth } from '../../context/AuthContext'
import PageTransition from '../../components/ui/PageTransition'
import { ShieldAlert, Bell, FileText, Check, AlertTriangle, ChevronRight, Eye } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

export default function AuthorityDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [analyticsData, notifsData] = await Promise.all([
        analyticsService.get(),
        notificationService.getAll()
      ])
      setData(analyticsData)
      setNotifications(notifsData.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id)
      setNotifications(notifications.map(n =>
        n.notification_id === id ? { ...n, is_read: true } : n
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleAcknowledgeInspection = async (inspectionId: number) => {
    try {
      await inspectionService.acknowledge(inspectionId)
      setAcknowledgedIds(prev => new Set([...prev, inspectionId]))
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge')
    }
  }

  if (loading) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading Dashboard...</div>
  if (!data) return <div className="min-h-screen pt-32 text-center text-critical">Failed to load analytics.</div>

  const COLORS = {
    'critical': '#ef4444',
    'high': '#f59e0b',
    'medium': '#eab308',
    'low': '#22c55e',
    'none': '#78716c'
  }

  const riskData = data.risk_distribution.map((d: any) => ({
    name: d.risk_level || 'none',
    value: d.count
  }))

  const unreadNotifs = notifications.filter(n => !n.is_read)

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-heading text-foreground mb-2">Authority Overview</h1>
              <p className="text-muted-foreground">Welcome back, {user?.full_name}. Here is the current risk profile across the region.</p>
            </div>
          </div>

          {/* TOP ROW: SUMMARY STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Total Monuments</div>
                <div className="text-3xl font-heading text-foreground"><CountUp end={data.summary.total_monuments} /></div>
              </div>
              <ShieldAlert className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Inspections</div>
                <div className="text-3xl font-heading text-foreground"><CountUp end={data.summary.total_inspections} /></div>
              </div>
              <FileText className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase mb-1">Reports Generated</div>
                <div className="text-3xl font-heading text-foreground"><CountUp end={data.summary.total_reports} /></div>
              </div>
              <FileText className="w-8 h-8 text-primary/30" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`border p-6 rounded-lg flex items-center justify-between ${unreadNotifs.length > 0 ? 'bg-amber-950/20 border-warning/50' : 'bg-card border-border'
              }`}>
              <div>
                <div className={`text-xs font-medium tracking-wider uppercase mb-1 ${unreadNotifs.length > 0 ? 'text-warning/80' : 'text-muted-foreground'
                  }`}>Unread Alerts</div>
                <div className={`text-3xl font-heading ${unreadNotifs.length > 0 ? 'text-warning' : 'text-foreground'
                  }`}><CountUp end={unreadNotifs.length} /></div>
              </div>
              <Bell className={`w-8 h-8 ${unreadNotifs.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            </motion.div>
          </div>

          {/* MIDDLE ROW: CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-lg col-span-1">
              <h3 className="text-sm font-medium text-foreground mb-6">Current Risk Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'currentColor', borderRadius: '8px' }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Pie
                      data={riskData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
                {riskData.map((d: any) => (
                  <div key={d.name} className="flex items-center gap-1.5 capitalize font-medium">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (COLORS as any)[d.name] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card border border-border p-6 rounded-lg col-span-2">
              <h3 className="text-sm font-medium text-foreground mb-6">Inspection & Incident Trends (6M)</h3>
              <div className="h-64 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.inspections_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="total" name="Total Inspections" fill="#a36e4f" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="critical_count" name="Critical Findings" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* BOTTOM ROW: TOP VULNERABLE & NOTIFICATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border h-[72px] flex items-center bg-muted/30">
                <h3 className="text-sm font-medium text-foreground">Most Vulnerable Monuments</h3>
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                <div className="divide-y divide-border">
                  {data.most_vulnerable.map((m: any, idx: number) => (
                    <div key={idx} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-[15px]">{m.name}</div>
                          <div className="text-sm text-muted-foreground">{m.location}</div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div>
                          <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${m.risk_level === 'critical' ? 'text-critical' :
                              m.risk_level === 'high' ? 'text-warning' : 'text-yellow-500'
                            }`}>{m.risk_level}</div>
                          <div className="text-xl font-heading text-foreground">{m.total_score}<span className="text-xs text-muted-foreground">/100</span></div>
                        </div>
                        <Link to={`/monument/${m.monument_id}`} className="text-muted-foreground hover:text-primary transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-4 px-6 border-b border-border flex justify-between items-center h-[72px] bg-muted/30">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  Regional Alerts
                  {unreadNotifs.length > 0 && <Badge variant="destructive">{unreadNotifs.length}</Badge>}
                </h3>
                {unreadNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-auto max-h-[400px]">
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div key={n.notification_id} className={`p-5 transition-colors ${n.is_read ? 'opacity-60 hover:bg-muted/20' : 'bg-warning/5 hover:bg-warning/10'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`w-4 h-4 ${n.severity === 'critical' ? 'text-critical' : 'text-warning'
                              }`} />
                            <span className="text-xs tracking-wider text-muted-foreground">{new Date(n.sent_at).toLocaleString()}</span>
                            {!n.is_read && <div className="w-2 h-2 rounded-full bg-warning"></div>}
                          </div>
                          <p className="text-sm text-foreground font-medium mb-1">{n.monument_name}</p>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                          {/* Inspection action buttons */}
                          {n.triggered_by_inspection && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline"
                                onClick={() => navigate(`/inspection/${n.triggered_by_inspection}`)}
                                className="text-xs h-7">
                                <Eye className="w-3 h-3 mr-1" /> View Inspection
                              </Button>
                              {!acknowledgedIds.has(n.triggered_by_inspection) && (
                                <Button size="sm"
                                  onClick={() => handleAcknowledgeInspection(n.triggered_by_inspection!)}
                                  className="text-xs h-7 bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-900/50">
                                  <Check className="w-3 h-3 mr-1" /> Acknowledge
                                </Button>
                              )}
                              {acknowledgedIds.has(n.triggered_by_inspection) && (
                                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800/40">Acknowledged</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {!n.is_read && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkRead(n.notification_id)}>
                            <Check className="w-3 h-3 mr-1" /> Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">No alerts found.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}
