import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const poc = {
  title: 'Automated PII Redaction Solution (Gen AI)',
  description: 'Redact Personal Identifiable Information from Documents using Generative AI',
  date: 'Updated May 2026',
  client: 'Data Privacy & Compliance',
  industry: 'Gen AI',
  function: 'Document Redaction & Compliance',
  tech: 'GPT-4o Vision, Python, OCR, Pydantic',
  contact: 'pii-redaction@example.com',
  tags: ['Gen AI', 'Data Privacy', 'Compliance', 'Documents', 'Vision'],
}

export function PiiRedactionDetailPage() {
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

      <ProjectDetailCard project={{ ...poc, viewRoute: '/projects/pii-redaction/full' }} />
    </div>
  )
}
