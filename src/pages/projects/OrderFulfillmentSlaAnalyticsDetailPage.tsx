import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Order Fulfillment & SLA Analytics',
  description:
    'Track fulfillment performance, predict SLA breaches, and surface prioritized playbooks for warehouse, logistics, and operations teams using a backend-driven analytics workflow.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue',
  industry: 'Supply Chain',
  function: 'Order Fulfillment & SLA Analytics',
  tech: 'FastAPI, Pandas, Scikit-learn, Plotly, React',
  contact: 'supplychain@example.com',
  tags: ['Supply Chain', 'SLA', 'Fulfillment', 'Operations'],
  viewRoute: '/projects/order-fulfillment-sla-analytics/full',
}

export function OrderFulfillmentSlaAnalyticsDetailPage() {
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
