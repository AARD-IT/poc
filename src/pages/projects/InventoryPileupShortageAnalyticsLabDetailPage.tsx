import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Inventory Pileup & Shortage Analytics Lab',
  description:
    'Track demand vs supply, predict stock risks, and simulate inventory policies to balance working capital with service levels across your manufacturing supply chain.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue',
  industry: 'Manufacturing',
  function: 'Supply Chain / Inventory Management',
  tech: 'Python, Pandas, NumPy, Scikit-learn, RandomForest, GradientBoosting, Linear Regression, FastAPI',
  contact: 'manufacturing@example.com',
  tags: ['Manufacturing', 'Supply Chain', 'Inventory', 'AutoML'],
  viewRoute: '/projects/inventory-pileup-shortage-analytics-lab/full',
}

export function InventoryPileupShortageAnalyticsLabDetailPage() {
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

      <ProjectDetailCard project={project} />
    </div>
  )
}
