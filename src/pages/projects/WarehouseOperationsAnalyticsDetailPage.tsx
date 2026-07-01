import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Warehouse Operations Analytics',
  description:
    'FastAPI-backed warehouse operations analytics platform for layout optimization, congestion hotfixing, workload balancing, slotting score analysis, and picker productivity benchmarking. The workflow features sample dataset loading, manual CSV upload & mapping, Plotly dynamic charts, clustering, RandomForest / Gradient Boosting predictors, automated operational insights, and actionable playbooks.',
  date: 'Updated June 2026',
  client: 'Analytics Avenue',
  industry: 'Supply Chain',
  function: 'Warehouse Layout & Picking Optimization',
  tech: 'FastAPI, pandas, scikit-learn, Plotly, Python',
  contact: 'supply-chain@example.com',
  tags: ['Supply Chain', 'Warehouse Analytics', 'Picking Optimization', 'ML', 'FastAPI'],
  viewRoute: '/projects/warehouse-operations-analytics/full',
}

export function WarehouseOperationsAnalyticsDetailPage() {
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

export default WarehouseOperationsAnalyticsDetailPage
