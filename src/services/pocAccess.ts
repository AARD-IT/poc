import { getSupabase } from '@/lib/supabase/client'
import type { Poc } from '@/types/domain'

export interface PocAccessRow {
  id: string
  user_id: string
  poc_id: string
  granted_by: string | null
  created_at: string
  pocs?: Poc
}

export async function fetchAccessForUser(userId: string): Promise<PocAccessRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('poc_access')
    .select('*, pocs(*)')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as PocAccessRow[]
}

export async function grantPoc(userId: string, pocId: string, grantedBy: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('poc_access').insert({
    user_id: userId,
    poc_id: pocId,
    granted_by: grantedBy,
  })
  if (error) throw error
}

export async function revokePoc(userId: string, pocId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('poc_access').delete().eq('user_id', userId).eq('poc_id', pocId)
  if (error) throw error
}

export async function grantFullVisibleAccess(
  userId: string,
  grantedBy: string,
  visiblePocs: { id: string }[]
): Promise<void> {
  const supabase = getSupabase()
  const rows = visiblePocs.map((p) => ({
    user_id: userId,
    poc_id: p.id,
    granted_by: grantedBy,
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('poc_access').upsert(rows, {
    onConflict: 'user_id,poc_id',
    ignoreDuplicates: true,
  })
  if (error) throw error
}
