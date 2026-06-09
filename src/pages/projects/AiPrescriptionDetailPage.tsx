import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const poc = {
  title: 'AI Prescription Generator',
  description:
    'Intelligent prescription generation platform powered by generative AI that assists clinicians and career counsellors in producing accurate, personalised data-career prescriptions — with real-time domain-specific content, PDF/Word export, and direct email delivery.',
  date: 'Updated May 15, 2026',
  client: 'MedTech Innovations',
  industry: 'Gen AI',
  function: 'AI & Automation',
  tech: 'Gen AI, Python, LLM',
  contact: 'health-ai@example.com',
  tags: ['Gen AI', 'AI', 'Automation'],
  viewRoute: '/projects/ai-prescription',
}

export function AiPrescriptionDetailPage() {
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

      <ProjectDetailCard project={poc} />
    </div>
  )
}
