import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'AI Gold Negotiation Orchestrator',
  description:
    'Automated RFQ-to-quote gold pricing and negotiation system that reads buyer RFQs, matches product SKUs, fetches live MCX gold pricing, calculates transparent quotes, generates branded PDFs, and manages multi-stage buyer negotiation workflows.',
  date: 'Updated May 2026',
  client: 'Analytics Avenue',
  industry: 'Gen AI',
  function: 'AI Negotiation Automation',
  tech: 'Python, Gen AI, ChromaDB, Live MCX',
  contact: 'gold-ai@example.com',
  tags: ['Gen AI', 'Negotiation', 'PDF', 'Pricing'],
  viewRoute: '/projects/ai-gold-negotiation/full',
  secondaryLabel: 'Streamlit',
  secondaryHref: 'https://aigold-gjdv9gbdfzvgbupq7z5qju.streamlit.app/',
}

export function AiGoldNegotiationDetailPage() {
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
