import { apiFetch } from './authService'

export interface Notification {
  notification_id:          number
  monument_id:              number | null
  monument_name:            string | null
  monument_location:        string | null
  latitude:                 number | null
  longitude:                number | null
  message:                  string
  severity:                 string
  is_read:                  boolean
  sent_at:                  string
  triggered_by_inspection:  number | null
}

const handle = async (res: Response) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Error')
  return data
}

export const notificationService = {

  getAll: async () => {
    const res = await apiFetch('/api/notifications/')
    return handle(res)
  },

  markRead: async (id: number) => {
    const res = await apiFetch(
      `/api/notifications/${id}/read`,
      { method: 'PATCH' }
    )
    return handle(res)
  },

  markAllRead: async () => {
    const res = await apiFetch(
      '/api/notifications/read-all',
      { method: 'PATCH' }
    )
    return handle(res)
  },
}
