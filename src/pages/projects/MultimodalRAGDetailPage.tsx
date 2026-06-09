import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const poc = {
  title: 'Multimodal RAG System',
  description: 'Advanced Retrieval-Augmented Generation system that processes both text and images for intelligent document understanding.',
  date: 'Updated May 2026',
  client: 'Enterprise AI Solutions',
  industry: 'Gen AI',
  function: 'Multimodal Document Processing & RAG',
  tech: 'Streamlit, Python, LLM, Vision Models',
  contact: 'rag@example.com',
  tags: ['Gen AI', 'RAG', 'Multimodal', 'Streamlit', 'Document Processing'],
}

export function MultimodalRAGDetailPage() {
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

      <ProjectDetailCard
        project={{
          ...poc,
          viewRoute: '/projects/multimodal-rag/full',
          secondaryLabel: 'Streamlit',
          secondaryHref: 'https://multimodalrag-master-qlv3gx8ntcfradnltky7qj.streamlit.app/',
        }}
      />
    </div>
  )
}
