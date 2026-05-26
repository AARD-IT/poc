import { getSupabase } from '@/lib/supabase/client'
import type { ProjectAccess } from '@/types/domain'

export interface ProjectAccessRow extends ProjectAccess {}

export async function fetchAccessForUser(userId: string): Promise<ProjectAccessRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('poc_access')
    .select('id, user_id, project_slug, granted_by, created_at')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as ProjectAccessRow[]
}

export async function grantProjectAccess(userId: string, projectSlug: string, grantedBy: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('poc_access').upsert(
    [
      {
        user_id: userId,
        project_slug: projectSlug,
        granted_by: grantedBy,
      },
    ],
    {
      onConflict: 'user_id,project_slug',
      ignoreDuplicates: true,
    }
  )
  if (error) throw error
}

export async function revokeProjectAccess(userId: string, projectSlug: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('poc_access')
    .delete()
    .eq('user_id', userId)
    .eq('project_slug', projectSlug)
  if (error) throw error
}

export async function grantFullVisibleAccess(
  userId: string,
  grantedBy: string,
  visibleProjects: { slug: string }[]
): Promise<void> {
  const supabase = getSupabase()
  const rows = visibleProjects.map((project) => ({
    user_id: userId,
    project_slug: project.slug,
    granted_by: grantedBy,
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('poc_access').upsert(rows, {
    onConflict: 'user_id,project_slug',
    ignoreDuplicates: true,
  })
  if (error) throw error
}

export const grantPoc = grantProjectAccess
export const revokePoc = revokeProjectAccess
