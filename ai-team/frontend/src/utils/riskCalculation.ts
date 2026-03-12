export interface RiskParams {
  age: number;
  humidity: number;
  crackSeverity: number; // 0-3
  erosionDepth: number;  // cm
  seismicActivity?: boolean;
}

export interface RiskResult {
  riskIndex: number;
  level: 'safe' | 'warning' | 'critical';
  breakdown: {
    age: number;
    humidity: number;
    cracks: number;
    erosion: number;
    seismic: number;
  };
}

export const calculateRiskIndex = (params: RiskParams): RiskResult => {
  const { age, humidity, crackSeverity, erosionDepth, seismicActivity = false } = params;

  const ageScore = Math.min((age / 500) * 25, 25);
  const humidityScore = Math.min((humidity / 100) * 30, 30);
  const crackScore = Math.min((crackSeverity / 3) * 25, 25);
  const erosionScore = Math.min((erosionDepth / 50) * 20, 20);
  const seismicScore = seismicActivity ? 10 : 0;

  const total = Math.min(ageScore + humidityScore + crackScore + erosionScore + seismicScore, 100);
  const riskIndex = Math.round(total);

  return {
    riskIndex,
    level: riskIndex < 40 ? 'safe' : riskIndex < 70 ? 'warning' : 'critical',
    breakdown: {
      age: Math.round(ageScore),
      humidity: Math.round(humidityScore),
      cracks: Math.round(crackScore),
      erosion: Math.round(erosionScore),
      seismic: Math.round(seismicScore),
    },
  };
};

export const getRiskColor = (level: string) => {
  switch (level) {
    case 'safe': return 'text-safe';
    case 'warning': return 'text-warning';
    case 'critical': return 'text-critical';
    default: return 'text-muted-foreground';
  }
};

export const getRiskBgColor = (level: string) => {
  switch (level) {
    case 'safe': return 'bg-safe';
    case 'warning': return 'bg-warning';
    case 'critical': return 'bg-critical';
    default: return 'bg-muted';
  }
};
