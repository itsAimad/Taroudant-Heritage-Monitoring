import { useState, useEffect } from 'react'
import { inspectionService, Inspection } from '../../services/inspectionService'
import { useAuth } from '../../context/AuthContext'
import PageTransition from '../../components/ui/PageTransition'
import { Plus, Search, Calendar, MapPin, ChevronRight, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export default function InspectorDashboard() {
  const { user } = useAuth()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInspections()
  }, [])

  const fetchInspections = async () => {
    try {
      const data = await inspectionService.getAll()
      setInspections(data.results || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-safe/20 text-safe border-safe/50'
      case 'in_progress': return 'bg-warning/20 text-warning border-warning/50'
      case 'pending': return 'bg-muted text-muted-foreground border-border'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (loading) return <div className="min-h-screen pt-32 text-center text-muted-foreground">Loading Inspections...</div>

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-heading text-foreground mb-2">My Field Inspections</h1>
              <p className="text-muted-foreground">Welcome back, {user?.full_name}. Here are your assigned and tracked inspections.</p>
            </div>
            <Link to="/inspect/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" /> New Inspection
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1 bg-card border border-border rounded-md px-3 py-2 flex items-center">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <input type="text" placeholder="Search by monument or ID..." className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground" />
                </div>
                <Button variant="outline"><Calendar className="w-4 h-4 mr-2" /> Filter</Button>
              </div>

              {inspections.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Inspections Found</h3>
                  <p className="text-muted-foreground mb-6">You haven't conducted any inspections yet.</p>
                  <Link to="/inspect/new">
                    <Button variant="outline">Start an Inspection</Button>
                  </Link>
                </div>
              ) : (
                inspections.map((insp: any) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={insp.inspection_id} className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors group">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] uppercase text-primary font-bold">ID</span>
                        <span className="text-sm text-foreground font-heading">{insp.inspection_id}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-1 group-hover:text-primary transition-colors">{insp.monument_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {insp.location || 'Unknown Location'}</span>
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(insp.inspection_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-muted-foreground mb-1 font-bold">Status</div>
                        <Badge variant="outline" className={`${getStatusColor(insp.status)} capitalize text-[10px]`}>
                          {insp.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Link to={`/inspect/${insp.inspection_id}`}>
                        <Button variant="ghost" size="icon" className="group-hover:bg-primary group-hover:text-primary-foreground">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Panel */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wider">Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Inspections</div>
                    <div className="text-2xl font-heading text-foreground">{inspections.length}</div>
                  </div>
                  <div className="h-px bg-border w-full"></div>
                  <div>
                    <div className="text-xs text-warning mb-1">In Progress</div>
                    <div className="text-2xl font-heading text-foreground">{inspections.filter(i => i.status === 'in_progress').length}</div>
                  </div>
                  <div className="h-px bg-border w-full"></div>
                  <div>
                    <div className="text-xs text-safe mb-1">Completed</div>
                    <div className="text-2xl font-heading text-foreground">{inspections.filter(i => i.status === 'completed').length}</div>
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
