import { useState } from 'react';
import { calculateRiskIndex, type RiskParams } from '@/utils/riskCalculation';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { MOCK_MONUMENTS } from '@/data/mockData';
import { Bell, AlertTriangle, CheckCircle } from 'lucide-react';

const RiskLab = () => {
  const [params, setParams] = useState<RiskParams>({
    age: 450,
    humidity: 50,
    crackSeverity: 1,
    erosionDepth: 5,
    seismicActivity: false,
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const result = calculateRiskIndex(params);
  const gaugeColor = result.level === 'safe' ? '#22C55E' : result.level === 'warning' ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (result.riskIndex / 100) * circumference;

  const alertThreshold = 70;
  const alertTriggered = result.riskIndex >= alertThreshold;

  return (
    <div className="min-h-screen bg-background pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-foreground">Risk Monitoring Lab</h1>
          <p className="text-muted-foreground mt-1">Interactive risk assessment simulation</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="font-heading text-xl text-foreground">Input Parameters</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Monument Age (years)</Label>
                  <span className="font-mono text-sm text-primary">{params.age}</span>
                </div>
                <Slider value={[params.age]} onValueChange={([v]) => setParams(p => ({ ...p, age: v }))} min={50} max={600} step={10} />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Humidity Level (%)</Label>
                  <span className="font-mono text-sm text-primary">{params.humidity}%</span>
                </div>
                <Slider value={[params.humidity]} onValueChange={([v]) => setParams(p => ({ ...p, humidity: v }))} min={0} max={100} step={1} />
              </div>

              <div>
                <Label className="mb-2 block">Crack Severity</Label>
                <Select value={String(params.crackSeverity)} onValueChange={v => setParams(p => ({ ...p, crackSeverity: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None (0)</SelectItem>
                    <SelectItem value="1">Minor (1)</SelectItem>
                    <SelectItem value="2">Moderate (2)</SelectItem>
                    <SelectItem value="3">Severe (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Erosion Depth (cm)</Label>
                  <span className="font-mono text-sm text-primary">{params.erosionDepth}cm</span>
                </div>
                <Slider value={[params.erosionDepth]} onValueChange={([v]) => setParams(p => ({ ...p, erosionDepth: v }))} min={0} max={50} step={0.5} />
              </div>

              <div className="flex items-center justify-between">
                <Label>Seismic Activity</Label>
                <Switch checked={params.seismicActivity} onCheckedChange={v => setParams(p => ({ ...p, seismicActivity: v }))} />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Gauge */}
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h2 className="font-heading text-xl text-foreground mb-4">Risk Index</h2>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" stroke={gaugeColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-bold text-foreground"><CountUp end={result.riskIndex} duration={0.5} preserveValue /></span>
                  <span className="text-xs text-muted-foreground capitalize">{result.level}</span>
                </div>
              </div>

              {/* Alert simulation */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${alertTriggered ? 'bg-critical/10 text-critical' : 'bg-safe/10 text-safe'}`}>
                {alertTriggered ? <><Bell className="h-4 w-4 animate-pulse" /> Alert Triggered!</> : <><CheckCircle className="h-4 w-4" /> Within Safe Range</>}
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-heading text-lg text-foreground mb-4">Calculation Breakdown</h2>
              <div className="font-mono text-xs text-muted-foreground mb-4 bg-muted/50 p-3 rounded">
                Risk = (Age × 0.25) + (Humidity × 0.30) + (Cracks × 0.25) + (Erosion × 0.20) + Seismic
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Age Factor', value: result.breakdown.age, max: 25, weight: '25%' },
                  { label: 'Humidity Factor', value: result.breakdown.humidity, max: 30, weight: '30%' },
                  { label: 'Crack Factor', value: result.breakdown.cracks, max: 25, weight: '25%' },
                  { label: 'Erosion Factor', value: result.breakdown.erosion, max: 20, weight: '20%' },
                  { label: 'Seismic Bonus', value: result.breakdown.seismic, max: 10, weight: '+10' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-28 flex-shrink-0">{f.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${(f.value / f.max) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground w-10 text-right">{f.value}</span>
                    <span className="font-mono text-xs text-muted-foreground/50 w-8">{f.weight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-heading text-foreground">Total Risk Index</span>
                <span className="font-mono text-2xl font-bold" style={{ color: gaugeColor }}>{result.riskIndex}</span>
              </div>
            </div>

            {/* Threshold */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-heading text-lg text-foreground mb-3">Alert Threshold</h2>
              <div className="relative h-4 bg-gradient-to-r from-safe via-warning to-critical rounded-full overflow-visible">
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-6 w-1 bg-foreground rounded-full"
                  animate={{ left: `${result.riskIndex}%` }}
                  transition={{ duration: 0.5 }}
                />
                <div className="absolute top-1/2 -translate-y-1/2 h-8 w-0.5 bg-foreground/30" style={{ left: `${alertThreshold}%` }} />
                <span className="absolute -top-5 text-xs text-muted-foreground" style={{ left: `${alertThreshold}%`, transform: 'translateX(-50%)' }}>Threshold: {alertThreshold}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h2 className="font-heading text-xl text-foreground mb-4">Monument Comparison</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_MONUMENTS.slice(0, 4).map(m => {
              const color = m.riskLevel === 'safe' ? '#22C55E' : m.riskLevel === 'warning' ? '#F59E0B' : '#EF4444';
              return (
                <div key={m.id} className="border border-border rounded-lg p-4 text-center">
                  <h3 className="font-heading text-sm text-foreground mb-2 truncate">{m.name}</h3>
                  <div className="font-mono text-2xl font-bold" style={{ color }}>{m.riskScore}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">{m.riskLevel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskLab;
