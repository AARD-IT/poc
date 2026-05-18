import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAccessForUser, grantFullVisibleAccess, grantPoc, revokePoc } from '@/services/pocAccess'
import { fetchAllPocsAdmin } from '@/services/pocs'
import { notifyUser } from '@/services/notifications'
import { fetchAllUsers } from '@/services/users'
import { useAuthStore } from '@/stores/authStore'
import type { AppUser, Poc } from '@/types/domain'

export function AdminAccessManagementPage() {
  const actor = useAuthStore((s) => s.profile)
  const [users, setUsers] = useState<AppUser[]>([])
  const [pocs, setPocs] = useState<Poc[]>([])
  const [userId, setUserId] = useState('')
  const [selectedAccess, setSelectedAccess] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const loadMeta = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [uRows, pRows] = await Promise.all([fetchAllUsers(), fetchAllPocsAdmin()])
      setUsers(uRows.filter((u) => u.status === 'approved' && u.role === 'client'))
      setPocs(pRows.filter((p) => p.visibility === 'visible'))
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
      setSelectedAccess(new Set(rows.map((r) => r.poc_id)))
    } catch {
      setSelectedAccess(new Set())
    }
  }, [])

  useEffect(() => {
    void loadAccess(userId)
  }, [userId, loadAccess])

  const selectedUser = useMemo(() => users.find((u) => u.id === userId), [users, userId])

  function togglePoc(id: string) {
    setSelectedAccess((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function applyGrants() {
    if (!userId || !actor) return
    setErr(null)
    try {
      const current = await fetchAccessForUser(userId)
      const currentIds = new Set(current.map((r) => r.poc_id))
      for (const id of currentIds) {
        if (!selectedAccess.has(id)) await revokePoc(userId, id)
      }
      for (const id of selectedAccess) {
        if (!currentIds.has(id)) await grantPoc(userId, id, actor.id)
      }
      await notifyUser(userId, 'Access updated', 'Your assigned proof-of-concepts have been updated by an administrator.')
      await loadAccess(userId)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    }
  }

  async function grantFull() {
    if (!userId || !actor) return
    setErr(null)
    try {
      const visible = pocs.filter((p) => p.visibility === 'visible')
      await grantFullVisibleAccess(userId, actor.id, visible)
      await notifyUser(userId, 'Full library access', 'You have been granted access to all visible proof-of-concepts.')
      await loadAccess(userId)
      setSelectedAccess(new Set(visible.map((p) => p.id)))
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Grant failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">POC access management</h1>
        <p className="text-[15px] font-medium text-[#475569] mt-1">
          Assign individual POCs, multiple selections, or grant full access to all visible catalogue items.
        </p>
      </div>

      {err && <p className="text-sm font-medium text-[#B91C1C]">{err}</p>}

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
                disabled={!userId}
                className="w-full py-2.5 bg-[#0F766E] text-white rounded-lg font-bold text-[14px] hover:bg-[#0D5F58] disabled:opacity-50"
                onClick={() => void applyGrants()}
              >
                Save access
              </button>
              <button
                type="button"
                disabled={!userId}
                className="w-full py-2.5 border-[1.5px] border-[#CBD5E1] rounded-lg font-bold text-[14px] hover:bg-[#F8FAFC] disabled:opacity-50"
                onClick={() => void grantFull()}
              >
                Grant full (visible) access
              </button>
            </div>
          </div>

          <div
            className="lg:col-span-2 bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-5 shadow-sm"
            style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
          >
            <h2 className="font-bold text-[#1E293B] mb-4">Assign POCs</h2>
            {!userId ? (
              <p className="text-[15px] font-medium text-[#475569]">Select a user to manage their POC access.</p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
                {pocs.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedAccess.has(p.id)}
                      onChange={() => togglePoc(p.id)}
                    />
                    <div>
                      <p className="font-bold text-[#1E293B]">{p.title}</p>
                      <p className="text-[13px] font-medium text-[#475569]">{p.slug}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                          p.visibility === 'visible'
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : 'bg-[#E5E7EB] text-[#475569] border-[#D1D5DB]'
                        }`}
                      >
                        {p.visibility}
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
