import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'Intelligent Document Processor (IDP)',
  description:
    'AI-powered document triage and extraction engine for invoices, contracts, identity documents, and signature verification. Supports file upload, OCR processing, structured JSON output, and internal demo mode for rapid evaluation.',
  date: 'Updated May 2026',
  client: 'Analytics Avenue',
  industry: 'Gen AI',
  function: 'Document Triage & Extraction',
  tech: 'FastAPI, OpenCV, OCR, LLM, Python',
  contact: 'idp@example.com',
  tags: ['Gen AI', 'OCR', 'Signature Verification', 'Automation'],
  viewRoute: '/projects/intelligent-document-processor/full',
}

export function IntelligentDocumentProcessorDetailPage() {
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
