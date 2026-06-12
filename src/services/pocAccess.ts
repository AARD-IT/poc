import { getSupabase } from '@/lib/supabase/client'
import { getProjectBySlug } from '@/config/projects'
import type { ProjectAccess } from '@/types/domain'

export interface ProjectAccessRow extends ProjectAccess {}

export function deriveAllowedIndustries(rows: ProjectAccessRow[]): Set<string> {
  const industries = new Set<string>()

  for (const row of rows) {
    if (row.industry) {
      industries.add(row.industry)
      continue
    }

    const project = row.project_slug ? getProjectBySlug(row.project_slug) : null
    if (project?.category) {
      industries.add(project.category)
    }
  }

  return industries
}

export async function fetchAccessForUser(userId: string): Promise<ProjectAccessRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('poc_access')
    .select('id, user_id, project_slug, industry, granted_by, created_at')
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

export async function grantIndustryAccess(userId: string, industry: string, grantedBy: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('poc_access').upsert(
    [
      {
        user_id: userId,
        industry,
        granted_by: grantedBy,
        project_slug: null,
      },
    ],
    {
      onConflict: 'user_id,industry',
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

export async function revokeIndustryAccess(userId: string, industry: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('poc_access')
    .delete()
    .eq('user_id', userId)
    .eq('industry', industry)
  if (error) throw error
}

export async function grantFullVisibleAccess(
  userId: string,
  grantedBy: string,
  visibleProjects: { slug: string; category?: string | null }[]
): Promise<void> {
  const supabase = getSupabase()
  const industries = Array.from(new Set(visibleProjects.map((project) => project.category).filter(Boolean) as string[]))
  const rows = industries.map((industry) => ({
    user_id: userId,
    industry,
    project_slug: null,
    granted_by: grantedBy,
  }))
  if (rows.length === 0) return
  const { error } = await supabase.from('poc_access').upsert(rows, {
    onConflict: 'user_id,industry',
  })
  if (error) throw error
}

export const grantPoc = grantProjectAccess
export const revokePoc = revokeProjectAccess
