import { apiFetch } from './authService'

export const analyticsService = {
  get: async () => {
    const res = await apiFetch('/api/analytics/')
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail)
    return data
  }
}
