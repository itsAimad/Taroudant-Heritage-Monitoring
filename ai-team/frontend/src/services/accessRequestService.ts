import { apiFetch } from './authService';

const handle = async <T>(res: Response): Promise<T> => {
  let data: any = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    throw new Error(data?.detail ?? 'An unexpected error occurred.');
  }
  return data as T;
};

export interface AccessRequest {
  id:                number;
  full_name:         string;
  email:             string;
  organization:      string;
  requested_role_id: number;
  role_name?:        string;
  reason:            string;
  status:            'pending' | 'approved' | 'rejected';
  submitted_at:      string;
  reviewed_at?:      string;
  review_note?:      string;
  reviewed_by_name?: string;
}

export interface AccessRequestPayload {
  full_name:         string;
  email:             string;
  organization:      string;
  requested_role_id: number;
  reason:            string;
}

export const accessRequestService = {
  submitRequest: async (data: AccessRequestPayload): Promise<any> => {
    const res = await apiFetch('/api/access-requests/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handle(res);
  },

  getAllRequests: async (status?: string): Promise<AccessRequest[]> => {
    const path = status ? `/api/access-requests/?status=${status}` : '/api/access-requests/';
    const res = await apiFetch(path);
    const data = await handle<{ results: AccessRequest[] }>(res);
    return data.results;
  },

  approveRequest: async (id: number, reviewNote?: string): Promise<void> => {
    const res = await apiFetch(`/api/access-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status: 'approved', review_note: reviewNote }),
    });
    await handle(res);
  },

  rejectRequest: async (id: number, reviewNote: string): Promise<void> => {
    const res = await apiFetch(`/api/access-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ status: 'rejected', review_note: reviewNote }),
    });
    await handle(res);
  },
};


