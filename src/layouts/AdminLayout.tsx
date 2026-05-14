import { Link, NavLink, Outlet } from 'react-router'
import { Header } from '@/app/components/Header'

const nav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/pocs', label: 'POCs' },
  { to: '/admin/access-management', label: 'Access' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Header />

      <div className="flex h-[calc(100vh-57px)]">
        <aside className="w-64 bg-white border-r-2 border-[#CBD5E1] overflow-y-auto shrink-0">
          <div className="p-4 border-b border-[#CBD5E1]">
            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide">Administration</p>
            <p className="font-bold text-[#1E293B] text-lg mt-1">Control center</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-[15px] font-bold transition-colors ${
                    isActive
                      ? 'bg-[#0F766E]/15 text-[#0F766E] border border-[#0F766E]/30'
                      : 'text-[#1E293B] hover:bg-[#F1F5F9] border border-transparent'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 mt-4">
            <Link
              to="/dashboard"
              className="text-[14px] font-bold text-[#0284C7] hover:underline"
            >
              ← Back to dashboard
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
