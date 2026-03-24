import { apiFetch } from './authService'

export interface Monument {
  id:                  number
  name:                string
  location:            string
  city:                string
  latitude:            number | null
  longitude:           number | null
  construction_year:   number | null
  description:         string | null
  status:              string
  type:                string | null
  vulnerability_score: number | null
  risk_level:          'low' | 'medium' | 'high' |
                       'critical' | null
  last_inspection:     string | null
}

export interface Inspection {
  id: number;
  monument_id: number;
  inspector_id: number;
  date: string;
  notes: string;
  humidity: number;
  crack_count: number;
  erosion_depth: number;
  risk_score: number;
  alert_triggered: boolean;
}

export type RiskLevel = NonNullable<Monument['risk_level']>

export const getRiskLevel = (
  score: number | null
): RiskLevel => {
  if (score === null) return 'low'
  if (score >= 76)   return 'critical'
  if (score >= 51)   return 'high'
  if (score >= 26)   return 'medium'
  return 'low'
}

export const monumentService = {

  getAll: async (): Promise<Monument[]> => {
    const res  = await apiFetch('/api/monuments/')
    if (!res.ok) return []
    const data = await res.json()
    return data.results ?? []
  },

  getById: async (
    id: number
  ): Promise<Monument | null> => {
    const res = await apiFetch(`/api/monuments/${id}`)
    if (!res.ok) return null
    return res.json()
  },

  getInspections: async (id: number): Promise<Inspection[]> => {
    try {
      const res = await apiFetch(`/api/monuments/${id}/inspections`)
      if (!res.ok) return []
      const data = await res.json()
      // Might be wrapped in results or direct array depending on FastApi response pagination
      return data.results || data || []
    } catch {
      return []
    }
  }
}
