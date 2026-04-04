import { apiFetch } from './authService'

const handle = async (res: Response) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Error')
  return data
}

export interface Assignment {
  assignment_id: number;
  monument_id: number;
  monument_name: string;
  inspector_id: number;
  inspector_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes: string;
  due_date: string;
  created_at: string;
}

export const assignmentService = {
  getAll: async (): Promise<{ results: Assignment[] }> => {
    const res = await apiFetch('/api/assignments/')
    return handle(res)
  },

  updateStatus: async (id: number, status: string) => {
    const res = await apiFetch(`/api/assignments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
    return handle(res)
  },

  create: async (data: any) => {
    const res = await apiFetch('/api/assignments/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return handle(res)
  }
}
