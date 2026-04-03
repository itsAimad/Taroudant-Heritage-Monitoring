import { apiFetch } from './authService'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface Inspection {
  inspection_id:     number
  monument_id:       number
  monument_name:     string
  monument_location: string
  inspector_id:      number
  inspector_name:    string
  inspection_date:   string
  notes:             string
  overall_condition: string
  status:            'draft' | 'in_progress' | 'submitted' | 'acknowledged' | 'completed'
  crack_count:       number
  vulnerability_score: number | null
  risk_level:        string | null
  age_score:         number | null
  crack_score:       number | null
  created_at:        string
  cracks?:           Crack[]
}

export interface Crack {
  crack_id:             number
  inspection_id:        number
  location_on_monument: string
  severity:             string
  length_cm:            number | null
  photo_count:          number
  detected_at:          string
}

export interface VulnerabilityScore {
  score_id:    number
  total_score: number
  risk_level:  string
  age_score:   number
  crack_score: number
  computed_at: string
}

export interface Report {
  report_id:        number
  monument_id:      number
  monument_name:    string
  inspection_id:    number
  generated_by:     number
  generated_by_name: string
  title:            string
  risk_level:       string
  total_score:      number
  status:           'draft' | 'final' | 'validated' | 'disputed' | 'archived'
  created_at:       string
}

const handle = async (res: Response) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Error')
  return data
}

export const inspectionService = {

  getAll: async () => {
    const res = await apiFetch('/api/inspections/')
    return handle(res)
  },

  getById: async (id: number) => {
    const res = await apiFetch(`/api/inspections/${id}`)
    return handle(res)
  },

  create: async (data: {
    monument_id:       number
    inspection_date:   string
    notes?:            string
    overall_condition: string
  }) => {
    const res = await apiFetch('/api/inspections/', {
      method: 'POST',
      body:   JSON.stringify(data),
    })
    return handle(res)
  },

  edit: async (id: number, data: {
    notes?: string
    overall_condition?: string
  }) => {
    const res = await apiFetch(`/api/inspections/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(data),
    })
    return handle(res)
  },

  submit: async (id: number) => {
    const res = await apiFetch(`/api/inspections/${id}/submit`, {
      method: 'PATCH',
    })
    return handle(res)
  },

  acknowledge: async (id: number) => {
    const res = await apiFetch(`/api/inspections/${id}/acknowledge`, {
      method: 'PATCH',
    })
    return handle(res)
  },

  complete: async (id: number) => {
    const res = await apiFetch(`/api/inspections/${id}/complete`, {
      method: 'PATCH',
    })
    return handle(res)
  },

  logCrack: async (data: {
    inspection_id:        number
    location_on_monument: string
    severity:             string
    length_cm?:           number
  }) => {
    const res = await apiFetch('/api/cracks/', {
      method: 'POST',
      body:   JSON.stringify(data),
    })
    return handle(res)
  },

  getCracks: async (inspectionId: number) => {
    const res = await apiFetch(`/api/cracks/inspection/${inspectionId}`)
    return handle(res)
  },

  uploadCrackPhoto: async (
    crackId: number,
    file: File,
    caption: string = ''
  ): Promise<{ photo_id: number; file_size: number }> => {
    const form = new FormData()
    form.append('file', file)
    form.append('caption', caption)
    const res = await fetch(`${API_BASE}/api/cracks/${crackId}/photo`, {
      method:      'POST',
      credentials: 'include',
      body:        form,
      // No Content-Type — browser sets it with boundary
    })
    return handle(res)
  },

  getCrackPhotoUrl: (crackId: number) =>
    `${API_BASE}/api/cracks/${crackId}/image`,

  generateReport: async (data: {
    monument_id:   number
    inspection_id: number
    title:         string
  }) => {
    const res = await apiFetch('/api/reports/', {
      method: 'POST',
      body:   JSON.stringify(data),
    })
    return handle(res)
  },

  getReports: async () => {
    const res = await apiFetch('/api/reports/')
    return handle(res)
  },

  validateReport: async (
    reportId: number,
    status:   'validated' | 'disputed',
    note:     string = ''
  ) => {
    const res = await apiFetch(`/api/reports/${reportId}/validate`, {
      method: 'PATCH',
      body:   JSON.stringify({ status, validation_note: note }),
    })
    return handle(res)
  },

  getReportById: async (reportId: number) => {
    const res = await apiFetch(`/api/reports/${reportId}`)
    return handle(res)
  },

  getTriggeredNotifications: async () => {
    const res = await apiFetch('/api/notifications/triggered')
    return handle(res)
  },

  getDetail: async (id: number) => {
    const res = await apiFetch(`/api/inspections/${id}/detail`)
    return handle(res)
  },

  downloadReportPdf: async (reportId: number): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`${API_BASE}/api/reports/${reportId}/pdf`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Download failed')
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename="(.+)"/)
    const filename = match ? match[1] : `report_${reportId}.pdf`
    const blob = await res.blob()
    return { blob, filename }
  },
}

