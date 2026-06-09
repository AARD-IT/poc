import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Real Estate Intelligence Suite',
  description:
    'AI-powered real estate analytics platform for property valuation, market insights, and predictive investment recommendations. Designed to turn location, property, and pricing data into investor-ready visualizations and forecasts.',
  date: 'Updated May 2026',
  client: 'Analytics Avenue Real Estate',
  industry: 'PropTech',
  function: 'Real Estate Analytics',
  tech: 'FastAPI, Python, Pandas, scikit-learn, Plotly, React',
  contact: 'realestate@analyticsavenue.com',
  tags: ['Gen AI', 'Analytics', 'Real Estate', 'Automation', 'AI'],
  viewRoute: '/projects/real-estate-intelligence-suite/section',
  secondaryLabel: 'Streamlit',
  secondaryHref: 'https://analytics-avenue.streamlit.app/usecase_real_estate_1',
}

export function RealEstateIntelligenceSuiteDetailPage() {
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

      <ProjectDetailCard project={project} />
    </div>
  )
}
