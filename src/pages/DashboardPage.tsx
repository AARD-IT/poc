import { useNavigate } from 'react-router'
import { ControlBar } from '@/app/components/ControlBar'
import { SolutionCard } from '@/app/components/SolutionCard'
import { EnterpriseEmpty } from '@/components/empty-states/EnterpriseEmpty'
import { RealEstateIntelligenceSuiteCard } from '@/components/RealEstateIntelligenceSuiteCard'
import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const profileLoading = useAuthStore((s) => s.profileLoading)
  const profileError = useAuthStore((s) => s.profileError)

  if (profileLoading && !profile) {
    return (
      <div className="p-6">
        <div className="text-[15px] font-medium text-[#475569] py-12 text-center">Loading your workspace…</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <EnterpriseEmpty
          title="Profile unavailable"
          description={
            profileError ??
            'Your session is active but no platform profile was found. Please contact an administrator.'
          }
        />
      </div>
    )
  }

  if (profile.status === 'pending') {
    return (
      <div className="p-6">
        <EnterpriseEmpty
          title="Account under review"
          description="Your account is under admin review. Please wait until access is granted."
        />
      </div>
    )
  }

  if (profile.status === 'rejected') {
    return (
      <div className="p-6">
        <EnterpriseEmpty
          title="Access not granted"
          description="Your registration was not approved for this workspace. If you believe this is a mistake, please contact your Analytics Avenue administrator."
        />
      </div>
    )
  }

  const aiPrescriptionCard = (
    <SolutionCard
      key="ai-prescription-generator"
      rank={1}
      title="AI Prescription Generator"
      description="Clinical-style prescription drafting assistant powered by generative AI. Opens the live Streamlit demo in your workspace."
      tags={['Gen AI', 'Healthcare', 'Streamlit', 'Demo']}
      date="Updated May 14, 2026"
      featured
      onClick={() => navigate('/projects/ai-prescription-detail')}
    />
  )

  const offerLetterCard = (
    <SolutionCard
      key="offer-letter-generator"
      rank={2}
      title="Offer Letter Generator"
      description="AI-powered HR automation tool for generating pre-offer letters, offer letters, internship certificates, and downloadable HR documents instantly."
      tags={['HR Automation', 'Gen AI', 'Streamlit', 'Documents']}
      date="Updated May 2026"
      featured
      onClick={() => navigate('/projects/offerletter-generator')}
    />
  )

  const sentimentAnalyzerCard = (
    <SolutionCard
      key="sentiment-analyzer"
      rank={3}
      title="AI Customer Feedback Analyzer"
      description="Sentiment and tone categorization platform for large-scale customer feedback analysis with Excel upload, batch processing, and CSV export."
      tags={['Gen AI', 'Customer Feedback', 'Sentiment', 'Tone Analysis']}
      date="Updated May 2026"
      onClick={() => navigate('/projects/sentiment-analyzer')}
    />
  )

  const idpCard = (
    <SolutionCard
      key="intelligent-document-processor"
      rank={4}
      title="Intelligent Document Processor (IDP)"
      description="AI document triage and OCR workflow for invoices, contracts, signatures, and identity documents with structured extraction."
      tags={['Document AI', 'OCR', 'Signature', 'Automation', 'Gen AI']}
      date="Updated May 2026"
      onClick={() => navigate('/projects/intelligent-document-processor')}
    />
  )

  const piiRedactionCard = (
    <SolutionCard
      key="pii-redaction"
      rank={5}
      title="Automated PII Redaction Solution (Gen AI)"
      description="Redact Personal Identifiable Information from documents using GPT-4o vision and structured compliance workflows."
      tags={['Gen AI', 'Data Privacy', 'Compliance', 'Documents']}
      date="Updated May 2026"
      onClick={() => navigate('/projects/pii-redaction')}
    />
  )

  const goldNegotiationCard = (
    <SolutionCard
      key="ai-gold-negotiation"
      rank={5}
      title="AI Gold Negotiation Orchestrator"
      description="Gold RFQ to quote automation with live MCX pricing, transparent 30% pre-GST margin calculation, branded PDF output, and auto-negotiation workflows."
      tags={['Gen AI', 'Commodities', 'Pricing', 'PDF']}
      date="Updated May 2026"
      onClick={() => navigate('/projects/ai-gold-negotiation')}
    />
  )

  const multimodalRAGCard = (
    <SolutionCard
      key="multimodal-rag"
      rank={4}
      title="Multimodal RAG System"
      description="Advanced Retrieval-Augmented Generation system that processes both text and images for intelligent document understanding and knowledge management."
      tags={['Gen AI', 'RAG', 'Multimodal', 'Streamlit']}
      date="Updated May 2026"
      onClick={() => navigate('/projects/multimodal-rag')}
    />
  )


  const realEstateIntelligenceSuiteCard = <RealEstateIntelligenceSuiteCard />

  const solutionGrid = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {aiPrescriptionCard}
      {offerLetterCard}
      {sentimentAnalyzerCard}
      {idpCard}
      {goldNegotiationCard}
      {piiRedactionCard}
      {multimodalRAGCard}
      {realEstateIntelligenceSuiteCard}
    </div>
  )

  return (
    <div className="p-6">
      <ControlBar />
      {solutionGrid}
    </div>
  )
}
