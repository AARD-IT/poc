import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Order-to-Delivery Analytics Lab',
  description:
    'Analyze the complete order lifecycle from order creation to delivery, pinpoint bottlenecks, and predict lead-time outcomes with ML-driven insights.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue',
  industry: 'Manufacturing',
  function: 'Order-to-Delivery Analytics & Lead Time Prediction',
  tech: 'FastAPI, Pandas, Scikit-learn, Plotly, React',
  contact: 'manufacturing@example.com',
  tags: ['Manufacturing', 'Order-to-Delivery', 'Lead Time', 'AutoML'],
  viewRoute: '/projects/order-to-delivery-analytics-lab/full',
}

export function OrderToDeliveryAnalyticsLabDetailPage() {
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
