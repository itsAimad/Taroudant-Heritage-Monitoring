import { apiFetch } from './authService'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface Monument {
  id: number
  name: string
  location: string
  city: string
  latitude: number
  longitude: number
  construction_year: number | null
  description: string
  status: 'active' | 'under_restoration' | 'closed' | 'critical'
  type: string
  age_score: number | null
  crack_score: number | null
  vulnerability_score: number | null
  risk_level: string | null
  last_inspection: string | null
  /** e.g. "Saturday 04 April 2026" from SQL DAYNAME/MONTHNAME */
  last_inspection_display?: string | null
  image_url: string | null
  risk_summary?: string
  vulnerability_points?: string[]
}

export interface Inspection {
  id: number
  monument_id: number
  inspector_id: number
  inspection_date: string
  overall_condition: string
  risk_score: number | null
  risk_level: string | null
  status: string
  notes: string
  created_at: string
}

export const getRiskLevel = (score: number | null): 'low' | 'medium' | 'high' | 'critical' => {
  if (score === null) return 'low'
  if (score >= 76) return 'critical'
  if (score >= 51) return 'high'
  if (score >= 26) return 'medium'
  return 'low'
}

const handle = async (res: Response) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Error')
  return data
}

export const monumentService = {
  getAll: async () => {
    const res = await apiFetch('/api/monuments/')
    return handle(res)
  },

  getById: async (id: number) => {
    const res = await apiFetch(`/api/monuments/${id}`)
    return handle(res)
  },

  getInspections: async (id: number) => {
    const res = await apiFetch(`/api/monuments/${id}/inspections`)
    return handle(res)
  },

  getInspectionHistory: async (monumentId: number, isPublic: boolean = false) => {
    try {
      const path = isPublic
        ? `/api/monuments/${monumentId}/inspections/public`
        : `/api/monuments/${monumentId}/inspections`
      const res = isPublic
        ? await fetch(`${API_BASE}${path}`, { credentials: 'include' })
        : await apiFetch(path)
      if (!res.ok) return null
      return res.json()
    } catch {
      return null
    }
  },

  getMonumentPhotoUrl: (id: number) => `${API_BASE}/api/monuments/${id}/image`,

  create: async (data: any, file?: File | null) => {
    const form = new FormData()
    form.append('name', data.name)
    form.append('location', data.location)
    form.append('description', data.description)
    if (data.construction_year) form.append('construction_year', String(data.construction_year))
    if (data.latitude) form.append('latitude', String(data.latitude))
    if (data.longitude) form.append('longitude', String(data.longitude))
    if (data.category_id) form.append('category_id', String(data.category_id))
    if (file) {
      form.append('file', file)
    }

    const res = await fetch(`${API_BASE}/api/monuments/`, {
      method: 'POST',
      credentials: 'include',
      body: form
    })
    return handle(res)
  },

  update: async (id: number, data: any, file?: File | null) => {
    const form = new FormData()
    form.append('name', data.name)
    form.append('location', data.location)
    form.append('description', data.description)
    if (data.construction_year) form.append('construction_year', String(data.construction_year))
    if (data.latitude) form.append('latitude', String(data.latitude))
    if (data.longitude) form.append('longitude', String(data.longitude))
    if (data.category_id) form.append('category_id', String(data.category_id))
    if (file) {
      form.append('file', file)
    }

    const res = await fetch(`${API_BASE}/api/monuments/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: form
    })
    return handle(res)
  },

  delete: async (id: number) => {
    const res = await apiFetch(`/api/monuments/${id}`, {
      method: 'DELETE'
    })
    return handle(res)
  }
}
