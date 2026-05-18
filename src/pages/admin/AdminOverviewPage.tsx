import { useEffect, useState } from 'react'
import { fetchAdminStats, type AdminStats } from '@/services/adminStats'

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      className="bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-5 shadow-sm"
      style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
    >
      <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#1E293B]">{value}</p>
    </div>
  )
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchAdminStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <p className="text-[15px] font-medium text-[#B91C1C]">{error}</p>
  }

  if (!stats) {
    return <p className="text-[15px] font-medium text-[#475569]">Loading overview…</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Dashboard overview</h1>
        <p className="text-[15px] font-medium text-[#475569] mt-1">Workspace health and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Pending approvals" value={stats.pendingUsers} />
        <StatCard label="Active users" value={stats.approvedUsers} />
        <StatCard label="Total POCs" value={stats.totalPocs} />
      </div>

      <div
        className="bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-6 shadow-sm"
        style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
      >
        <h2 className="font-bold text-[#1E293B] text-lg mb-4">Recently added users</h2>
        <div className="divide-y divide-[#CBD5E1]">
          {stats.recentUsers.length === 0 ? (
            <p className="text-[15px] font-medium text-[#475569] py-4">No users yet.</p>
          ) : (
            stats.recentUsers.map((u) => (
              <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#1E293B]">{u.name}</p>
                  <p className="text-[14px] font-medium text-[#475569]">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md border border-[#CBD5E1] text-[#475569]">
                    {u.role}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                      u.status === 'approved'
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : u.status === 'pending'
                          ? 'bg-[#FEF3C7] text-[#A16207] border-[#FDE68A]'
                          : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
