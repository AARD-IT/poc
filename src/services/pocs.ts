import { fetchAccessForUser } from '@/services/pocAccess'
import { getAllProjects, getProjectBySlug, getVisibleProjects } from '@/config/projects'
import type { Poc, ProjectRegistryItem } from '@/types/domain'

let myPocsCache: Poc[] | null = null
let adminPocsCache: Poc[] | null = null
const pocBySlugCache = new Map<string, Poc>()

function mapRegistryProjectToPoc(project: ProjectRegistryItem): Poc {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    industry: project.category,
    slug: project.slug,
    thumbnail: null,
    visibility: project.visible ? 'visible' : 'hidden',
    created_at: new Date().toISOString(),
    tags: [project.category],
    client: null,
    solution_function: null,
    tech: null,
    contact: null,
    featured: Boolean(project.featured),
    sort_rank: 0,
    date_label: null,
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

export async function fetchMyPocs(userId: string): Promise<Poc[]> {
  const rows = await fetchAccessForUser(userId)
  const allowedSlugs = new Set(rows.map((row) => row.project_slug))
  const projects = getVisibleProjects().filter((project) => allowedSlugs.has(project.slug))
  const pocs = projects.map(mapRegistryProjectToPoc)
  myPocsCache = pocs
  cachePocs(pocs)
  return pocs
}

export async function fetchPocBySlug(slug: string): Promise<Poc | null> {
  const project = getProjectBySlug(slug)
  if (!project) return null
  const poc = mapRegistryProjectToPoc(project)
  pocBySlugCache.set(poc.slug, poc)
  return poc
}

export async function fetchAllPocsAdmin(): Promise<Poc[]> {
  const projects = getAllProjects()
  const pocs = projects.map(mapRegistryProjectToPoc)
  adminPocsCache = pocs
  cachePocs(pocs)
  return pocs
}

export async function fetchMyProjectRegistryItems(userId: string): Promise<ProjectRegistryItem[]> {
  const rows = await fetchAccessForUser(userId)
  const allowedSlugs = new Set(rows.map((row) => row.project_slug))
  return getVisibleProjects().filter((project) => allowedSlugs.has(project.slug))
}

export async function fetchAllProjectRegistryItems(): Promise<ProjectRegistryItem[]> {
  return getAllProjects()
}
