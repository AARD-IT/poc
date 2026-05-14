import { Outlet } from 'react-router'
import { Header } from '@/app/components/Header'

/** Authenticated pages without filter sidebar (profile, settings). */
export function MainShellPlain() {
  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Header />
      <main className="h-[calc(100vh-57px)] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
