import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { signInWithPassword } from '@/services/auth'
import { tryGetSupabase } from '@/lib/supabase/client'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const flash = (location.state as { message?: string } | null)?.message

  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const profile = useAuthStore((s) => s.profile)
  const profileLoading = useAuthStore((s) => s.profileLoading)
  const profileError = useAuthStore((s) => s.profileError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const configured = Boolean(tryGetSupabase())

  useEffect(() => {
    if (!initialized || profileLoading || !session) return

    if (profile?.status === 'pending') {
      navigate('/pending-approval', { replace: true })
      return
    }

    if (profile?.status === 'rejected') {
      navigate('/rejected-access', { replace: true })
      return
    }

    if (profile) {
      navigate(from, { replace: true })
    }
  }, [initialized, profileLoading, session, profile, from, navigate])

  if (initialized && session && !profileLoading && profile) {
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!configured) {
      setError('Supabase is not configured.')
      return
    }
    setLoading(true)
    try {
      await signInWithPassword(email, password)
      await refreshProfile()
      const nextState = useAuthStore.getState()
      if (!nextState.profile) {
        throw new Error(nextState.profileError ?? 'Signed in, but your workspace profile could not be loaded.')
      }
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Sign in</h1>
      <p className="text-[15px] font-medium text-[#475569] mb-6">Access your enterprise solution library.</p>

      {!configured && (
        <p className="text-sm font-medium text-[#B91C1C] mb-4">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.</p>
      )}

      {flash && <p className="text-sm font-medium text-[#15803D] mb-4">{flash}</p>}
      {session && profileLoading && (
        <p className="text-sm font-medium text-[#475569] mb-4">Loading your workspace profile…</p>
      )}
      {session && !profileLoading && !profile && profileError && (
        <p className="text-sm font-medium text-[#B91C1C] mb-4">{profileError}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[14px] font-bold text-[#1E293B] mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-[14px] font-bold text-[#1E293B] mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
          />
        </div>

        {error && <p className="text-sm font-medium text-[#B91C1C]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#0F766E] text-white rounded-lg font-bold text-[15px] hover:bg-[#0D5F58] transition-colors disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-[14px] font-semibold">
        <Link to="/forgot-password" className="text-[#0284C7] hover:underline">
          Forgot password?
        </Link>
        <Link to="/signup" className="text-[#0284C7] hover:underline">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  )
}
