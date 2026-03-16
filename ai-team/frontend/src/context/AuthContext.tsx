import {
  createContext, useContext, useEffect,
  useState, useCallback, ReactNode
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authService, AuthUser, ApiError
} from '@/services/authService'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  clearError: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Where each role lands after login
const ROLE_HOME: Record<NonNullable<AuthUser>['role'], string> = {
  admin: '/admin/users',
  inspector: '/dashboard',
  authority: '/alerts',
}

export const AuthProvider = ({
  children
}: { children: ReactNode }) => {

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // ── On mount: check if a valid cookie session exists ──
  // getMe() hits GET /api/auth/me/ with the httpOnly cookie
  // If cookie is valid → returns user → setUser
  // If no cookie / expired → returns null → user stays null
  useEffect(() => {
    authService.getMe()
      .then(u => setUser(u))
      .finally(() => setLoading(false))
  }, [])

  // ── Listen for silent refresh failures ──────────────
  // apiFetch dispatches this when refresh token is expired
  // Forces logout without user needing to do anything
  useEffect(() => {
    const handler = () => {
      setUser(null)
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:session-expired', handler)
    return () => {
      window.removeEventListener('auth:session-expired', handler)
    }
  }, [navigate])

  const login = useCallback(async (
    email: string,
    password: string
  ) => {
    setError(null)
    try {
      const loggedIn = await authService.login(email, password)
      setUser(loggedIn)
      // Redirect based on role
      navigate(ROLE_HOME[loggedIn.role] ?? '/', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.detail
        : 'Login failed. Please try again.'
      setError(msg)
      throw err   // re-throw so Login page can react
    }
  }, [navigate])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // logout best-effort — clear local state regardless
    }
    setUser(null)
    navigate('/', { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      clearError: () => setError(null),
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error(
    'useAuth must be used inside <AuthProvider>'
  )
  return ctx
}
