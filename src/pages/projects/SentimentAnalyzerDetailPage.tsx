import { useNavigate } from 'react-router'
import ProjectDetailCard from '@/components/projects/ProjectDetailCard'

const project = {
  title: 'AI Customer Feedback Analyzer',
  description:
    'Sentiment and tone categorization platform for large-scale customer feedback analysis using Gemini 2.5 Pro. It detects sentiment, identifies dominant tones, generates AI explanations, and produces downloadable analysis reports for rapid business action.',
  date: 'Updated May 2026',
  client: 'Analytics Avenue',
  industry: 'Gen AI',
  function: 'Feedback Analytics & AI',
  tech: 'Gen AI, Python, LLM',
  contact: 'feedback-ai@example.com',
  tags: ['Gen AI', 'Customer Feedback', 'Sentiment', 'Tone Analysis', 'Analytics'],
}

export function SentimentAnalyzerDetailPage() {
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

      <ProjectDetailCard project={{ ...project, viewRoute: '/projects/sentiment-analyzer/full' }} />
    </div>
  )
}
