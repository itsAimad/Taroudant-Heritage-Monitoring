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
}
