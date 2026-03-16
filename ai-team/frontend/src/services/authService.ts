const API_BASE = import.meta.env.VITE_API_URL
               ?? 'http://localhost:8000'

export interface AuthUser {
  id:           number
  email:        string
  full_name:    string
  role:         'admin' | 'inspector' | 'authority'
  organization: string
  is_active:    boolean
}

export class ApiError extends Error {
  constructor(
    public detail: string,
    public status: number
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}

// ─── Core fetch wrapper ─────────────────────────
// credentials: 'include' sends httpOnly cookies
// on 401 → silently tries token refresh → retries once
// on second 401 → dispatches session-expired event
// ────────────────────────────────────────────────
export const apiFetch = async (
  path:    string,
  options: RequestInit = {},
  _retry:  boolean     = true
): Promise<Response> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (
    res.status === 401 &&
    _retry &&
    !path.includes('/login') &&
    !path.includes('/token/refresh')
  ) {
    const refreshRes = await fetch(
      `${API_BASE}/api/auth/token/refresh/`,
      { method: 'POST', credentials: 'include' }
    )
    if (refreshRes.ok) {
      return apiFetch(path, options, false)
    }
    window.dispatchEvent(new Event('auth:session-expired'))
    return res
  }

  return res
}

// ─── Parse response → throw ApiError on failure ─
const handle = async <T>(res: Response): Promise<T> => {
  let data: any = {}
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) {
    throw new ApiError(
      data?.detail ?? 'An unexpected error occurred.',
      res.status
    )
  }
  return data as T
}

// ─── Auth endpoints ──────────────────────────────
export const authService = {

  login: async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
    const res = await apiFetch('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await handle<{ user: AuthUser }>(res)
    return data.user
  },

  logout: async (): Promise<void> => {
    await apiFetch('/api/auth/logout/', { method: 'POST' })
    // cookies cleared server-side — no local cleanup needed
  },

  getMe: async (): Promise<AuthUser | null> => {
    try {
      const res = await apiFetch('/api/auth/me/')
      if (res.status === 401) return null
      return handle<AuthUser>(res)
    } catch {
      return null
    }
  },

  submitAccessRequest: async (payload: {
    full_name:    string
    email:        string
    organization: string
    role:         string
    reason:       string
  }): Promise<{ message: string; request_id: number }> => {
    const res = await apiFetch('/api/access-requests/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return handle(res)
  },
}
