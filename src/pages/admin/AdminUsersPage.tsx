import { useCallback, useEffect, useMemo, useState } from 'react'
import { notifyUser } from '@/services/notifications'
import { deleteUserRow, fetchAllUsers, updateUserRole, updateUserStatus } from '@/services/users'
import { useAuthStore } from '@/stores/authStore'
import type { AppUser, UserRole, UserStatus } from '@/types/domain'
import { canAssignSuperAdmin } from '@/types/domain'

const roles: UserRole[] = ['client', 'viewer', 'admin', 'super_admin']

export function AdminUsersPage() {
  const actor = useAuthStore((s) => s.profile)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const [users, setUsers] = useState<AppUser[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    setErr(null)
    try {
      const rows = await fetchAllUsers()
      setUsers(rows)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(true)
  }, [load])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(n) ||
        u.email.toLowerCase().includes(n) ||
        (u.company?.toLowerCase().includes(n) ?? false)
    )
  }, [users, q])

  async function setStatus(u: AppUser, status: UserStatus) {
    setErr(null)
    try {
      await updateUserStatus(u.id, status)
      if (status === 'approved') {
        await notifyUser(u.id, 'Access approved', 'Your Analytics Avenue account has been approved. Assigned POCs will appear on your dashboard.')
      } else if (status === 'rejected') {
        await notifyUser(u.id, 'Access update', 'Your access request was not approved for this workspace.')
      }
      await load(false)
      if (u.id === actor?.id) await refreshProfile()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function setRole(u: AppUser, role: UserRole) {
    if (role === 'super_admin' && actor && !canAssignSuperAdmin(actor.role)) {
      setErr('Only a super admin can assign the super admin role.')
      return
    }
    setErr(null)
    try {
      await updateUserRole(u.id, role)
      await load(false)
      if (u.id === actor?.id) await refreshProfile()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Role update failed')
    }
  }

  async function remove(u: AppUser) {
    if (!window.confirm(`Remove platform profile for ${u.email}? They will lose access to this workspace.`)) return
    setErr(null)
    try {
      await deleteUserRow(u.id)
      await load(false)
      if (u.id === actor?.id) {
        await useAuthStore.getState().signOut()
        window.location.href = '/login'
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">User management</h1>
          <p className="text-[15px] font-medium text-[#475569] mt-1">Approve, reject, assign roles, and revoke access.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <input
            type="search"
            placeholder="Search users…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-sm"
          />
        </div>
      </div>

      {err && <p className="text-sm font-medium text-[#B91C1C]">{err}</p>}

      <div
        className="bg-white border-[1.5px] border-[#CBD5E1] rounded-xl overflow-hidden shadow-sm"
        style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
      >
        {loading ? (
          <p className="p-6 text-[15px] font-medium text-[#475569]">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-[15px] font-medium text-[#475569]">No users match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#F8FAFC] border-b border-[#CBD5E1]">
                <tr>
                  <th className="px-4 py-3 font-bold text-[#475569]">User</th>
                  <th className="px-4 py-3 font-bold text-[#475569]">Company</th>
                  <th className="px-4 py-3 font-bold text-[#475569]">Status</th>
                  <th className="px-4 py-3 font-bold text-[#475569]">Role</th>
                  <th className="px-4 py-3 font-bold text-[#475569]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC]/80">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#1E293B]">{u.name}</p>
                      <p className="text-[#475569] font-medium">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#475569]">{u.company ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${
                          u.status === 'approved'
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : u.status === 'pending'
                              ? 'bg-[#FEF3C7] text-[#A16207] border-[#FDE68A]'
                              : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'super_admin' && actor && !canAssignSuperAdmin(actor.role) ? (
                        <span className="text-xs font-bold text-[#475569]">super_admin</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => void setRole(u, e.target.value as UserRole)}
                          className="px-2 py-1.5 border-[1.5px] border-[#CBD5E1] rounded-lg text-[13px] font-bold text-[#1E293B] bg-white"
                        >
                          {roles
                            .filter(
                              (r) =>
                                r !== 'super_admin' ||
                                (actor && canAssignSuperAdmin(actor.role)) ||
                                r === u.role
                            )
                            .map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D5F58]"
                              onClick={() => void setStatus(u, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]"
                              onClick={() => void setStatus(u, 'rejected')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {u.status === 'rejected' && (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D5F58]"
                            onClick={() => void setStatus(u, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#B91C1C] border border-[#FCA5A5] hover:bg-[#FEF2F2]"
                          onClick={() => void remove(u)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
