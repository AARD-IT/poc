import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Real Estate Demand Forecasting Lab',
  description:
    'A complete real estate demand forecasting dashboard that loads listing data, calculates market demand trends, forecasts next-period demand, and surfaces automated property insights.',
  date: 'Updated May 2026',
  client: 'Analytics Avenue Real Estate',
  industry: 'PropTech',
  function: 'Demand Forecasting',
  tech: 'FastAPI, Python, Pandas, scikit-learn, Plotly, React',
  contact: 'realestate@analyticsavenue.com',
  tags: ['Forecasting', 'Real Estate', 'Analytics', 'AI', 'Market Intelligence'],
}

export function RealEstateDemandForecastingDetailPage() {
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

      <ProjectDetailCard project={{ ...project, viewRoute: '/projects/real-estate-demand-forecasting-lab/section' }} />
    </div>
  )
}
