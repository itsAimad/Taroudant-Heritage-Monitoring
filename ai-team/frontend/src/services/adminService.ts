import { apiFetch } from './authService'

const handle = async (res: Response) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Error')
  return data
}

export const adminService = {

  getStats: async () => {
    const res = await apiFetch('/api/admin/stats')
    return handle(res)
  },

  getAuditLogs: async () => {
    const res = await apiFetch('/api/admin/audit-logs')
    return handle(res)
  },

  getAssignments: async () => {
    const res = await apiFetch('/api/assignments/')
    return handle(res)
  },

  createAssignment: async (data: {
    inspector_id: number
    monument_id: number
    due_date: string
    notes?: string
  }) => {
    const res = await apiFetch('/api/assignments/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  deleteAssignment: async (id: number) => {
    const res = await apiFetch(`/api/assignments/${id}`, {
      method: 'DELETE',
    })
    return handle(res)
  },

  getUsers: async (role?: string) => {
    const url = role
      ? `/api/users/?role=${role}`
      : '/api/users/'
    const res = await apiFetch(url)
    return handle(res)
  },

  createUser: async (data: {
    email: string
    password: string
    confirm_password: string
    full_name: string
    organization: string
    role: string
  }) => {
    const res = await apiFetch('/api/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return handle(res)
  },

  deactivateUser: async (userId: number) => {
    const res = await apiFetch(
      `/api/users/${userId}/deactivate`,
      { method: 'PATCH' }
    )
    return handle(res)
  },

  updateUser: async (userId: number, data: any) => {
    const res = await apiFetch(
      `/api/users/${userId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    )
    return handle(res)
  },

  getAccessRequests: async (
    status?: string
  ) => {
    const url = status
      ? `/api/access-requests/?status=${status}`
      : '/api/access-requests/'
    const res = await apiFetch(url)
    return handle(res)
  },

  reviewRequest: async (
    id: number,
    status: string,
    note: string
  ) => {
    const res = await apiFetch(
      `/api/access-requests/${id}/${status === 'approved' ? 'approve' : 'reject'}`,
      {
        method: 'POST',
        body: JSON.stringify({ review_note: note }),
      }
    )
    return handle(res)
  },
}
