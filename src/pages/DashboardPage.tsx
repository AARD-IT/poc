import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ControlBar } from '@/app/components/ControlBar'
import { SolutionCard } from '@/app/components/SolutionCard'
import { EnterpriseEmpty } from '@/components/empty-states/EnterpriseEmpty'
import { useAuthStore } from '@/stores/authStore'
import { isStaffRole } from '@/types/domain'
import { fetchAllProjectRegistryItems, fetchMyProjectRegistryItems } from '@/services/pocs'
import type { ProjectRegistryItem } from '@/types/domain'

export function DashboardPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const profileLoading = useAuthStore((s) => s.profileLoading)
  const profileError = useAuthStore((s) => s.profileError)
  const [projects, setProjects] = useState<ProjectRegistryItem[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    if (!profile || profile.status !== 'approved') {
      setProjects([])
      setLoadingProjects(false)
      return
    }

    setLoadingProjects(true)
    if (isStaffRole(profile.role)) {
      void fetchAllProjectRegistryItems()
        .then((rows) => setProjects(rows.filter((project) => project.visible)))
        .catch(() => setProjects([]))
        .finally(() => setLoadingProjects(false))
    } else {
      void fetchMyProjectRegistryItems(profile.id)
        .then((rows) => setProjects(rows))
        .catch(() => setProjects([]))
        .finally(() => setLoadingProjects(false))
    }
  }, [profile])

  if (profileLoading && !profile) {
    return (
      <div className="p-6">
        <div className="text-[15px] font-medium text-[#475569] py-12 text-center">Loading your workspace…</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <EnterpriseEmpty
          title="Profile unavailable"
          description={
            profileError ??
            'Your session is active but no platform profile was found. Please contact an administrator.'
          }
        />
      </div>
    )
  }

  if (profile.status === 'pending') {
    return (
      <div className="p-6">
        <EnterpriseEmpty
          title="Account under review"
          description="Your account is under admin review. Please wait until access is granted."
        />
      </div>
    )
  }

  if (profile.status === 'rejected') {
    return (
      <div className="p-6">
        <EnterpriseEmpty
          title="Access not granted"
          description="Your registration was not approved for this workspace. If you believe this is a mistake, please contact your Analytics Avenue administrator."
        />
      </div>
    )
  }

  if (loadingProjects) {
    return (
      <div className="p-6">
        <div className="text-[15px] font-medium text-[#475569] py-12 text-center">Loading projects…</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <ControlBar />
        <EnterpriseEmpty
          title="No projects assigned"
          description="You do not have access to any projects yet. Please request access from your administrator."
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <ControlBar />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {projects.map((project, index) => (
          <SolutionCard
            key={project.slug}
            rank={index + 1}
            title={project.title}
            description={project.description}
            tags={[project.category]}
            date="Updated 2026"
            featured={project.featured}
            onClick={() => navigate(project.route)}
          />
        ))}
      </div>
    </div>
  )
}
