import { useParams, Link } from 'react-router-dom';
import { MOCK_MONUMENTS } from '@/data/mockData';
import { ArrowLeft, Calendar, AlertTriangle, Activity, Droplets, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import CountUp from 'react-countup';
import { getRiskBgColor } from '@/utils/riskCalculation';

const AnnotatedImage = ({ monument }: { monument: typeof MOCK_MONUMENTS[0] }) => {
  const typeIcon: Record<string, string> = { erosion: '🪨', crack: '⚡', humidity: '💧', structural: '🏗️' };
  return (
    <div className="relative bg-gradient-to-br from-stone to-charcoal rounded-lg overflow-hidden aspect-video">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <span className="font-heading text-6xl text-sand">{monument.nameAr}</span>
      </div>
      {monument.annotations.map(ann => (
        <div
          key={ann.id}
          className="absolute group cursor-pointer"
          style={{ left: `${ann.position.x}%`, top: `${ann.position.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {/* Pulsing dot */}
          <div className={`h-4 w-4 rounded-full border-2 border-background ${ann.severity >= 4 ? 'bg-critical animate-pulse' : ann.severity >= 2 ? 'bg-warning' : 'bg-safe'}`} />
          {/* Arrow line */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 ${ann.severity >= 4 ? 'bg-critical' : ann.severity >= 2 ? 'bg-warning' : 'bg-safe'}`} />
          {/* Tooltip */}
          <div className="absolute top-[calc(100%+28px)] left-1/2 -translate-x-1/2 bg-charcoal/95 border border-border rounded-lg p-3 min-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <span>{typeIcon[ann.type] || '📍'}</span>
              <span className="text-sand text-xs font-medium capitalize">{ann.type}</span>
              <span className="ml-auto text-xs text-muted-foreground">Severity: {ann.severity}/5</span>
            </div>
            <p className="text-sand/80 text-xs">{ann.label}</p>
            <p className="text-sand/60 text-xs mt-1">{ann.details}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const RiskGauge = ({ score, level }: { score: number; level: string }) => {
  const color = level === 'safe' ? '#22C55E' : level === 'warning' ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-foreground"><CountUp end={score} duration={1.5} /></span>
        <span className="text-xs text-muted-foreground capitalize">{level}</span>
      </div>
    </div>
  );
};

const MonumentDetail = () => {
  const { id } = useParams();
  const monument = MOCK_MONUMENTS.find(m => m.id === id);

  if (!monument) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl text-foreground mb-4">Monument Not Found</h1>
          <Link to="/heritage" className="text-primary hover:underline">← Back to Explorer</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-6xl mx-auto">
        <Link to="/heritage" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Heritage Explorer
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="capitalize">{monument.type}</Badge>
              <span className="text-sm text-muted-foreground">{monument.era}</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground">{monument.name}</h1>
            <p className="text-muted-foreground font-heading text-lg mt-1">{monument.nameAr}</p>
          </div>
          <RiskGauge score={monument.riskScore} level={monument.riskLevel} />
        </div>

        {/* Annotated Image */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-4">Vulnerability Map</h2>
          <AnnotatedImage monument={monument} />
          <p className="text-xs text-muted-foreground mt-2">Hover over markers to see vulnerability details. Marker color indicates severity.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-lg text-foreground mb-3">Historical Context</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{monument.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <span className="text-xs text-muted-foreground">Construction Year</span>
                  <div className="font-mono text-foreground">{monument.constructionYear}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Last Inspection</span>
                  <div className="font-mono text-foreground">{monument.lastInspection}</div>
                </div>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="font-heading text-lg text-foreground mb-3">Risk Factor Summary</h2>
              <div className="space-y-3">
                {monument.annotations.map(ann => (
                  <div key={ann.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${ann.severity >= 4 ? 'bg-critical' : ann.severity >= 2 ? 'bg-warning' : 'bg-safe'}`} />
                    <span className="text-sm text-foreground flex-1 capitalize">{ann.type}: {ann.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{ann.severity}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inspection History */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-heading text-lg text-foreground mb-4">Inspection Reports</h2>
            <div className="space-y-4">
              {monument.inspections.map(ins => (
                <div key={ins.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{ins.date}</span>
                    </div>
                    {ins.alertTriggered && <AlertTriangle className="h-4 w-4 text-critical" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Inspector: {ins.inspector}</p>
                  <p className="text-sm text-muted-foreground mb-3">{ins.notes}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" /> Humidity: <span className="font-mono">{ins.humidity}%</span></div>
                    <div className="flex items-center gap-1"><Activity className="h-3 w-3 text-warning" /> Cracks: <span className="font-mono">{ins.crackCount}</span></div>
                    <div className="flex items-center gap-1"><Mountain className="h-3 w-3 text-stone" /> Erosion: <span className="font-mono">{ins.erosionDepth}cm</span></div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${getRiskBgColor(ins.riskScore < 40 ? 'safe' : ins.riskScore < 70 ? 'warning' : 'critical')}`} />
                      Risk: <span className="font-mono">{ins.riskScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonumentDetail;
