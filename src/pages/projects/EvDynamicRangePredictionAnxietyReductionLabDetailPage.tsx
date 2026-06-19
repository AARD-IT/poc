import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'EV Dynamic Range Prediction & Anxiety Reduction Lab',
  description:
    'EV analytics workspace for realistic range prediction, anxiety reduction, battery behavior analysis, and driver clustering. It helps EV teams quantify OEM over-promise, spot anxiety-prone trips, and improve charging decisions with ML-driven insights.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue EV',
  industry: 'EV',
  function: 'Range Prediction & Driver Analytics',
  tech: 'FastAPI, Pandas, NumPy, Scikit-learn, Plotly, React',
  contact: 'ev-analytics@example.com',
  tags: ['EV', 'Battery Analytics', 'Range Prediction', 'Driver Analytics', 'AI'],
  viewRoute: '/projects/ev-dynamic-range-prediction-anxiety-reduction-lab/full',
}

export function EvDynamicRangePredictionAnxietyReductionLabDetailPage() {
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

export default EvDynamicRangePredictionAnxietyReductionLabDetailPage