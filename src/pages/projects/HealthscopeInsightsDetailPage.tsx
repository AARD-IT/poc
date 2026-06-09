import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const poc = {
  title: 'Healthscope Insights',
  description:
    'Enterprise healthcare analytics dashboard that combines hospital performance, patient visit trends, recovery score benchmarking, and predictive ML insights for data-driven care leadership.',
  date: 'Updated May 2026',
  client: 'Healthscope Analytics',
  industry: 'Healthcare Analytics',
  function: 'Healthcare Intelligence',
  tech: 'React, Tailwind, Plotly, Python, ML',
  contact: 'healthscope-insights@example.com',
  tags: ['Healthcare', 'Analytics', 'ML', 'Hospital Performance', 'Patient Insights'],
  viewRoute: '/projects/healthscope-insights',
}

export function HealthscopeInsightsDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
