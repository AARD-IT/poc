import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const poc = {
  title: 'Marketing Campaign Performance Analyzer',
  description:
    'A marketing analytics workspace for measuring campaign reach, engagement, lead generation, conversion efficiency, and ROI across channels using a FastAPI + Pandas pipeline.',
  date: 'Updated Jun 18, 2026',
  client: 'Marketing Analytics',
  industry: 'Marketing Analytics',
  function: 'Campaign Performance / ROI Analytics',
  tech: 'Python, Pandas, NumPy, FastAPI',
  contact: 'marketing-analytics@example.com',
  tags: ['Marketing Analytics', 'ROI', 'Campaign Performance', 'FastAPI'],
  viewRoute: '/projects/marketing-campaign-performance-analyzer/full',
}

export function MarketingCampaignPerformanceAnalyzerDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-[14px] font-bold text-[#0284C7] hover:underline"
      >
        ← Back
      </button>

      <ProjectDetailCard project={poc} />
    </div>
  )
}
