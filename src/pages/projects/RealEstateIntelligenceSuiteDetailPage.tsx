import { useNavigate } from 'react-router'
import { tagColors } from '@/utils/tagColors'

const project = {
  title: 'Real Estate Intelligence Suite',
  description:
    'AI-powered real estate analytics platform for property valuation, market insights, and predictive investment recommendations. Designed to turn location, property, and pricing data into investor-ready visualizations and forecasts.',
  date: 'Updated May 2026',
  client: 'Analytics Avenue Real Estate',
  industry: 'PropTech',
  function: 'Real Estate Analytics',
  tech: 'FastAPI, Python, Pandas, scikit-learn, Plotly, React',
  contact: 'realestate@analyticsavenue.com',
  tags: ['Gen AI', 'Analytics', 'Real Estate', 'Automation', 'AI'],
}

export function RealEstateIntelligenceSuiteDetailPage() {
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
              <h2 className="text-3xl font-bold text-[#1E293B] mb-5 leading-tight">{project.title}</h2>
              <p className="text-[16px] font-medium text-[#475569] mb-8 leading-relaxed">
                {project.description}
              </p>
              <div className="flex flex-wrap items-center gap-3">
<div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/projects/real-estate-intelligence-suite/section')}
                  className="px-8 py-3.5 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D5F58] transition-all font-bold text-[15px] shadow-md hover:shadow-lg"
                >
                  View Full Details
                </button>
                <a
                  href="https://analytics-avenue.streamlit.app/usecase_real_estate_1"
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-3.5 text-[#0F5666] border border-[#0F766E] rounded-lg hover:bg-[#ECFDF5] transition-all font-bold text-[15px] shadow-sm"
                >
                  Streamlit
                </a>
              </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-5">Solution Details</h3>
              <div className="space-y-4">
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Updated</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{project.date}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Client</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{project.client}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Industry</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{project.industry}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Function</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{project.function}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Tech</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{project.tech}</span>
                </div>
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Contact</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{project.contact}</span>
                </div>
              </div>

              <div className="mt-7">
                <h4 className="font-bold text-[#1E293B] mb-3 text-[15px]">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 text-sm font-bold rounded-md border ${
                        tagColors[tag] || 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]'
                      }`}
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
