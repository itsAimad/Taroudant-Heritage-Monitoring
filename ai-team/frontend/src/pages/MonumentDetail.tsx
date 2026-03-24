import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertTriangle, Activity, Droplets, Mountain, MapPin, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import CountUp from 'react-countup';
import { useAuth } from '@/context/AuthContext';
import { monumentService, Monument, Inspection, getRiskLevel } from '@/services/monumentService';

const riskGradient = {
  low: '#16a34a',
  medium: '#ca8a04',
  high: '#d97706',
  critical: '#dc2626',
};

const RiskGauge = ({ score, level }: { score: number; level: string }) => {
  const color = riskGradient[level as keyof typeof riskGradient] || riskGradient.low;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto sm:mx-0 shrink-0">
      <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(235,220,185,0.05)" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold text-sand-light"><CountUp end={score} duration={1.5} /></span>
        <span className="text-[9px] uppercase tracking-widest font-mono text-sand/40">{level} RISK</span>
      </div>
    </div>
  );
};

const MonumentDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [monument, setMonument] = useState<Monument | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const mon = await monumentService.getById(Number(id));
        if (!mon) {
          setError(true);
        } else {
          setMonument(mon);
          const ins = await monumentService.getInspections(Number(id));
          setInspections(ins);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0806] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-copper-light animate-spin" />
      </div>
    );
  }

  if (error || !monument) {
    return (
      <div className="min-h-screen bg-[#0a0806] pt-20 flex items-center justify-center">
        <div className="text-center bg-[#140e0a] border border-sand/10 rounded-xl p-8 max-w-sm">
          <AlertTriangle className="h-10 w-10 text-sand/30 mx-auto mb-4" />
          <h1 className="font-heading text-xl text-sand-light mb-2">Monument Not Found</h1>
          <p className="text-sand/50 text-sm mb-6">The artifact or structural section you are looking for does not exist or has been removed from the registry.</p>
          <Link to="/monuments" className="inline-flex items-center text-sm uppercase tracking-wider font-mono text-copper-light hover:text-copper-light/80">← Back to Catalogue</Link>
        </div>
      </div>
    );
  }

  const currentRisk = monument.risk_level ?? getRiskLevel(monument.vulnerability_score);

  return (
    <div className="min-h-screen bg-[#0a0806] pt-24 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <Link to="/monuments" className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-sand/40 hover:text-copper-light transition-colors mb-10">
          <ArrowLeft className="h-4 w-4" /> Back to Catalogue
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-sand/10 pb-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-copper-light/10 text-copper-light border border-copper-light/20 text-[10px] uppercase font-mono tracking-widest hover:bg-copper-light/20">
                {monument.type || 'Monument'}
              </Badge>
              <span className="text-[10px] uppercase font-mono tracking-widest text-sand/30 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {monument.city}
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl text-sand-light leading-tight">{monument.name}</h1>
            <p className="text-sand/40 font-mono text-[11px] uppercase tracking-widest mt-4">
              EST. {monument.construction_year || 'Unknown'} · STATUS: <span className="text-sand/70">{monument.status}</span>
            </p>
          </div>
          
          <div className="bg-[#140e0a] border border-sand/5 rounded-2xl p-6 shadow-xl flex items-center justify-between gap-8 sm:min-w-[320px]">
            <RiskGauge score={monument.vulnerability_score || 0} level={currentRisk} />
            <div className="flex flex-col gap-4 flex-1">
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-widest text-sand/30 mb-0.5">Last Inspection</div>
                <div className="text-sm text-sand/80 font-medium">{monument.last_inspection ? new Date(monument.last_inspection).toLocaleDateString() : 'Never'}</div>
              </div>
              <div className="h-px w-full bg-sand/10" />
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-widest text-sand/30 mb-0.5">Total Inspections</div>
                <div className="text-sm text-sand/80 font-medium">{inspections.length} logs</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 xl:gap-12">
          {/* Left Column: Info */}
          <div className="space-y-10">
            {/* Description Area */}
            <div className="bg-[#140e0a] border border-sand/5 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-copper-light/5 rounded-bl-[100%] pointer-events-none" />
              <h2 className="font-heading text-2xl text-sand-light mb-6 flex items-center gap-3 relative z-10">
                <span className="w-6 h-px bg-copper-light/50" />
                Structural Context
              </h2>
              <div className="prose prose-sm prose-invert max-w-none text-sand/60 leading-relaxed text-[15px] relative z-10">
                {monument.description ? (
                  <p>{monument.description}</p>
                ) : (
                  <p className="italic opacity-60">No detailed structural history available for this artifact.</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 pt-8 border-t border-sand/5 relative z-10">
                {[
                  { label: "City", val: monument.city },
                  { label: "Location Profile", val: monument.location },
                  { label: "Coordinates", val: monument.latitude ? `${monument.latitude.toFixed(4)}, ${monument.longitude?.toFixed(4)}` : 'Pending mapping' },
                  { label: "Alerts Triggered", val: inspections.filter(i => i.alert_triggered).length.toString() }
                ].map(stat => (
                  <div key={stat.label}>
                    <span className="text-[9px] uppercase font-mono tracking-wider text-sand/30 block mb-1.5">{stat.label}</span>
                    <span className="text-sm text-sand-light truncate block" title={String(stat.val)}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visualizer Placeholder */}
            <div className="h-64 sm:h-80 bg-gradient-to-br from-[#1c140e] to-[#0a0806] rounded-2xl border border-sand/10 relative overflow-hidden group">
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                <MapPin className="h-10 w-10 text-copper-light mb-4 drop-shadow-md" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-sand/60 border border-sand/10 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md">Tactical View Unavailable</span>
              </div>
            </div>
          </div>

          {/* Right Column: Inspections */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl text-sand-light flex items-center gap-3">
                <span className="w-6 h-px bg-copper-light/50" />
                Inspection Log
              </h2>
              
              {isAuthenticated && (
                <button title="Log New Inspection" className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-light/10 text-copper-light hover:bg-copper-light hover:text-charcoal transition-colors border border-copper-light/30">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {inspections.length === 0 ? (
              <div className="bg-[#140e0a] border border-sand/5 border-dashed rounded-xl p-8 text-center flex flex-col items-center">
                <Activity className="w-8 h-8 text-sand/20 mb-3" />
                <p className="text-[13px] text-sand/40">No field inspections logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inspections.map(ins => {
                  const insRisk = getRiskLevel(ins.risk_score);
                  const tone = insRisk === 'critical' ? 'text-red-400 border-red-900/40 bg-red-950/20' : insRisk === 'high' ? 'text-amber-400 border-amber-900/40 bg-amber-950/20' : insRisk === 'medium' ? 'text-yellow-400 border-yellow-900/40 bg-yellow-950/20' : 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20';

                  return (
                    <div key={ins.id} className="bg-[#140e0a] border border-sand/10 rounded-xl p-5 hover:border-copper-light/20 transition-colors shadow-lg shadow-black/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md border ${tone}`}>
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[13px] text-sand-light font-medium">{new Date(ins.date).toLocaleDateString()}</div>
                            <div className="text-[9px] uppercase font-mono tracking-wider text-sand/30 mt-0.5">Inspector ID: {ins.inspector_id}</div>
                          </div>
                        </div>
                        {ins.alert_triggered && (
                          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-mono text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-1 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            Alert
                          </div>
                        )}
                      </div>

                      <p className="text-[12px] text-sand/60 mb-5 leading-relaxed bg-black/20 p-3.5 rounded-md border border-sand/5">{ins.notes || 'No notes provided.'}</p>
                      
                      <div className="grid grid-cols-4 gap-2 border-t border-sand/10 pt-4">
                        <div className="text-center">
                          <Droplets className="h-3.5 w-3.5 text-blue-400 mx-auto mb-2 opacity-70" />
                          <div className="text-[9px] font-mono tracking-wider text-sand/40 uppercase mb-0.5">Humidity</div>
                          <div className="text-xs text-sand font-medium">{ins.humidity}%</div>
                        </div>
                        <div className="text-center">
                          <Activity className="h-3.5 w-3.5 text-amber-500 mx-auto mb-2 opacity-70" />
                          <div className="text-[9px] font-mono tracking-wider text-sand/40 uppercase mb-0.5">Cracks</div>
                          <div className="text-xs text-sand font-medium">{ins.crack_count}</div>
                        </div>
                        <div className="text-center">
                          <Mountain className="h-3.5 w-3.5 text-sand/60 mx-auto mb-2 opacity-70" />
                          <div className="text-[9px] font-mono tracking-wider text-sand/40 uppercase mb-0.5">Erosion</div>
                          <div className="text-xs text-sand font-medium">{ins.erosion_depth}cm</div>
                        </div>
                        <div className="text-center">
                          <div className={`h-4 w-4 flex items-center justify-center rounded-sm mx-auto mb-1.5 border text-[8px] font-mono font-bold ${tone}`}>R</div>
                          <div className="text-[9px] font-mono tracking-wider text-sand/40 uppercase mb-0.5">Score</div>
                          <div className={`text-xs font-medium ${insRisk === 'critical' ? 'text-red-400' : insRisk === 'high' ? 'text-amber-400' : insRisk === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>{ins.risk_score}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {isAuthenticated && (
              <button className="w-full py-3.5 mt-2 rounded-xl border border-dashed border-copper-light/30 text-copper-light/80 text-[11px] font-mono tracking-wider uppercase hover:border-copper-light hover:text-copper-light hover:bg-copper-light/5 transition-all text-center">
                Log New Inspection &rarr;
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MonumentDetail;
