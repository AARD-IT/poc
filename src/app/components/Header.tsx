import { Bell, LogOut, Menu, Search, Settings, Shield, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { fetchNotificationsForUser, markNotificationRead } from '@/services/notifications'
import { useAuthStore } from '@/stores/authStore'
import { isStaffRole } from '@/types/domain'
import type { NotificationRow } from '@/types/domain'

export interface HeaderProps {
  searchQuery?: string
  onSearchChange?: (q: string) => void
}

export function Header({ searchQuery: controlledQ, onSearchChange }: HeaderProps) {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const [localQ, setLocalQ] = useState('')
  const q = controlledQ !== undefined ? controlledQ : localQ
  const setQ = onSearchChange ?? setLocalQ

  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    fetchNotificationsForUser()
      .then((rows) => {
        if (!cancelled) setNotifications(rows)
      })
      .catch(() => {
        if (!cancelled) setNotifications([])
      })
    return () => {
      cancelled = true
    }
  }, [profile, notifOpen])

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-[#CBD5E1] shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#0284C7] flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">AA</span>
            </div>
            <span className="font-bold text-[#1E293B] text-lg">Analytics Avenue</span>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search solutions..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border-[1.5px] border-[#CBD5E1] rounded-lg text-[15px] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative p-2.5 hover:bg-[#F1F5F9] rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-[#1E293B]" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0F766E] text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0 border-[#CBD5E1] shadow-lg">
              <div className="px-4 py-3 border-b border-[#CBD5E1] font-bold text-[#1E293B]">Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[15px] font-medium text-[#475569]">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      type="button"
                      key={n.id}
                      className="w-full text-left px-4 py-3 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                      onClick={async () => {
                        if (!n.is_read) {
                          try {
                            await markNotificationRead(n.id)
                            setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
                          } catch {
                            /* ignore */
                          }
                        }
                      }}
                    >
                      <div className="font-bold text-[14px] text-[#1E293B]">{n.title}</div>
                      <div className="text-[13px] font-medium text-[#475569] mt-0.5 line-clamp-2">{n.message}</div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#0F766E] flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-[#CBD5E1]">
              <div className="px-2 py-1.5 text-xs font-semibold text-[#475569] truncate">{profile?.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="font-medium cursor-pointer" onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="font-medium cursor-pointer" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              {profile && isStaffRole(profile.role) && profile.status === 'approved' && (
                <DropdownMenuItem className="font-medium cursor-pointer" onClick={() => navigate('/admin')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-medium cursor-pointer text-[#B91C1C]"
                onClick={async () => {
                  await signOut()
                  navigate('/login')
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button type="button" className="p-2.5 hover:bg-[#F1F5F9] rounded-lg transition-colors">
            <Menu className="w-5 h-5 text-[#1E293B]" />
          </button>
        </div>
      </div>
    </header>
  )
}
