export interface User {
  username: string;
  password: string;
  role: 'admin' | 'inspector' | 'viewer';
  name: string;
  email: string;
  lastActive: string;
}

export interface Annotation {
  id: number;
  type: 'erosion' | 'crack' | 'humidity' | 'structural';
  position: { x: number; y: number };
  label: string;
  severity: number;
  details: string;
}

export interface Inspection {
  id: string;
  monumentId: string;
  date: string;
  inspector: string;
  humidity: number;
  crackCount: number;
  crackSeverity: number;
  erosionDepth: number;
  notes: string;
  riskScore: number;
  alertTriggered: boolean;
}

export interface Monument {
  id: string;
  name: string;
  nameAr: string;
  type: 'gate' | 'wall' | 'tower' | 'bastion';
  constructionYear: number;
  era: string;
  significance: string;
  description: string;
  riskScore: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  lastInspection: string;
  lat: number;
  lng: number;
  annotations: Annotation[];
  inspections: Inspection[];
}

export interface Alert {
  id: string;
  timestamp: string;
  monumentName: string;
  monumentId: string;
  riskLevel: 'warning' | 'critical';
  triggeredRule: string;
  notifiedTo: string;
  status: 'pending' | 'acknowledged' | 'resolved';
}

export const MOCK_USERS: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Dr. Hassan El Mansouri', email: 'h.mansouri@univ-taroudant.ma', lastActive: '2025-12-15' },
  { username: 'inspector', password: 'inspector123', role: 'inspector', name: 'Fatima Zahra Benali', email: 'f.benali@heritage.ma', lastActive: '2025-12-14' },
  { username: 'viewer', password: 'viewer123', role: 'viewer', name: 'Ahmed Tazi', email: 'a.tazi@culture.gov.ma', lastActive: '2025-12-10' },
  { username: 'inspector2', password: 'inspector123', role: 'inspector', name: 'Youssef Amrani', email: 'y.amrani@heritage.ma', lastActive: '2025-12-13' },
];

export const MOCK_MONUMENTS: Monument[] = [
  {
    id: 'bab-el-kasbah',
    name: 'Bab El Kasbah',
    nameAr: 'باب القصبة',
    type: 'gate',
    constructionYear: 1528,
    era: 'Saadian Dynasty',
    significance: 'Main gateway to the Kasbah, featuring ornate horseshoe arches and defensive battlements. A masterpiece of Saadian military architecture.',
    description: 'The principal entrance to the fortified Kasbah quarter, Bab El Kasbah stands as one of the most imposing gates of Taroudant. Its massive stone walls and intricate geometric decorations reflect the peak of Saadian architectural prowess.',
    riskScore: 72,
    riskLevel: 'warning',
    lastInspection: '2025-11-20',
    lat: 30.4706,
    lng: -8.8769,
    annotations: [
      { id: 1, type: 'erosion', position: { x: 35, y: 65 }, label: 'Surface erosion — 4cm depth', severity: 3, details: 'Moderate surface erosion on lower stonework caused by water runoff. Requires waterproofing treatment.' },
      { id: 2, type: 'crack', position: { x: 68, y: 28 }, label: 'Vertical crack — 22cm', severity: 4, details: 'Significant vertical crack in the upper arch. Likely caused by seismic micro-movements. Structural monitoring recommended.' },
      { id: 3, type: 'humidity', position: { x: 20, y: 80 }, label: 'High moisture zone', severity: 2, details: 'Elevated moisture levels detected at base level. Drainage improvements needed.' },
    ],
    inspections: [
      { id: 'ins-001', monumentId: 'bab-el-kasbah', date: '2025-11-20', inspector: 'Fatima Zahra Benali', humidity: 68, crackCount: 3, crackSeverity: 2, erosionDepth: 4, notes: 'Increased humidity since last inspection. New crack detected in upper arch.', riskScore: 72, alertTriggered: true },
      { id: 'ins-002', monumentId: 'bab-el-kasbah', date: '2025-08-15', inspector: 'Youssef Amrani', humidity: 45, crackCount: 2, crackSeverity: 2, erosionDepth: 3.5, notes: 'Stable condition. Minor erosion progression.', riskScore: 58, alertTriggered: false },
      { id: 'ins-003', monumentId: 'bab-el-kasbah', date: '2025-03-10', inspector: 'Fatima Zahra Benali', humidity: 52, crackCount: 2, crackSeverity: 1, erosionDepth: 3, notes: 'Routine inspection. Conditions within acceptable range.', riskScore: 52, alertTriggered: false },
    ],
  },
  {
    id: 'bab-el-khemis',
    name: 'Bab El Khemis',
    nameAr: 'باب الخميس',
    type: 'gate',
    constructionYear: 1540,
    era: 'Saadian Dynasty',
    significance: 'Northern gate leading to the Thursday market. Features distinctive twin towers and arrow slits.',
    description: 'Named after the Thursday market (souk) held outside its walls, Bab El Khemis served as a major commercial gateway. Its twin defensive towers provided strategic oversight of the northern approach.',
    riskScore: 45,
    riskLevel: 'safe',
    lastInspection: '2025-10-05',
    lat: 30.4750,
    lng: -8.8800,
    annotations: [
      { id: 1, type: 'erosion', position: { x: 50, y: 70 }, label: 'Minor surface wear', severity: 1, details: 'Light surface erosion consistent with age. No immediate action required.' },
    ],
    inspections: [
      { id: 'ins-004', monumentId: 'bab-el-khemis', date: '2025-10-05', inspector: 'Youssef Amrani', humidity: 35, crackCount: 0, crackSeverity: 0, erosionDepth: 1.5, notes: 'Excellent condition after recent restoration.', riskScore: 45, alertTriggered: false },
    ],
  },
  {
    id: 'borj-south',
    name: 'Borj Sud (South Tower)',
    nameAr: 'برج الجنوب',
    type: 'tower',
    constructionYear: 1585,
    era: 'Saadian Dynasty',
    significance: 'Defensive watchtower offering panoramic views over the Souss Valley. Key military installation.',
    description: 'Borj Sud commands a strategic position on the southern rampart wall. Originally equipped with cannons, it provided essential defense against approaches from the Souss plain.',
    riskScore: 85,
    riskLevel: 'critical',
    lastInspection: '2025-12-01',
    lat: 30.4680,
    lng: -8.8750,
    annotations: [
      { id: 1, type: 'structural', position: { x: 40, y: 45 }, label: 'Structural weakness — load-bearing wall', severity: 5, details: 'Critical structural compromise in the main load-bearing wall. Urgent reinforcement needed.' },
      { id: 2, type: 'crack', position: { x: 60, y: 35 }, label: 'Major diagonal crack — 45cm', severity: 5, details: 'Large diagonal crack indicating potential foundation settling. Emergency assessment required.' },
      { id: 3, type: 'erosion', position: { x: 25, y: 75 }, label: 'Deep erosion — 8cm', severity: 4, details: 'Severe erosion at base level. Stonework is significantly degraded.' },
      { id: 4, type: 'humidity', position: { x: 75, y: 60 }, label: 'Water infiltration', severity: 4, details: 'Active water infiltration through compromised mortar joints. Causing accelerated deterioration.' },
    ],
    inspections: [
      { id: 'ins-005', monumentId: 'borj-south', date: '2025-12-01', inspector: 'Fatima Zahra Benali', humidity: 82, crackCount: 5, crackSeverity: 3, erosionDepth: 8, notes: 'CRITICAL: Major structural concerns. Recommend immediate stabilization.', riskScore: 85, alertTriggered: true },
      { id: 'ins-006', monumentId: 'borj-south', date: '2025-09-15', inspector: 'Fatima Zahra Benali', humidity: 75, crackCount: 4, crackSeverity: 3, erosionDepth: 7, notes: 'Deterioration accelerating. Water damage worsening.', riskScore: 78, alertTriggered: true },
    ],
  },
  {
    id: 'rampart-west',
    name: 'Western Rampart Section',
    nameAr: 'السور الغربي',
    type: 'wall',
    constructionYear: 1510,
    era: 'Saadian Dynasty',
    significance: 'Longest continuous section of the city wall, stretching 1.2km with original crenellations intact.',
    description: 'The western rampart represents the most extensive surviving section of Taroudant\'s defensive walls. Its continuous stretch of pisé and stone construction offers invaluable insights into medieval Moroccan fortification techniques.',
    riskScore: 62,
    riskLevel: 'warning',
    lastInspection: '2025-11-10',
    lat: 30.4720,
    lng: -8.8830,
    annotations: [
      { id: 1, type: 'erosion', position: { x: 30, y: 55 }, label: 'Pisé erosion — 6cm', severity: 3, details: 'Traditional pisé construction showing expected weathering. Lime render reapplication recommended.' },
      { id: 2, type: 'crack', position: { x: 55, y: 40 }, label: 'Horizontal crack — 30cm', severity: 3, details: 'Horizontal crack likely from thermal expansion. Monitor for progression.' },
    ],
    inspections: [
      { id: 'ins-007', monumentId: 'rampart-west', date: '2025-11-10', inspector: 'Youssef Amrani', humidity: 55, crackCount: 4, crackSeverity: 2, erosionDepth: 6, notes: 'Moderate condition. Pisé sections need lime render renewal.', riskScore: 62, alertTriggered: false },
    ],
  },
  {
    id: 'bab-zourgane',
    name: 'Bab Zourgane',
    nameAr: 'باب زرقان',
    type: 'gate',
    constructionYear: 1520,
    era: 'Saadian Dynasty',
    significance: 'Eastern gate renowned for its blue-tinted stonework and elaborate decorative program.',
    description: 'Bab Zourgane derives its name from the distinctive bluish tint of its local stone. The gate features some of the finest carved decorative elements in the city walls.',
    riskScore: 38,
    riskLevel: 'safe',
    lastInspection: '2025-10-28',
    lat: 30.4710,
    lng: -8.8700,
    annotations: [
      { id: 1, type: 'erosion', position: { x: 45, y: 60 }, label: 'Light weathering', severity: 1, details: 'Natural weathering consistent with material age. Well-preserved overall.' },
    ],
    inspections: [
      { id: 'ins-008', monumentId: 'bab-zourgane', date: '2025-10-28', inspector: 'Fatima Zahra Benali', humidity: 30, crackCount: 1, crackSeverity: 1, erosionDepth: 2, notes: 'Good condition. Recent restoration work holding well.', riskScore: 38, alertTriggered: false },
    ],
  },
  {
    id: 'borj-north',
    name: 'Borj Nord (North Tower)',
    nameAr: 'برج الشمال',
    type: 'tower',
    constructionYear: 1590,
    era: 'Saadian Dynasty',
    significance: 'Northern defensive tower with intact gun emplacements. Major historical military site.',
    description: 'Borj Nord anchors the northern defenses of Taroudant. Its well-preserved gun emplacements and ammunition stores provide crucial evidence of 16th-century military technology.',
    riskScore: 55,
    riskLevel: 'warning',
    lastInspection: '2025-11-25',
    lat: 30.4760,
    lng: -8.8780,
    annotations: [
      { id: 1, type: 'crack', position: { x: 50, y: 30 }, label: 'Hairline cracks in vaulting', severity: 2, details: 'Multiple hairline cracks in the main vault. Monitoring recommended.' },
      { id: 2, type: 'humidity', position: { x: 35, y: 70 }, label: 'Rising damp', severity: 3, details: 'Rising damp affecting lower 2m of interior walls. Damp-proof course needed.' },
    ],
    inspections: [
      { id: 'ins-009', monumentId: 'borj-north', date: '2025-11-25', inspector: 'Youssef Amrani', humidity: 60, crackCount: 3, crackSeverity: 2, erosionDepth: 3, notes: 'Moderate concerns with rising damp. Vault cracks stable.', riskScore: 55, alertTriggered: false },
    ],
  },
  {
    id: 'rampart-east',
    name: 'Eastern Rampart Section',
    nameAr: 'السور الشرقي',
    type: 'wall',
    constructionYear: 1515,
    era: 'Saadian Dynasty',
    significance: 'Features unique alternating stone and pisé construction technique not seen elsewhere.',
    description: 'The eastern rampart showcases a distinctive construction method alternating courses of cut stone with compacted earth (pisé). This hybrid technique demonstrates the adaptability of Saadian builders.',
    riskScore: 48,
    riskLevel: 'safe',
    lastInspection: '2025-09-20',
    lat: 30.4715,
    lng: -8.8690,
    annotations: [
      { id: 1, type: 'erosion', position: { x: 60, y: 50 }, label: 'Pisé layer erosion — 3cm', severity: 2, details: 'Pisé courses showing moderate erosion. Protective rendering advised.' },
    ],
    inspections: [
      { id: 'ins-010', monumentId: 'rampart-east', date: '2025-09-20', inspector: 'Fatima Zahra Benali', humidity: 40, crackCount: 1, crackSeverity: 1, erosionDepth: 3, notes: 'Generally stable. Pisé layers need attention before rainy season.', riskScore: 48, alertTriggered: false },
    ],
  },
  {
    id: 'bastion-southwest',
    name: 'Southwest Bastion',
    nameAr: 'حصن الجنوب الغربي',
    type: 'bastion',
    constructionYear: 1560,
    era: 'Saadian Dynasty',
    significance: 'Largest bastion in the fortification system. Features a unique pentagonal floor plan.',
    description: 'The Southwest Bastion represents the pinnacle of Taroudant\'s defensive engineering. Its pentagonal design maximized fields of fire while minimizing blind spots.',
    riskScore: 67,
    riskLevel: 'warning',
    lastInspection: '2025-11-05',
    lat: 30.4675,
    lng: -8.8840,
    annotations: [
      { id: 1, type: 'structural', position: { x: 40, y: 50 }, label: 'Corner settling', severity: 3, details: 'Southwest corner showing signs of differential settling. Monitoring required.' },
      { id: 2, type: 'erosion', position: { x: 65, y: 65 }, label: 'Mortar loss — extensive', severity: 3, details: 'Significant mortar loss between stone courses. Repointing urgently needed.' },
    ],
    inspections: [
      { id: 'ins-011', monumentId: 'bastion-southwest', date: '2025-11-05', inspector: 'Youssef Amrani', humidity: 58, crackCount: 2, crackSeverity: 2, erosionDepth: 5, notes: 'Corner settling progression noted. Repointing campaign recommended.', riskScore: 67, alertTriggered: false },
    ],
  },
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'alert-001', timestamp: '2025-12-01T14:30:00', monumentName: 'Borj Sud (South Tower)', monumentId: 'borj-south', riskLevel: 'critical', triggeredRule: 'Risk index exceeded 80 threshold', notifiedTo: 'admin@heritage.ma', status: 'acknowledged' },
  { id: 'alert-002', timestamp: '2025-11-20T09:15:00', monumentName: 'Bab El Kasbah', monumentId: 'bab-el-kasbah', riskLevel: 'warning', triggeredRule: 'Humidity above 65% detected', notifiedTo: 'inspector@heritage.ma', status: 'resolved' },
  { id: 'alert-003', timestamp: '2025-09-15T16:45:00', monumentName: 'Borj Sud (South Tower)', monumentId: 'borj-south', riskLevel: 'critical', triggeredRule: 'Risk index exceeded 75 threshold', notifiedTo: 'admin@heritage.ma', status: 'resolved' },
  { id: 'alert-004', timestamp: '2025-11-05T11:00:00', monumentName: 'Southwest Bastion', monumentId: 'bastion-southwest', riskLevel: 'warning', triggeredRule: 'Erosion depth exceeded 4cm', notifiedTo: 'inspector@heritage.ma', status: 'pending' },
  { id: 'alert-005', timestamp: '2025-12-10T08:20:00', monumentName: 'Borj Sud (South Tower)', monumentId: 'borj-south', riskLevel: 'critical', triggeredRule: 'Crack severity level 3 detected', notifiedTo: 'admin@heritage.ma', status: 'pending' },
];

export const RISK_HISTORY = [
  { month: 'Jan', babElKasbah: 48, borjSouth: 65, rampartWest: 55, average: 52 },
  { month: 'Feb', babElKasbah: 50, borjSouth: 67, rampartWest: 56, average: 53 },
  { month: 'Mar', babElKasbah: 52, borjSouth: 70, rampartWest: 58, average: 55 },
  { month: 'Apr', babElKasbah: 51, borjSouth: 69, rampartWest: 57, average: 54 },
  { month: 'May', babElKasbah: 53, borjSouth: 72, rampartWest: 58, average: 56 },
  { month: 'Jun', babElKasbah: 55, borjSouth: 74, rampartWest: 59, average: 57 },
  { month: 'Jul', babElKasbah: 58, borjSouth: 75, rampartWest: 60, average: 59 },
  { month: 'Aug', babElKasbah: 58, borjSouth: 76, rampartWest: 61, average: 60 },
  { month: 'Sep', babElKasbah: 60, borjSouth: 78, rampartWest: 62, average: 62 },
  { month: 'Oct', babElKasbah: 62, borjSouth: 80, rampartWest: 62, average: 63 },
  { month: 'Nov', babElKasbah: 68, borjSouth: 82, rampartWest: 62, average: 65 },
  { month: 'Dec', babElKasbah: 72, borjSouth: 85, rampartWest: 62, average: 67 },
];
