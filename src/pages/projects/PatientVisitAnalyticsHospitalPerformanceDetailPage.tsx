import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Patient Visit Analytics & Hospital Performance',
  description:
    'Healthcare analytics workspace for hospital visits, department performance, admission trends, revenue, and patient load forecasting.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue',
  industry: 'Healthcare',
  function: 'Patient Visit Analytics & Admission Prediction',
  tech: 'FastAPI, Pandas, Scikit-learn, Plotly, React',
  contact: 'healthcare@example.com',
  tags: ['Healthcare', 'Patient Analytics', 'Hospital Operations', 'Admission Forecasting'],
  viewRoute: '/projects/patient-visit-analytics-hospital-performance/full',
}

export function PatientVisitAnalyticsHospitalPerformanceDetailPage() {
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
