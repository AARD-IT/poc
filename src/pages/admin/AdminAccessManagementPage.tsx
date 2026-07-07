import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  deriveAllowedIndustries,
  fetchAccessForUser,
  grantFullVisibleAccess,
  grantIndustryAccess,
  revokeIndustryAccess,
  revokeProjectAccess,
} from '@/services/pocAccess'
import { getVisibleProjects } from '@/config/projects'
import { notifyUser } from '@/services/notifications'
import { fetchAllUsers } from '@/services/users'
import { sendAccess, sendFullAccess } from '@/services/email'
import { useAuthStore } from '@/stores/authStore'
import type { AppUser, ProjectRegistryItem } from '@/types/domain'

export function AdminAccessManagementPage() {
  const actor = useAuthStore((s) => s.profile)
  const [users, setUsers] = useState<AppUser[]>([])
  const [projects, setProjects] = useState<ProjectRegistryItem[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [userId, setUserId] = useState('')
  const [selectedAccess, setSelectedAccess] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase().trim()
    const list = term
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.company?.toLowerCase().includes(term) ?? false)
        )
      : users

    if (userId && !list.some((u) => u.id === userId)) {
      const selected = users.find((u) => u.id === userId)
      if (selected) {
        return [selected, ...list]
      }
    }
    return list
  }, [users, userSearch, userId])

  const loadMeta = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const usersResponse = await fetchAllUsers()
      setUsers(usersResponse.filter((u) => u.status === 'approved' && u.role === 'client'))
      const visibleProjects = getVisibleProjects()
      setProjects(visibleProjects)
      setIndustries(Array.from(new Set(visibleProjects.map((project) => project.category).filter(Boolean))))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  const loadAccess = useCallback(async (uid: string) => {
    if (!uid) {
      setSelectedAccess(new Set())
      return
    }
    try {
      const rows = await fetchAccessForUser(uid)
      setSelectedAccess(new Set(deriveAllowedIndustries(rows)))
    } catch {
      setSelectedAccess(new Set())
    }
  }, [])

  useEffect(() => {
    void loadAccess(userId)
  }, [userId, loadAccess])

  const selectedUser = useMemo(() => users.find((u) => u.id === userId), [users, userId])

  function toggleIndustry(industry: string) {
    setSelectedAccess((prev) => {
      const next = new Set(prev)
      if (next.has(industry)) next.delete(industry)
      else next.add(industry)
      return next
    })
  }

  async function applyGrants() {
    if (!userId) {
      setErr('Please select a user before saving access.')
      setSuccess(null)
      return
    }
    if (!actor) {
      setErr('Admin profile is not loaded yet. Please refresh the page and try again.')
      setSuccess(null)
      return
    }
    setErr(null)
    setSuccess(null)
    setSaving(true)
    try {
      const current = await fetchAccessForUser(userId)
      const currentIndustries = deriveAllowedIndustries(current)
      const legacyProjectSlugs = current.map((row) => row.project_slug).filter(Boolean) as string[]
      const removeIndustries = Array.from(currentIndustries).filter((industry) => !selectedAccess.has(industry))
      const addIndustries = Array.from(selectedAccess).filter((industry) => !currentIndustries.has(industry))

      await Promise.all(legacyProjectSlugs.map((slug) => revokeProjectAccess(userId, slug)))
      await Promise.all(removeIndustries.map((industry) => revokeIndustryAccess(userId, industry)))
      await Promise.all(addIndustries.map((industry) => grantIndustryAccess(userId, industry, actor.id)))

      let emailIssue: string | null = null

      try {
        await notifyUser(userId, 'Access updated', 'Your assigned projects have been updated by an administrator.')
      } catch (notificationError: unknown) {
        console.warn('Notification failed after access update', notificationError)
      }

      if (addIndustries.length > 0 && selectedUser) {
        try {
          const assignedIndustries = addIndustries.map((industry) => industry)
          await sendAccess(selectedUser.email, selectedUser.name, assignedIndustries)
        } catch (emailError: unknown) {
          console.error('Access email failed', emailError)
          emailIssue = emailError instanceof Error ? emailError.message : String(emailError)
        }
      }

      if (addIndustries.length === 0 && removeIndustries.length === 0) {
        setSuccess('No changes detected; access is already up to date.')
      } else if (emailIssue) {
        setSuccess('Access saved successfully, but email notification failed.')
        setErr(`Email send error: ${emailIssue}`)
      } else {
        setSuccess('Access saved successfully.')
      }

      await loadAccess(userId)
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message)
      } else if (typeof e === 'object' && e !== null && 'message' in e) {
        setErr(String((e as { message: unknown }).message))
      } else {
        setErr(String(e))
      }
    } finally {
      setSaving(false)
    }
  }

  async function grantFull() {
    if (!userId) {
      setErr('Please select a user before granting access.')
      setSuccess(null)
      return
    }
    if (!actor) {
      setErr('Admin profile is not loaded yet. Please refresh the page and try again.')
      setSuccess(null)
      return
    }
    setErr(null)
    setSuccess(null)
    setSaving(true)
    try {
      const visible = projects.filter((project) => project.visible)
      await Promise.all((await fetchAccessForUser(userId)).map((row) => row.project_slug ? revokeProjectAccess(userId, row.project_slug) : Promise.resolve()))
      await grantFullVisibleAccess(userId, actor.id, visible)
      try {
        await notifyUser(userId, 'Full library access', 'You have been granted access to all visible projects.')
      } catch (notificationError: unknown) {
        console.warn('Notification failed after grant full access', notificationError)
      }
      let emailIssue: string | null = null
      if (selectedUser) {
        try {
          const areas = visible.map((project) => project.title)
          await sendFullAccess(selectedUser.email, selectedUser.name, areas)
        } catch (emailError: unknown) {
          console.error('Full access email failed', emailError)
          emailIssue = emailError instanceof Error ? emailError.message : String(emailError)
        }
      }
      await loadAccess(userId)
      setSelectedAccess(new Set(Array.from(new Set(visible.map((project) => project.category).filter(Boolean)))))
      if (emailIssue) {
        setSuccess('Full visible access granted successfully, but notification email failed.')
        setErr(`Email send error: ${emailIssue}`)
      } else {
        setSuccess('Full visible access granted successfully.')
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErr(e.message)
      } else if (typeof e === 'object' && e !== null && 'message' in e) {
        setErr(String((e as { message: unknown }).message))
      } else {
        setErr(String(e))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#E2E8F0] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">Access management</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Project access management</h1>
            <p className="mt-2 max-w-2xl text-[#475569]">Grant or revoke visibility for approved clients while keeping the same access-control logic and email notifications.</p>
          </div>
        </div>
      </section>

      {err && <p className="text-sm font-medium text-[#B91C1C]">{err}</p>}
      {success && <p className="text-sm font-medium text-[#047857]">{success}</p>}

      {loading ? (
        <p className="text-[15px] font-medium text-[#475569]">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] h-fit">
            <h2 className="font-bold text-[#1E293B] mb-3">User</h2>
            
            <div className="relative" ref={wrapperRef}>
              <input
                type="search"
                placeholder="Search by name, email, or company..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-3 py-2 border-[1.5px] border-[#E2E8F0] bg-[#F8FAFC] rounded-lg text-[14px] font-medium focus:bg-white focus:border-[#0F766E] focus:outline-none"
              />

              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white shadow-lg py-1">
                  {filteredUsers.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setUserId(u.id)
                        setUserSearch('')
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F1F5F9] transition-colors border-b last:border-b-0 border-[#F1F5F9]"
                    >
                      <p className="font-bold text-sm text-[#1E293B]">{u.name}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
              
              {showSuggestions && userSearch && filteredUsers.length === 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-[#E2E8F0] bg-white shadow-lg p-4 text-center text-sm text-[#64748B]">
                  No matching users found
                </div>
              )}
            </div>

            {selectedUser ? (
              <div className="mt-4 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">Selected Client</p>
                <p className="font-bold text-[#1E293B] mt-1.5 text-base">{selectedUser.name}</p>
                <p className="text-sm font-medium text-[#475569] mt-0.5">{selectedUser.email}</p>
                {selectedUser.company && (
                  <p className="text-xs text-[#64748B] mt-1">Company: {selectedUser.company}</p>
                )}
                <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[#475569]">
                    Role: <span className="font-bold text-[#1E293B]">{selectedUser.role}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setUserId('')}
                    className="text-xs text-[#B91C1C] hover:underline font-bold"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl border border-dashed border-[#CBD5E1] text-center text-sm text-[#64748B]">
                No user selected. Search and choose a user from the suggestion list.
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={!userId || saving}
                className="w-full py-2.5 bg-[#0F766E] text-white rounded-lg font-bold text-[14px] hover:bg-[#0D5F58] disabled:opacity-50"
                onClick={() => void applyGrants()}
              >
                {saving ? 'Saving…' : 'Save access'}
              </button>
              <button
                type="button"
                disabled={!userId || saving}
                className="w-full py-2.5 border-[1.5px] border-[#CBD5E1] rounded-lg font-bold text-[14px] hover:bg-[#F8FAFC] disabled:opacity-50"
                onClick={() => void grantFull()}
              >
                {saving ? 'Granting…' : 'Grant full (visible) access'}
              </button>
            </div>
          </section>

          <section className="lg:col-span-2 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <h2 className="font-bold text-[#1E293B] mb-4">Assign industries</h2>
            {!userId ? (
              <p className="text-[15px] font-medium text-[#475569]">Select a user to manage their project access.</p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
                {industries.map((industry) => (
                  <label
                    key={industry}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedAccess.has(industry)}
                      onChange={() => toggleIndustry(industry)}
                    />
                    <div>
                      <p className="font-bold text-[#1E293B]">{industry}</p>
                      <p className="text-[13px] font-medium text-[#475569]">All visible projects in this industry</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
