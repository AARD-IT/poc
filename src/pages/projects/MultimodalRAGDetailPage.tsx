import { useNavigate } from 'react-router'
import { tagColors } from '@/utils/tagColors'

const poc = {
  title: 'Multimodal RAG System',
  description: 'Advanced Retrieval-Augmented Generation system that processes both text and images for intelligent document understanding.',
  date: 'Updated May 2026',
  client: 'Enterprise AI Solutions',
  industry: 'Gen AI / Knowledge Management',
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

      <div className="relative bg-white rounded-2xl w-full border-[1.5px] border-[#CBD5E1] shadow-lg">
        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-3xl font-bold text-[#1E293B] mb-5 leading-tight pr-8">
                {poc.title}
              </h2>
              <p className="text-[16px] font-medium text-[#475569] mb-8 leading-relaxed">
                {poc.description}
              </p>
              <button
                type="button"
                onClick={() => navigate('/projects/multimodal-rag/full')}
                className="px-8 py-3.5 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D5F58] transition-all font-bold text-[15px] shadow-md hover:shadow-lg"
              >
                View Full Details
              </button>
            </div>

            <div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-5">Solution Details</h3>
              <div className="space-y-4">
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Updated</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{poc.date}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Client</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{poc.client}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Industry</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{poc.industry}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Function</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{poc.function}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Tech</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{poc.tech}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Contact</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{poc.contact}</span>
                </div>
              </div>

              <div className="mt-7">
                <h4 className="font-bold text-[#1E293B] mb-3 text-[15px]">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {poc.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-semibold ${tagColors[tag] || 'bg-[#E2E8F0] text-[#475569]'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
