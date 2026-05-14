import { getSupabase, tryGetSupabase } from '@/lib/supabase/client'
import type { NotificationRow } from '@/types/domain'

export async function fetchNotificationsForUser(): Promise<NotificationRow[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as NotificationRow[]
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function notifyUser(userId: string, title: string, message: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('notifications').insert({ user_id: userId, title, message })
  if (error) throw error
}
