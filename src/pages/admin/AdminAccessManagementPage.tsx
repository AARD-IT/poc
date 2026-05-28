import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAccessForUser,
  grantFullVisibleAccess,
  grantProjectAccess,
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
  const [userId, setUserId] = useState('')
  const [selectedAccess, setSelectedAccess] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadMeta = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const usersResponse = await fetchAllUsers()
      setUsers(usersResponse.filter((u) => u.status === 'approved' && u.role === 'client'))
      setProjects(getVisibleProjects())
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
      setSelectedAccess(new Set(rows.map((r) => r.project_slug)))
    } catch {
      setSelectedAccess(new Set())
    }
  }, [])

  useEffect(() => {
    void loadAccess(userId)
  }, [userId, loadAccess])

  const selectedUser = useMemo(() => users.find((u) => u.id === userId), [users, userId])

  function toggleProject(slug: string) {
    setSelectedAccess((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
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
      const currentSlugs = new Set(current.map((r) => r.project_slug))
      const removeSlugs = Array.from(currentSlugs).filter((slug) => !selectedAccess.has(slug))
      const addSlugs = Array.from(selectedAccess).filter((slug) => !currentSlugs.has(slug))

      await Promise.all(removeSlugs.map((slug) => revokeProjectAccess(userId, slug)))
      await Promise.all(addSlugs.map((slug) => grantProjectAccess(userId, slug, actor.id)))

      let emailIssue: string | null = null

      try {
        await notifyUser(userId, 'Access updated', 'Your assigned projects have been updated by an administrator.')
      } catch (notificationError: unknown) {
        console.warn('Notification failed after access update', notificationError)
      }

      if (addSlugs.length > 0 && selectedUser) {
        try {
          const assignedPocs = addSlugs.map((slug) => projects.find((project) => project.slug === slug)?.title ?? slug)
          await sendAccess(selectedUser.email, selectedUser.name, assignedPocs)
        } catch (emailError: unknown) {
          console.error('Access email failed', emailError)
          emailIssue = emailError instanceof Error ? emailError.message : String(emailError)
        }
      }

      if (addSlugs.length === 0 && removeSlugs.length === 0) {
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
      setSelectedAccess(new Set(visible.map((project) => project.slug)))
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
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Project access management</h1>
        <p className="text-[15px] font-medium text-[#475569] mt-1">
          Assign available projects directly from the codebase registry and manage user permissions by project slug.
        </p>
      </div>

      {err && <p className="text-sm font-medium text-[#B91C1C]">{err}</p>}
      {success && <p className="text-sm font-medium text-[#047857]">{success}</p>}

      {loading ? (
        <p className="text-[15px] font-medium text-[#475569]">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-1 bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-5 shadow-sm h-fit"
            style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
          >
            <h2 className="font-bold text-[#1E293B] mb-3">User</h2>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2.5 border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium bg-white"
            >
              <option value="">Select approved client…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            {selectedUser && (
              <p className="mt-4 text-[13px] font-medium text-[#475569] leading-relaxed">
                Role: <span className="font-bold text-[#1E293B]">{selectedUser.role}</span>
              </p>
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
          </div>

          <div
            className="lg:col-span-2 bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-5 shadow-sm"
            style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
          >
            <h2 className="font-bold text-[#1E293B] mb-4">Assign projects</h2>
            {!userId ? (
              <p className="text-[15px] font-medium text-[#475569]">Select a user to manage their project access.</p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedAccess.has(project.slug)}
                      onChange={() => toggleProject(project.slug)}
                    />
                    <div>
                      <p className="font-bold text-[#1E293B]">{project.title}</p>
                      <p className="text-[13px] font-medium text-[#475569]">{project.slug}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]">
                        visible
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
