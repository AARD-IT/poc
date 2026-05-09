import { useState } from 'react';
import { Header } from './components/Header';
import { FilterSidebar } from './components/FilterSidebar';
import { ControlBar } from './components/ControlBar';
import { SolutionCard } from './components/SolutionCard';
import { SolutionModal } from './components/SolutionModal';

interface Solution {
  id: number;
  rank: number;
  title: string;
  description: string;
  tags: string[];
  date: string;
  featured?: boolean;
  client: string;
  industry: string;
  function: string;
  tech: string;
  contact: string;
}

const solutions: Solution[] = [
  {
    id: 1,
    rank: 1,
    title: 'AI Financial Intelligence Dashboard',
    description: 'Advanced analytics platform leveraging machine learning to provide real-time insights into financial performance, risk assessment, and predictive modeling for enterprise finance teams.',
    tags: ['AI', 'Finance', 'Analytics', 'Dashboard', 'Power BI'],
    date: 'Updated May 5, 2026',
    featured: true,
    client: 'Global Bank Corp',
    industry: 'Finance',
    function: 'Data Analytics',
    tech: 'AI, Power BI, Python',
    contact: 'analytics@example.com',
  },
  {
    id: 2,
    rank: 2,
    title: 'Predictive Analytics Hub',
    description: 'Comprehensive forecasting solution that combines historical data analysis with AI-driven predictions to help businesses make informed strategic decisions.',
    tags: ['AI', 'Analytics', 'Python', 'Dashboard'],
    date: 'Updated May 3, 2026',
    client: 'TechVenture Inc',
    industry: 'Retail',
    function: 'Forecasting',
    tech: 'Python, Tableau',
    contact: 'support@example.com',
  },
  {
    id: 3,
    rank: 3,
    title: 'Healthcare Claims Automation',
    description: 'Intelligent automation system that streamlines healthcare claims processing using AI and machine learning, reducing processing time by 80% while improving accuracy.',
    tags: ['Gen AI', 'Healthcare', 'Automation', 'AI'],
    date: 'Updated May 1, 2026',
    client: 'MediCare Solutions',
    industry: 'Healthcare',
    function: 'Automation',
    tech: 'Gen AI, Python, Automation',
    contact: 'healthcare@example.com',
  },
  {
    id: 4,
    rank: 4,
    title: 'Retail Demand Forecasting Engine',
    description: 'AI-powered demand forecasting tool that analyzes market trends, seasonal patterns, and consumer behavior to optimize inventory management and reduce stockouts.',
    tags: ['AI', 'Retail', 'Analytics', 'Python'],
    date: 'Updated Apr 28, 2026',
    featured: true,
    client: 'RetailMax Group',
    industry: 'Retail',
    function: 'Forecasting',
    tech: 'AI, Python',
    contact: 'retail@example.com',
  },
  {
    id: 5,
    rank: 5,
    title: 'Executive KPI Dashboard',
    description: 'Real-time executive dashboard providing comprehensive visibility into key performance indicators across all business units with customizable metrics and drill-down capabilities.',
    tags: ['Dashboard', 'Analytics', 'Power BI', 'Demo'],
    date: 'Updated Apr 25, 2026',
    client: 'Enterprise Corp',
    industry: 'Finance',
    function: 'Reporting',
    tech: 'Power BI, Tableau',
    contact: 'exec@example.com',
  },
  {
    id: 6,
    rank: 6,
    title: 'Gen AI Knowledge Assistant',
    description: 'Intelligent knowledge management system powered by generative AI that helps employees quickly find information, generate reports, and automate documentation tasks.',
    tags: ['Gen AI', 'AI', 'Automation', 'Demo'],
    date: 'Updated Apr 22, 2026',
    client: 'Innovation Labs',
    industry: 'Education',
    function: 'Automation',
    tech: 'Gen AI',
    contact: 'ai@example.com',
  },
  {
    id: 7,
    rank: 7,
    title: 'Customer Churn Prediction Model',
    description: 'Advanced machine learning model that identifies at-risk customers before they churn, enabling proactive retention strategies and improving customer lifetime value.',
    tags: ['AI', 'Analytics', 'Python', 'Finance'],
    date: 'Updated Apr 20, 2026',
    client: 'TelecomGlobal',
    industry: 'Finance',
    function: 'Data Analytics',
    tech: 'AI, Python',
    contact: 'ml@example.com',
  },
  {
    id: 8,
    rank: 8,
    title: 'Invoice OCR Automation System',
    description: 'Optical character recognition solution that automatically extracts data from invoices, purchase orders, and receipts, eliminating manual data entry and reducing errors.',
    tags: ['Automation', 'AI', 'Finance', 'Legal'],
    date: 'Updated Apr 18, 2026',
    client: 'AccountingPro',
    industry: 'Finance',
    function: 'Automation',
    tech: 'AI, Automation',
    contact: 'ocr@example.com',
  },
  {
    id: 9,
    rank: 9,
    title: 'ESG Analytics Tracker',
    description: 'Environmental, Social, and Governance analytics platform that tracks sustainability metrics, generates compliance reports, and provides benchmarking against industry standards.',
    tags: ['Analytics', 'Dashboard', 'Finance', 'Power BI'],
    date: 'Updated Apr 15, 2026',
    featured: true,
    client: 'GreenFuture Inc',
    industry: 'Manufacturing',
    function: 'Reporting',
    tech: 'Power BI, Python',
    contact: 'esg@example.com',
  },
  {
    id: 10,
    rank: 10,
    title: 'Supply Chain Optimizer',
    description: 'AI-driven supply chain optimization platform that reduces costs, improves delivery times, and enhances visibility across the entire logistics network using predictive analytics.',
    tags: ['AI', 'Analytics', 'Automation', 'Retail'],
    date: 'Updated Apr 12, 2026',
    client: 'LogisticsXpert',
    industry: 'Manufacturing',
    function: 'Data Analytics',
    tech: 'AI, Python, Automation',
    contact: 'supply@example.com',
  },
];

export default function App() {
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Header />

      <div className="flex h-[calc(100vh-57px)]">
        <FilterSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <ControlBar />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {solutions.map((solution) => (
                <SolutionCard
                  key={solution.id}
                  rank={solution.rank}
                  title={solution.title}
                  description={solution.description}
                  tags={solution.tags}
                  date={solution.date}
                  featured={solution.featured}
                  onClick={() => setSelectedSolution(solution)}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      <SolutionModal
        solution={selectedSolution}
        onClose={() => setSelectedSolution(null)}
      />
    </div>
  );
}