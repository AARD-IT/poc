import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Route Optimization & Logistics Efficiency',
  description:
    'FastAPI-backed route optimization and logistics efficiency platform for ML-powered planning, cost simulation, anomaly detection, EDA charts, and action playbooks. The workflow supports loading default datasets, CSV upload, manual column mapping, filtering, clustering, predictive models, insights, and downloadable outputs.',
  date: 'Updated June 2026',
  client: 'Analytics Avenue',
  industry: 'Supply Chain',
  function: 'Route Optimization & Logistics Intelligence',
  tech: 'FastAPI, pandas, scikit-learn, Plotly, Python',
  contact: 'supply-chain@example.com',
  tags: ['Supply Chain', 'Route Optimization', 'Logistics', 'ML', 'FastAPI'],
  viewRoute: '/projects/route-optimization-logistics-efficiency/full',
}

export function RouteOptimizationLogisticsEfficiencyDetailPage() {
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