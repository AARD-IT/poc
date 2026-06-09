import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const poc = {
  title: 'Offer Letter Generator',
  description:
    'Intelligent HR automation platform for generating professional pre-offer letters, offer letters, internship completion certificates, and downloadable HR documents with dynamic compensation structures and customizable templates.',
  date: 'Updated May 2026',
  client: 'Internal HR Automation',
  industry: 'HR',
  function: 'Automation & Document Generation',
  tech: 'Streamlit, Python, Gen AI',
  contact: 'hr-automation@example.com',
  tags: ['HR', 'AI', 'Documents', 'Automation'],
  viewRoute: '/projects/offerletter-generator/full',
  secondaryLabel: 'Streamlit',
  secondaryHref: 'https://offerletter.streamlit.app/',
}

export function OfferLetterDetailPage() {
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
