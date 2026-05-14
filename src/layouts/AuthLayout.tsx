import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-6">
      <Link to="/login" className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#0284C7] flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-base">AA</span>
        </div>
        <span className="font-bold text-[#1E293B] text-lg">Analytics Avenue</span>
      </Link>
      <div
        className="w-full max-w-md bg-white border-[1.5px] border-[#CBD5E1] rounded-xl p-8 shadow-sm"
        style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}
      >
        {children}
      </div>
    </div>
  )
}
