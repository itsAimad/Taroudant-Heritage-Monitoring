export interface Monument {
  id: string;
  name: string;
  nameAr: string;
  type: 'gate' | 'wall' | 'tower' | 'medina';
  coordinates: [number, number];
  vulnerabilityScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  lastInspection: string;
  description: string;
  builtCentury: string;
  dynasty: string;
  inspectionCount: number;
  activeCracks: number;
}

export const monuments: Monument[] = [
  {
    id: 'mon-001',
    name: 'Bab Zourgane',
    nameAr: 'باب زرقان',
    type: 'gate',
    coordinates: [30.4662591, -8.8788773],
    vulnerabilityScore: 42,
    riskLevel: 'moderate',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    description:
      'Main eastern entrance of the medina, constructed during the Saadian dynasty in the 16th century. Features distinctive horseshoe arch with zellige tilework.',
    builtCentury: '16th century',
    dynasty: 'Saadian',
    inspectionCount: 7,
    activeCracks: 3,
  },
  {
    id: 'mon-002',
    name: 'Bab El Khemis',
    nameAr: 'باب الخميس',
    type: 'gate',
    coordinates: [30.4781029, -8.8753118],
    vulnerabilityScore: 28,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk. Partially restored in 2003 by the Regional Heritage Commission.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-003',
    name: 'Northern Rampart Section',
    nameAr: 'السور الشمالي',
    type: 'wall',
    coordinates: [30.4798, -8.872],
    vulnerabilityScore: 71,
    riskLevel: 'high',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    description:
      '750m continuous earthen pisé wall of Almoravid origin. Significant erosion detected in sections N-4 through N-7 following 2023 rainfall season.',
    builtCentury: '11th century',
    dynasty: 'Almoravid',
    inspectionCount: 12,
    activeCracks: 8,
  },
  {
    id: 'mon-004',
    name: 'Bab Aghbalou',
    nameAr: 'باب أغبالو',
    type: 'gate',
    coordinates: [30.471, -8.873],
    vulnerabilityScore: 35,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    description:
      'Southern gate retaining intact Alaouite-era original wooden doors. One of only two gates in Morocco with original period doors still in use.',
    builtCentury: '18th century',
    dynasty: 'Alaouite',
    inspectionCount: 4,
    activeCracks: 2,
  },
  {
    id: 'mon-005',
    name: 'Northeast Tower Cluster',
    nameAr: 'أبراج الشمال الشرقي',
    type: 'tower',
    coordinates: [30.479, -8.8685],
    vulnerabilityScore: 84,
    riskLevel: 'critical',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    description:
      'Group of 7 defensive towers showing severe structural distress. Critical diagonal cracks reported in towers T3 and T5. Immediate intervention recommended.',
    builtCentury: '12th century',
    dynasty: 'Almohad',
    inspectionCount: 18,
    activeCracks: 14,
  },
  {
    id: 'mon-006',
    name: 'Souk El Had Wall',
    nameAr: 'سور سوق الأحد',
    type: 'wall',
    coordinates: [30.4725, -8.8755],
    vulnerabilityScore: 55,
    riskLevel: 'moderate',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    description:
      'Inner medina boundary wall adjacent to the Sunday market. High tourist footfall causing gradual vibration damage to base foundations.',
    builtCentury: '16th century',
    dynasty: 'Saadian',
    inspectionCount: 9,
    activeCracks: 5,
  },
  {
    id: 'mon-007',
    name: "Aimad's House",
    nameAr: 'Casa Aimad',
    type: 'medina',
    coordinates: [30.491552, -8.873029],
    vulnerabilityScore: 28,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'A house named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-008',
    name: 'Bab Derb Laafou',
    nameAr: 'باب درب العفو',
    type: 'gate',
    coordinates: [30.4762396, -8.8743091],
    vulnerabilityScore: 56,
    riskLevel: 'moderate',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk. Partially restored in 2003 by the Regional Heritage Commission.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-009',
    name: 'Bab Selsla',
    nameAr: 'باب السلسلة',
    type: 'gate',
    coordinates: [30.4719418, -8.8736728],
    vulnerabilityScore: 40,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-010',
    name: 'Bab Targhount',
    nameAr: 'باب تارغونت',
    type: 'gate',
    coordinates: [30.4685595, -8.8945699],
    vulnerabilityScore: 40,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-011',
    name: 'Bab Bizamaren',
    nameAr: 'باب بيزامارن',
    type: 'gate',
    coordinates: [30.4778977, -8.8834994],
    vulnerabilityScore: 12,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-012',
    name: 'Bab El Kasbah',
    nameAr: 'منظر فوق سور المدينة',
    type: 'gate',
    coordinates: [30.4723934, -8.8748103],
    vulnerabilityScore: 12,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-013',
    name: 'Bab Ouled Bounouna',
    nameAr: 'باب أولاد بونونة',
    type: 'gate',
    coordinates: [30.4771631, -8.8879254],
    vulnerabilityScore: 36,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },
  {
    id: 'mon-014',
    name: 'Bab Lblalia',
    nameAr: 'باب البلاليع',
    type: 'gate',
    coordinates: [30.4690653, -8.8728615],
    vulnerabilityScore: 10,
    riskLevel: 'low',
    lastInspection: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    description:
      'Northern market gate named after the weekly Thursday souk.',
    builtCentury: '17th century',
    dynasty: 'Alaouite',
    inspectionCount: 5,
    activeCracks: 1,
  },

];

export const monumentService = {
  getAll: async (): Promise<Monument[]> => {
    await new Promise((res) => setTimeout(res, 500));
    return monuments;
  },
  getById: async (id: string): Promise<Monument | undefined> => {
    await new Promise((res) => setTimeout(res, 300));
    return monuments.find((m) => m.id === id);
  },
  getByRiskLevel: async (
    risk: Monument['riskLevel'],
  ): Promise<Monument[]> => {
    await new Promise((res) => setTimeout(res, 300));
    return monuments.filter((m) => m.riskLevel === risk);
  },
};


