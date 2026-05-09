import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Solution {
  id: number;
  title: string;
  description: string;
  tags: string[];
  date: string;
  client: string;
  industry: string;
  function: string;
  tech: string;
  contact: string;
}

interface SolutionModalProps {
  solution: Solution | null;
  onClose: () => void;
}

const tagColors: Record<string, string> = {
  AI: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',
  'Gen AI': 'bg-[#EDE9FE] text-[#6D28D9] border-[#C4B5FD]',
  Analytics: 'bg-[#E0E7FF] text-[#4338CA] border-[#A5B4FC]',
  Finance: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
  Healthcare: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]',
  Retail: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]',
  Dashboard: 'bg-[#E0E7FF] text-[#4F46E5] border-[#A5B4FC]',
  Automation: 'bg-[#FCE7F3] text-[#BE185D] border-[#F9A8D4]',
  'Power BI': 'bg-[#FEF3C7] text-[#A16207] border-[#FDE68A]',
  Python: 'bg-[#CCFBF1] text-[#0F766E] border-[#5EEAD4]',
  Demo: 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]',
  Legal: 'bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE]',
};

export function SolutionModal({ solution, onClose }: SolutionModalProps) {
  useEffect(() => {
    if (solution) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [solution]);

  if (!solution) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-[#475569]" />
        </button>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-3xl font-bold text-[#1E293B] mb-5 leading-tight pr-8">
                {solution.title}
              </h2>

              <p className="text-[16px] font-medium text-[#475569] mb-8 leading-relaxed">
                {solution.description}
              </p>

              <button className="px-8 py-3.5 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D5F58] transition-all font-bold text-[15px] shadow-md hover:shadow-lg">
                View Full Details
              </button>
            </div>

            <div>
              <h3 className="font-bold text-[#1E293B] text-lg mb-5">Solution Details</h3>

              <div className="space-y-4">
                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Updated</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{solution.date}</span>
                </div>

                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Client</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{solution.client}</span>
                </div>

                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Industry</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{solution.industry}</span>
                </div>

                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Function</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{solution.function}</span>
                </div>

                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Tech</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{solution.tech}</span>
                </div>

                <div className="flex border-b-[1.5px] border-[#CBD5E1] pb-3">
                  <span className="text-[15px] font-bold text-[#475569] w-32">Contact</span>
                  <span className="text-[15px] font-semibold text-[#1E293B]">{solution.contact}</span>
                </div>
              </div>

              <div className="mt-7">
                <h4 className="font-bold text-[#1E293B] mb-3 text-[15px]">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {solution.tags.map((tag) => (
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
  );
}
