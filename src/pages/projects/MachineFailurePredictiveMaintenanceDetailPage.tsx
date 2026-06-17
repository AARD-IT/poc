import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Machine Failure & Predictive Maintenance Lab',
  description:
    'Monitor machine sensor telemetry, isolate early failure signals, and predict breakdown risk with ML-driven maintenance insights for manufacturing operations.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue',
  industry: 'Manufacturing',
  function: 'Predictive Maintenance & Failure Analytics',
  tech: 'FastAPI, Pandas, Scikit-learn, Plotly, React',
  contact: 'manufacturing@example.com',
  tags: ['Manufacturing', 'Predictive Maintenance', 'Failure Prediction', 'ML'],
  viewRoute: '/projects/machine-failure-predictive-maintenance-lab/full',
}

export function MachineFailurePredictiveMaintenanceDetailPage() {
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
