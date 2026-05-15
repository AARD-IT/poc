import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ControlBar } from '@/app/components/ControlBar'
import { SolutionCard } from '@/app/components/SolutionCard'
import { EnterpriseEmpty } from '@/components/empty-states/EnterpriseEmpty'
import { useSearchFilters } from '@/contexts/SearchFiltersContext'
import { fetchMyPocs, getCachedMyPocs } from '@/services/pocs'
import { useAuthStore } from '@/stores/authStore'
import { filterPocs } from '@/utils/filterPocs'
import type { Poc } from '@/types/domain'

export function DashboardPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const profileLoading = useAuthStore((s) => s.profileLoading)
  const profileError = useAuthStore((s) => s.profileError)
  const { headerQuery, resultsQuery, selectedFilters } = useSearchFilters()
  const cachedPocs = getCachedMyPocs()
  const hasInitialCachedPocs = cachedPocs.length > 0

  const [pocs, setPocs] = useState<Poc[]>(cachedPocs)
  const [loading, setLoading] = useState(!hasInitialCachedPocs)

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const rows = await fetchMyPocs()
      setPocs(rows)
    } catch {
      setPocs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(!hasInitialCachedPocs)
  }, [hasInitialCachedPocs, load])

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

  const visible = filterPocs(pocs, { headerQuery, resultsQuery, selectedFilters })

  const aiPrescriptionCard = (
    <SolutionCard
      key="ai-prescription-generator"
      rank={1}
      title="AI Prescription Generator"
      description="Clinical-style prescription drafting assistant powered by generative AI. Opens the live Streamlit demo in your workspace."
      tags={['Gen AI', 'Healthcare', 'Streamlit', 'Demo']}
      date="Updated May 14, 2026"
      featured
      onClick={() => navigate('/projects/ai-prescription-detail')}
    />
  )

  const assignedCards = visible.map((poc, index) => (
    <SolutionCard
      key={poc.id}
      rank={poc.sort_rank || index + 1}
      title={poc.title}
      description={poc.description}
      tags={poc.tags}
      date={poc.date_label ?? '—'}
      featured={poc.featured}
      onClick={() => navigate(`/poc/${poc.slug}`, { state: { poc } })}
    />
  ))

  const solutionGrid = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {aiPrescriptionCard}
      {assignedCards}
    </div>
  )

  return (
    <div className="p-6">
      <ControlBar />

      {loading ? (
        <div className="text-[15px] font-medium text-[#475569] py-12 text-center">Loading solutions…</div>
      ) : pocs.length === 0 ? (
        solutionGrid
      ) : visible.length === 0 ? (
        <div className="space-y-5">
          {solutionGrid}
          <EnterpriseEmpty
            title="No matching assigned solutions"
            description="Try adjusting your search or filters. The featured demo above is always available."
          />
        </div>
      ) : (
        solutionGrid
      )}
    </div>
  )
}
