import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'PatientFlow Navigator',
  description:
    'Healthcare analytics workspace for patient journeys, readmission risk, treatment cost dynamics, and hospital capacity planning. It combines cohort profiling, filtering, charting, and model-driven insights in one tabbed experience.',
  date: 'Updated Jun 2026',
  client: 'Analytics Avenue',
  industry: 'Healthcare',
  function: 'Patient Journey Analytics & Capacity Planning',
  tech: 'React, FastAPI, Pandas, Plotly, Scikit-learn',
  contact: 'healthcare@example.com',
  tags: ['Healthcare', 'Patient Flow', 'Clinical Intelligence', 'Readmission Risk', 'Predictive Analytics'],
  viewRoute: '/projects/patientflow-navigator/full',
}

export function PatientFlowNavigatorDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-5xl p-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 text-[14px] font-bold text-[#0284C7] hover:underline">
        ← Back
      </button>

      <ProjectDetailCard project={project} />

      <section className="mt-6 rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F766E]">How it was created</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#0F172A]">Project build path</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#64748B]">Step 1</p>
            <p className="mt-2 text-[15px] leading-6 text-[#334155]">Connected the frontend to the healthcare3 FastAPI backend and added the environment key.</p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#64748B]">Step 2</p>
            <p className="mt-2 text-[15px] leading-6 text-[#334155]">Built the project card and detail card to match the existing analytics marketplace UI.</p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#64748B]">Step 3</p>
            <p className="mt-2 text-[15px] leading-6 text-[#334155]">Created a three-tab application for overview, required attributes, and dataset workflow.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PatientFlowNavigatorDetailPage