import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageTransition from '../../components/ui/PageTransition'
import { inspectionService, Inspection, Crack } from '../../services/inspectionService'
import { AlertTriangle, Check, ChevronRight, Activity, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export default function InspectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [cracks, setCracks] = useState<Crack[]>([])
  const [loading, setLoading] = useState(true)
  
  // Vulnerability Polling
  const [vulnScore, setVulnScore] = useState<number | null>(null)
  const [riskLevel, setRiskLevel] = useState<string>('none')

  // Crack Form
  const [newCrack, setNewCrack] = useState({ length_cm: 0, severity: 'medium', location_on_monument: '' })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const data = await inspectionService.getById(Number(id))
      setInspection(data)
      setCracks(data.cracks || [])
      setVulnScore(data.vulnerability_score)
      setRiskLevel(data.risk_level)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogCrack = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await inspectionService.logCrack({
        inspection_id: Number(id),
        location_on_monument: newCrack.location_on_monument,
        severity: newCrack.severity,
        length_cm: newCrack.length_cm
      })
      setNewCrack({ length_cm: 0, severity: 'medium', location_on_monument: '' })
      await fetchData() // refresh cracks AND new vuln score based on MySQL Trigger!
    } catch (err) {
      alert('Failed to log crack')
    }
  }

  const handleComplete = async () => {
    try {
      if(confirm('Are you sure? This will generate a final report.')) {
        await inspectionService.complete(Number(id))
        await inspectionService.generateReport({
          inspection_id: Number(id),
          monument_id: inspection.monument_id,
          title: `Final Report - ${inspection.monument_name}`
        })
        navigate('/dashboard')
      }
    } catch (err) {
      alert('Failed to complete inspection')
    }
  }

  if (loading || !inspection) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading...</div>

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground font-medium">
            <span onClick={() => navigate('/dashboard')} className="hover:text-primary cursor-pointer transition-colors">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Inspection #{inspection.inspection_id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Details & Crack Form */}
            <div className="lg:col-span-2 space-y-6">
              
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border p-8 rounded-lg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-heading text-foreground mb-2">{inspection.monument_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" /> Monument #{inspection.monument_id}
                    </div>
                  </div>
                  <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'} className={`${
                    inspection.status === 'completed' ? 'bg-safe text-white' : 'bg-warning/20 text-warning border-warning/50'
                  } uppercase tracking-wider text-[10px]`}>
                    {inspection.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="text-sm bg-muted/40 p-4 rounded-md border border-border/50 text-foreground/80 leading-relaxed mb-6">
                  {inspection.notes || 'No notes provided during creation.'}
                </div>
              </motion.div>

              {inspection.status === 'in_progress' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4 border-b border-border">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Log New Crack Finding
                    </h3>
                  </div>
                  <form onSubmit={handleLogCrack} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Length (cm)</label>
                        <input type="number" step="0.1" required value={newCrack.length_cm || ''} onChange={e => setNewCrack({...newCrack, length_cm: parseFloat(e.target.value)})} className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Severity</label>
                        <select required value={newCrack.severity} onChange={e => setNewCrack({...newCrack, severity: e.target.value})} className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:border-primary outline-none transition-colors">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Location Description</label>
                      <input type="text" required placeholder="e.g. North wall, near base" value={newCrack.location_on_monument} onChange={e => setNewCrack({...newCrack, location_on_monument: e.target.value})} className="w-full bg-background border border-border rounded p-2 text-sm text-foreground focus:border-primary outline-none transition-colors" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit">
                        <Plus className="w-4 h-4 mr-2" />
                        Log Finding
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 border-b border-border flex justify-between items-center">
                  <h3 className="text-sm font-medium text-foreground">Detailed Findings ({cracks.length})</h3>
                </div>
                <div className="divide-y divide-border">
                  {cracks.map((c, i) => (
                    <div key={i} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="text-sm text-foreground font-medium mb-1">{c.location_on_monument}</div>
                        <div className="text-xs text-muted-foreground">Logged on {new Date(c.detected_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-background border border-border rounded px-3 py-1.5 text-center min-w-[70px]">
                          <div className="text-[10px] uppercase text-muted-foreground mb-0.5 font-bold">Length</div>
                          <div className="text-sm font-mono text-foreground">{c.length_cm || '-'} cm</div>
                        </div>
                        <div className={`border rounded px-3 py-1.5 text-center min-w-[70px] ${
                          c.severity === 'critical' ? 'bg-critical/10 border-critical/50 text-critical' :
                          c.severity === 'high' ? 'bg-warning/10 border-warning/50 text-warning' :
                          c.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' :
                          'bg-safe/10 border-safe/50 text-safe'
                        }`}>
                          <div className="text-[10px] uppercase opacity-70 mb-0.5 font-bold">Severity</div>
                          <div className="text-sm font-medium capitalize">{c.severity}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cracks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">No cracks logged yet.</div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Vuln Score & Actions */}
            <div className="space-y-6">
              
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`border p-8 rounded-lg flex flex-col items-center justify-center text-center ${
                riskLevel === 'critical' ? 'bg-critical/5 border-critical/30' :
                riskLevel === 'high' ? 'bg-warning/5 border-warning/30' :
                riskLevel === 'medium' ? 'bg-yellow-500/5 border-yellow-500/30' :
                'bg-safe/5 border-safe/30'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Live Vulnerability Score</h3>
                
                <div className={`relative w-40 h-40 rounded-full flex items-center justify-center mb-6 border-4 shadow-lg ${
                  riskLevel === 'critical' ? 'border-critical shadow-critical/20 text-critical' :
                  riskLevel === 'high' ? 'border-warning shadow-warning/20 text-warning' :
                  riskLevel === 'medium' ? 'border-yellow-500 shadow-yellow-500/20 text-yellow-500' :
                  'border-safe shadow-safe/20 text-safe'
                }`}>
                  <div className="absolute inset-2 rounded-full border border-current opacity-20 border-dashed" />
                  <div>
                    <span className="text-5xl font-heading">{vulnScore !== null ? vulnScore.toFixed(0) : '--'}</span>
                    <span className="text-sm font-bold opacity-70">/100</span>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                  riskLevel === 'critical' ? 'bg-critical text-white' :
                  riskLevel === 'high' ? 'bg-warning text-white' :
                  riskLevel === 'medium' ? 'bg-yellow-500 text-white' :
                  'bg-safe text-white'
                }`}>
                  {riskLevel === 'critical' && <AlertTriangle className="w-4 h-4" />}
                  {riskLevel} RISK
                </div>
                
                <p className="text-[11px] text-muted-foreground mt-6 max-w-[200px]">
                  * Score is continuously recalculated via database triggers upon logging findings.
                </p>
              </motion.div>

              {inspection.status === 'in_progress' && (
                <div className="bg-card border border-border p-6 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-foreground mb-2">Finalize Inspection</h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    Completing this inspection will freeze findings, compute the final score, and generate a secure report.
                  </p>
                  <Button onClick={handleComplete} className="w-full bg-safe hover:bg-safe/90 text-white font-bold py-6">
                    <Check className="w-5 h-5 mr-2" /> Complete & Generate Report
                  </Button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}
// Note: We need a small fix because I accidentally imported `Plus` without defining it in lucide-react in the new file.
