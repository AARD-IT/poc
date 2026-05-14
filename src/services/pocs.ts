import { getSupabase, tryGetSupabase } from '@/lib/supabase/client'
import type { Poc } from '@/types/domain'

let myPocsCache: Poc[] | null = null
let adminPocsCache: Poc[] | null = null
const pocBySlugCache = new Map<string, Poc>()

function mapPoc(row: Record<string, unknown>): Poc {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    industry: row.industry != null ? String(row.industry) : null,
    slug: String(row.slug),
    thumbnail: row.thumbnail != null ? String(row.thumbnail) : null,
    visibility: (row.visibility === 'hidden' ? 'hidden' : 'visible') as Poc['visibility'],
    created_at: String(row.created_at),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    client: row.client != null ? String(row.client) : null,
    solution_function: row.solution_function != null ? String(row.solution_function) : null,
    tech: row.tech != null ? String(row.tech) : null,
    contact: row.contact != null ? String(row.contact) : null,
    featured: Boolean(row.featured),
    sort_rank: Number(row.sort_rank ?? 0),
    date_label: row.date_label != null ? String(row.date_label) : null,
  }
}

function cachePocs(pocs: Poc[]) {
  for (const poc of pocs) {
    pocBySlugCache.set(poc.slug, poc)
  }
}

export function getCachedMyPocs(): Poc[] {
  return myPocsCache ?? []
}

export function getCachedAdminPocs(): Poc[] {
  return adminPocsCache ?? []
}

export function getCachedPocBySlug(slug: string): Poc | null {
  return pocBySlugCache.get(slug) ?? null
}

/** POCs visible to the current session (RLS: assigned + approved, or staff sees all). */
export async function fetchMyPocs(): Promise<Poc[]> {
  const supabase = tryGetSupabase()
  if (!supabase) return []
  const { data, error } = await supabase.from('pocs').select('*').order('sort_rank', { ascending: true })
  if (error) throw error
  const pocs = (data ?? []).map((r) => mapPoc(r as Record<string, unknown>))
  myPocsCache = pocs
  cachePocs(pocs)
  return pocs
}

export async function fetchPocBySlug(slug: string): Promise<Poc | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.from('pocs').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!data) return null
  const poc = mapPoc(data as Record<string, unknown>)
  pocBySlugCache.set(poc.slug, poc)
  return poc
}

export async function fetchAllPocsAdmin(): Promise<Poc[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('pocs').select('*').order('sort_rank', { ascending: true })
  if (error) throw error
  const pocs = (data ?? []).map((r) => mapPoc(r as Record<string, unknown>))
  adminPocsCache = pocs
  cachePocs(pocs)
  return pocs
}

export async function upsertPoc(
  input: Partial<Poc> & { title: string; slug: string; description: string; tagLine?: string }
): Promise<void> {
  const supabase = getSupabase()
  const tags =
    input.tagLine != null && input.tagLine.trim().length > 0
      ? input.tagLine
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : input.tags ?? []

  const row = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    industry: input.industry ?? null,
    thumbnail: input.thumbnail ?? null,
    visibility: input.visibility ?? 'visible',
    tags,
    client: input.client ?? null,
    solution_function: input.solution_function ?? null,
    tech: input.tech ?? null,
    contact: input.contact ?? null,
    featured: input.featured ?? false,
    sort_rank: input.sort_rank ?? 0,
    date_label: input.date_label ?? null,
  }

  if (input.id) {
    const { error } = await supabase.from('pocs').update(row).eq('id', input.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('pocs').insert(row)
    if (error) throw error
  }
  myPocsCache = null
  adminPocsCache = null
  if (input.slug) {
    pocBySlugCache.delete(input.slug)
  }
}

export async function deletePoc(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('pocs').delete().eq('id', id)
  if (error) throw error
  myPocsCache = null
  adminPocsCache = null
  for (const [slug, poc] of pocBySlugCache.entries()) {
    if (poc.id === id) {
      pocBySlugCache.delete(slug)
    }
  }
}
