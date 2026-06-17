import type { ProjectRegistryItem } from '@/types/domain'

export const projectRegistry: ProjectRegistryItem[] = [
  {
    id: 'ai-gold-negotiation',
    title: 'AI Gold Negotiation Orchestrator',
    slug: 'ai-gold-negotiation',
    route: '/projects/ai-gold-negotiation',
    category: 'Gen AI',
    description:
      'Gold RFQ-to-quote automation with live MCX pricing, margin calculations, branded PDF output, and guided negotiation workflows.',
    visible: true,
    featured: true,
  },
  {
    id: 'ai-prescription',
    title: 'AI Prescription Generator',
    slug: 'ai-prescription',
    route: '/projects/ai-prescription-detail',
    category: 'Gen AI',
    description:
      'Clinical-style prescription drafting assistant powered by generative AI for fast, compliant medication orders and care plans.',
    visible: true,
    featured: true,
  },
  {
    id: 'healthscope-insights',
    title: 'Healthscope Insights',
    slug: 'healthscope-insights',
    route: '/projects/healthscope-insights-detail',
    category: 'Healthcare',
    description:
      'Healthcare analytics and insights platform for hospital performance, patient trends, revenue, and operational intelligence.',
    visible: true,
    featured: true,
  },
  {
    id: 'intelligent-document-processor',
    title: 'Intelligent Document Processor',
    slug: 'intelligent-document-processor',
    route: '/projects/intelligent-document-processor',
    category: 'Gen AI',
    description:
      'Document triage and OCR workflow for invoices, contracts, signatures, and identity documents with structured extraction.',
    visible: true,
  },
  {
    id: 'machine-failure-predictive-maintenance-lab',
    title: 'Machine Failure & Predictive Maintenance Lab',
    slug: 'machine-failure-predictive-maintenance-lab',
    route: '/projects/machine-failure-predictive-maintenance-lab',
    category: 'Manufacturing',
    description:
      'Machine sensor telemetry and predictive maintenance analytics for failure detection, maintenance prioritization, and downtime reduction.',
    visible: true,
    featured: true,
  },
  {
    id: 'order-to-delivery-analytics-lab',
    title: 'Order-to-Delivery Analytics Lab',
    slug: 'order-to-delivery-analytics-lab',
    route: '/projects/order-to-delivery-analytics-lab',
    category: 'Manufacturing',
    description:
      'Lead-time analytics lab for tracking scheduling delays, production delays, machine delays, dispatch delays, and delivery prediction.',
    visible: true,
    featured: true,
  },
  {
    id: 'inventory-pileup-shortage-analytics-lab',
    title: 'Inventory Pileup & Shortage Analytics Lab',
    slug: 'inventory-pileup-shortage-analytics-lab',
    route: '/projects/inventory-pileup-shortage-analytics-lab',
    category: 'Manufacturing',
    description:
      'Inventory analytics lab for tracking demand, production, procurement, safety stock risks, shortage and pileup events, and inventory strategy simulation.',
    visible: true,
    featured: true,
  },
  {
    id: 'route-optimization-logistics-efficiency',
    title: 'Route Optimization & Logistics Efficiency',
    slug: 'route-optimization-logistics-efficiency',
    route: '/projects/route-optimization-logistics-efficiency',
    category: 'Supply Chain',
    description:
      'FastAPI-powered route optimization and logistics intelligence platform with cost simulation, anomaly detection, EDA charts, and action playbooks.',
    visible: true,
    featured: true,
  },
  {
    id: 'multimodal-rag',
    title: 'Multimodal RAG System',
    slug: 'multimodal-rag',
    route: '/projects/multimodal-rag',
    category: 'Gen AI',
    description:
      'Retrieval-augmented generation system that processes text and images for intelligent document understanding and knowledge insights.',
    visible: true,
  },
  {
    id: 'offer-letter-generator',
    title: 'Offer Letter Generator',
    slug: 'offer-letter-generator',
    route: '/projects/offerletter-generator',
    category: 'HR',
    description:
      'AI-powered HR automation tool for generating offer letters, internship certificates, and downloadable employment documents instantly.',
    visible: true,
  },
  {
    id: 'pii-redaction',
    title: 'PII Redaction Engine',
    slug: 'pii-redaction',
    route: '/projects/pii-redaction',
    category: 'Gen AI',
    description:
      'Automated redaction pipeline for identifying and masking personally identifiable information from documents at scale.',
    visible: true,
  },
  {
    id: 'real-estate-demand-forecasting-lab',
    title: 'Real Estate Demand Forecasting Lab',
    slug: 'real-estate-demand-forecasting-lab',
    route: '/projects/real-estate-demand-forecasting-lab',
    category: 'Real Estate',
    description:
      'Demand forecasting platform for real estate markets with price trends, monthly projections, and property analytics.',
    visible: true,
  },
  {
    id: 'real-estate-intelligence-suite',
    title: 'Real Estate Intelligence Suite',
    slug: 'real-estate-intelligence-suite',
    route: '/projects/real-estate-intelligence-suite',
    category: 'Real Estate',
    description:
      'Integrated real estate analytics suite for listings, market intelligence, and property performance dashboards.',
    visible: true,
  },
  {
    id: 'sentiment-analyzer',
    title: 'AI Customer Feedback Analyzer',
    slug: 'sentiment-analyzer',
    route: '/projects/sentiment-analyzer',
    category: 'Gen AI',
    description:
      'Feedback analysis platform for sentiment, tone classification, and batch processing of customer responses.',
    visible: true,
  },
]

export function getProjectBySlug(slug: string): ProjectRegistryItem | null {
  return projectRegistry.find((project) => project.slug === slug) ?? null
}

export function getAllProjects(): ProjectRegistryItem[] {
  return [...projectRegistry]
}

export function getVisibleProjects(): ProjectRegistryItem[] {
  return projectRegistry.filter((project) => project.visible)
}

export function getProjectByRoute(route: string): ProjectRegistryItem | null {
  return projectRegistry.find((project) => project.route === route) ?? null
}

export function getProjectSlugs(): string[] {
  return projectRegistry.map((project) => project.slug)
}
