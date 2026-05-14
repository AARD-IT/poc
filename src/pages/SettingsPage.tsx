import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'

export function SettingsPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (password.length < 8) {
      setErr('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMsg('Password updated.')
      setPassword('')
      setConfirm('')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const input =
    'w-full max-w-xl px-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20'

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Settings</h1>
      <p className="text-[15px] font-medium text-[#475569] mb-6">Security preferences for your account.</p>

      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-[14px] font-bold text-[#1E293B] mb-1.5">New password</label>
          <input type="password" autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-[14px] font-bold text-[#1E293B] mb-1.5">Confirm password</label>
          <input type="password" autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {err && <p className="text-sm font-medium text-[#B91C1C]">{err}</p>}
        {msg && <p className="text-sm font-medium text-[#15803D]">{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#0F766E] text-white rounded-lg font-bold text-[15px] hover:bg-[#0D5F58] disabled:opacity-60"
        >
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
